import { prisma } from '../../config/prisma';
import { getMonthBounds } from '../../utils/dateHelpers';
import { calcVehicleROI } from '../../utils/calcHelpers';
import { DriverStatus } from '@prisma/client';

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

/**
 * DASHBOARD KPI SUMMARY
 * Single endpoint called by the Command Center page.
 * Uses a parallel transaction for performance — all queries run simultaneously.
 */
export const getDashboardKPIs = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    activeFleet,
    maintenanceAlerts,
    totalActiveVehicles,
    pendingCargo,
    recentTrips,
    expiringLicenses,
    suspendedDrivers,
    fleetByStatus,
  ] = await prisma.$transaction([
    // Active fleet = vehicles ON_TRIP
    prisma.vehicle.count({ where: { status: 'ON_TRIP', isActive: true } }),

    // Maintenance alerts = vehicles IN_SHOP
    prisma.vehicle.count({ where: { status: 'IN_SHOP', isActive: true } }),

    // Total non-retired vehicles (for utilization rate denominator)
    prisma.vehicle.count({ where: { isActive: true, status: { not: 'RETIRED' } } }),

    // Pending cargo = DRAFT trips waiting for dispatch
    prisma.trip.count({ where: { status: 'DRAFT' } }),

    // Last 10 trips for the dashboard table
    prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, tripNumber: true, origin: true, destination: true,
        status: true, createdAt: true, dispatchedAt: true,
        vehicle: { select: { id: true, licensePlate: true, type: true } },
        driver: { select: { id: true, name: true } },
      },
    }),

    // Drivers with license expiring in next 30 days (compliance alert)
    prisma.driver.count({
      where: {
        isActive: true,
        licenseExpiryDate: { gte: now, lte: thirtyDaysFromNow },
      },
    }),

    // Suspended drivers count
    prisma.driver.count({ where: { isActive: true, status: DriverStatus.SUSPENDED } }),

    // Fleet breakdown by status (for the pie chart)
    prisma.vehicle.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: { id: true },
    }),
  ]);

  // Utilization rate = ON_TRIP / (all non-retired) * 100
  const utilizationRate = totalActiveVehicles > 0
    ? Math.round((activeFleet / totalActiveVehicles) * 10000) / 100
    : 0;

  // Format fleet breakdown as a clean object
  const fleetBreakdown = Object.fromEntries(
    fleetByStatus.map((g) => [g.status, g._count.id])
  );

  return {
    kpis: {
      activeFleet,
      maintenanceAlerts,
      utilizationRate,
      pendingCargo,
      expiringLicenses,
      suspendedDrivers,
      totalActiveVehicles,
    },
    recentTrips,
    fleetBreakdown,
  };
};

// ─── Fleet Analytics ──────────────────────────────────────────────────────────

/**
 * FLEET PERFORMANCE REPORT
 * Per-vehicle breakdown with fuel efficiency, costs, ROI.
 * This is the data for the analytics page charts and tables.
 */
export const getFleetAnalytics = async () => {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    select: {
      id: true, licensePlate: true, make: true, model: true,
      type: true, acquisitionCost: true, odometerKm: true,
      trips: {
        where: { status: 'COMPLETED' },
        select: { odometerStart: true, odometerEnd: true, revenueGenerated: true },
      },
      maintenanceLogs: {
        select: { cost: true },
      },
      fuelLogs: {
        select: { liters: true, totalCost: true, odometerKm: true },
        orderBy: { odometerKm: 'asc' },
      },
    },
  });

  const vehicleStats = vehicles.map((v) => {
    const totalRevenue = v.trips.reduce((s, t) => s + Number(t.revenueGenerated ?? 0), 0);
    const totalMaintenanceCost = v.maintenanceLogs.reduce((s, m) => s + Number(m.cost), 0);
    const totalFuelCost = v.fuelLogs.reduce((s, f) => s + Number(f.totalCost), 0);
    const totalFuelLiters = v.fuelLogs.reduce((s, f) => s + Number(f.liters), 0);
    const totalOperationalCost = totalMaintenanceCost + totalFuelCost;

    // Fuel efficiency = total km driven / total liters consumed
    const kmDriven = v.trips.reduce((s, t) => {
      if (t.odometerStart && t.odometerEnd) {
        return s + (Number(t.odometerEnd) - Number(t.odometerStart));
      }
      return s;
    }, 0);

    const fuelEfficiency = totalFuelLiters > 0 && kmDriven > 0
      ? Math.round((kmDriven / totalFuelLiters) * 100) / 100
      : null;

    const roi = calcVehicleROI(
      totalRevenue,
      totalMaintenanceCost,
      totalFuelCost,
      Number(v.acquisitionCost)
    );

    return {
      id: v.id,
      licensePlate: v.licensePlate,
      name: `${v.make} ${v.model}`,
      type: v.type,
      odometerKm: Number(v.odometerKm),
      totalTrips: v.trips.length,
      kmDriven,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalOperationalCost: Math.round(totalOperationalCost * 100) / 100,
      fuelEfficiency,
      roi,
    };
  });

  return vehicleStats;
};

// ─── Financial Report ─────────────────────────────────────────────────────────

/**
 * MONTHLY FINANCIAL REPORT
 * Revenue, costs, net profit for a given month.
 * Used for the financial summary table and monthly charts.
 */
export const getFinancialReport = async (month?: string) => {
  const now = new Date();
  const targetMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { start, end } = getMonthBounds(targetMonth);

  const [completedTrips, maintenanceLogs, fuelLogs] = await prisma.$transaction([
    prisma.trip.findMany({
      where: { status: 'COMPLETED', completedAt: { gte: start, lte: end } },
      select: {
        id: true, tripNumber: true, revenueGenerated: true,
        origin: true, destination: true, completedAt: true,
        vehicle: { select: { licensePlate: true } },
        driver: { select: { name: true } },
      },
    }),
    prisma.maintenance.findMany({
      where: { serviceDate: { gte: start, lte: end } },
      select: { cost: true, serviceType: true, vehicle: { select: { licensePlate: true } } },
    }),
    prisma.fuelLog.findMany({
      where: { loggedAt: { gte: start, lte: end } },
      select: { totalCost: true, liters: true, vehicle: { select: { licensePlate: true } } },
    }),
  ]);

  const totalRevenue = completedTrips.reduce((s, t) => s + Number(t.revenueGenerated ?? 0), 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((s, m) => s + Number(m.cost), 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + Number(f.totalCost), 0);
  const totalCost = totalMaintenanceCost + totalFuelCost;
  const netProfit = totalRevenue - totalCost;

  return {
    month: targetMonth,
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      completedTrips: completedTrips.length,
      totalLiters: Math.round(fuelLogs.reduce((s, f) => s + Number(f.liters), 0) * 100) / 100,
    },
    trips: completedTrips,
    maintenanceLogs,
    fuelLogs,
  };
};

// ─── Last 6 Months Trend ─────────────────────────────────────────────────────

/**
 * MONTHLY TREND (last 6 months)
 * Aggregates revenue vs cost per month for the bar chart.
 */
export const getMonthlyTrend = async () => {
  const months: string[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const trend = await Promise.all(
    months.map(async (month) => {
      const report = await getFinancialReport(month);
      return {
        month,
        revenue: report.summary.totalRevenue,
        fuelCost: report.summary.totalFuelCost,
        maintenanceCost: report.summary.totalMaintenanceCost,
        netProfit: report.summary.netProfit,
      };
    })
  );

  return trend;
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

/**
 * GENERATE CSV EXPORT
 * Builds a CSV string of the monthly financial report.
 * No third-party libraries — manual CSV construction.
 */
export const generateCSV = async (month?: string): Promise<{ csv: string; filename: string }> => {
  const report = await getFinancialReport(month);

  const rows: string[] = [
    // Header
    ['Trip #', 'Vehicle', 'Driver', 'Origin', 'Destination', 'Revenue', 'Completed At'].join(','),
    // Data rows
    ...report.trips.map((t) =>
      [
        t.tripNumber,
        t.vehicle.licensePlate,
        t.driver.name,
        `"${t.origin}"`,
        `"${t.destination}"`,
        t.revenueGenerated ?? 0,
        t.completedAt?.toISOString().split('T')[0] ?? '',
      ].join(',')
    ),
    '',
    ['SUMMARY', '', '', '', '', '', ''].join(','),
    ['Total Revenue', report.summary.totalRevenue, '', '', '', '', ''].join(','),
    ['Total Fuel Cost', report.summary.totalFuelCost, '', '', '', '', ''].join(','),
    ['Total Maintenance Cost', report.summary.totalMaintenanceCost, '', '', '', '', ''].join(','),
    ['Net Profit', report.summary.netProfit, '', '', '', '', ''].join(','),
  ];

  return {
    csv: rows.join('\n'),
    filename: `fleetflow-report-${report.month}.csv`,
  };
};