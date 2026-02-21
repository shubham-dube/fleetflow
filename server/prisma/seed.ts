/**
 * FleetFlow — Database Seed File
 * Run with: npm run db:seed
 *
 * Creates realistic sample data for development and demo purposes.
 * All passwords are: FleetFlow@123
 */
import { PrismaClient, VehicleType, VehicleStatus, DriverStatus, LicenseCategory, TripStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FleetFlow database...');

  // ── Clean slate ──────────────────────────────────────────────────────────
  // Delete in dependency order (children before parents)
  await prisma.fuelLog.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.driverIncident.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ── Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('FleetFlow@123', 12);

  const [manager, dispatcher, safetyOfficer, analyst] = await Promise.all([
    prisma.user.create({ data: { name: 'Arjun Sharma', email: 'manager@fleetflow.com', passwordHash, role: 'MANAGER' } }),
    prisma.user.create({ data: { name: 'Priya Nair', email: 'dispatcher@fleetflow.com', passwordHash, role: 'DISPATCHER' } }),
    prisma.user.create({ data: { name: 'Rahul Verma', email: 'safety@fleetflow.com', passwordHash, role: 'SAFETY_OFFICER' } }),
    prisma.user.create({ data: { name: 'Sneha Patel', email: 'analyst@fleetflow.com', passwordHash, role: 'ANALYST' } }),
  ]);
  console.log('  ✓ Created 4 users (password: FleetFlow@123)');

  // ── Vehicles ─────────────────────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { licensePlate: 'MH-05-AB-1234', make: 'TATA', model: 'LPT 1109', year: 2021, type: 'TRUCK', maxCapacityKg: 7500, odometerKm: 45000, acquisitionCost: 1800000, status: 'AVAILABLE' } }),
    prisma.vehicle.create({ data: { licensePlate: 'MH-05-CD-5678', make: 'Mahindra', model: 'Bolero Pik-Up', year: 2022, type: 'VAN', maxCapacityKg: 1200, odometerKm: 28000, acquisitionCost: 950000, status: 'AVAILABLE' } }),
    prisma.vehicle.create({ data: { licensePlate: 'MH-05-EF-9012', make: 'Ashok Leyland', model: 'Dost+', year: 2020, type: 'VAN', maxCapacityKg: 1500, odometerKm: 62000, acquisitionCost: 1100000, status: 'IN_SHOP' } }),
    prisma.vehicle.create({ data: { licensePlate: 'MH-05-GH-3456', make: 'TATA', model: 'Ace Gold', year: 2023, type: 'VAN', maxCapacityKg: 800, odometerKm: 12000, acquisitionCost: 720000, status: 'ON_TRIP' } }),
    prisma.vehicle.create({ data: { licensePlate: 'MH-05-IJ-7890', make: 'Honda', model: 'CB Shine', year: 2022, type: 'BIKE', maxCapacityKg: 50, odometerKm: 18000, acquisitionCost: 85000, status: 'AVAILABLE' } }),
    prisma.vehicle.create({ data: { licensePlate: 'MH-05-KL-2345', make: 'TATA', model: 'Prima 4038.S', year: 2019, type: 'TRUCK', maxCapacityKg: 40000, odometerKm: 120000, acquisitionCost: 3500000, status: 'AVAILABLE' } }),
  ]);
  console.log('  ✓ Created 6 vehicles');

  // ── Drivers ──────────────────────────────────────────────────────────────
  const expiryFuture = new Date('2027-12-31');
  const expiryExpiringSoon = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days from now

  const drivers = await Promise.all([
    prisma.driver.create({ data: { name: 'John Doe', phone: '9876543210', email: 'john@example.com', licenseNumber: 'MH0120210012345', licenseCategory: 'TRUCK', licenseExpiryDate: expiryFuture, status: 'ON_DUTY', safetyScore: 95, totalTrips: 48, completedTrips: 46 } }),
    prisma.driver.create({ data: { name: 'Amit Kumar', phone: '9876543211', email: 'amit@example.com', licenseNumber: 'MH0120210023456', licenseCategory: 'VAN', licenseExpiryDate: expiryFuture, status: 'ON_DUTY', safetyScore: 88, totalTrips: 32, completedTrips: 30 } }),
    prisma.driver.create({ data: { name: 'Suresh Yadav', phone: '9876543212', licenseNumber: 'MH0120210034567', licenseCategory: 'VAN', licenseExpiryDate: expiryExpiringSoon, status: 'ON_DUTY', safetyScore: 72, totalTrips: 25, completedTrips: 22 } }),
    prisma.driver.create({ data: { name: 'Rajesh Singh', phone: '9876543213', licenseNumber: 'MH0120210045678', licenseCategory: 'BIKE', licenseExpiryDate: expiryFuture, status: 'OFF_DUTY', safetyScore: 100, totalTrips: 60, completedTrips: 60 } }),
    prisma.driver.create({ data: { name: 'Mohan Das', phone: '9876543214', licenseNumber: 'MH0120210056789', licenseCategory: 'TRUCK', licenseExpiryDate: expiryFuture, status: 'SUSPENDED', safetyScore: 45, suspendedReason: 'Multiple safety violations in last 30 days', totalTrips: 18, completedTrips: 14 } }),
  ]);
  console.log('  ✓ Created 5 drivers');

  // ── Trips ────────────────────────────────────────────────────────────────
  const trips = await Promise.all([
    prisma.trip.create({ data: {
      tripNumber: 'TRP-00001', vehicleId: vehicles[3]!.id, driverId: drivers[1]!.id,
      createdById: dispatcher.id, origin: 'Mumbai Warehouse', destination: 'Pune Distribution Center',
      cargoWeightKg: 700, cargoDescription: 'FMCG goods', status: 'IN_TRANSIT',
      odometerStart: 12000, dispatchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      revenueGenerated: 8500,
    } }),
    prisma.trip.create({ data: {
      tripNumber: 'TRP-00002', vehicleId: vehicles[0]!.id, driverId: drivers[0]!.id,
      createdById: dispatcher.id, origin: 'Navi Mumbai Depot', destination: 'Nashik Factory',
      cargoWeightKg: 6800, cargoDescription: 'Industrial equipment', status: 'COMPLETED',
      odometerStart: 44000, odometerEnd: 44220, distanceKm: 220,
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      revenueGenerated: 22000,
    } }),
    prisma.trip.create({ data: {
      tripNumber: 'TRP-00003', vehicleId: vehicles[1]!.id, driverId: drivers[2]!.id,
      createdById: dispatcher.id, origin: 'Mumbai Port', destination: 'Thane Warehouse',
      cargoWeightKg: 950, cargoDescription: 'Electronics', status: 'DRAFT',
      odometerStart: 28000,
    } }),
    prisma.trip.create({ data: {
      tripNumber: 'TRP-00004', vehicleId: vehicles[5]!.id, driverId: drivers[0]!.id,
      createdById: manager.id, origin: 'Aurangabad Plant', destination: 'Mumbai Port',
      cargoWeightKg: 35000, cargoDescription: 'Auto parts export', status: 'COMPLETED',
      odometerStart: 115000, odometerEnd: 115480, distanceKm: 480,
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      revenueGenerated: 55000,
    } }),
    prisma.trip.create({ data: {
      tripNumber: 'TRP-00005', vehicleId: vehicles[0]!.id, driverId: drivers[0]!.id,
      createdById: dispatcher.id, origin: 'Pune Hub', destination: 'Solapur Depot',
      cargoWeightKg: 5000, status: 'CANCELLED',
      cancellationReason: 'Customer cancelled the order', cancelledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      odometerStart: 44220,
    } }),
  ]);
  console.log('  ✓ Created 5 trips');

  // ── Maintenance Logs ─────────────────────────────────────────────────────
  await Promise.all([
    prisma.maintenance.create({ data: {
      vehicleId: vehicles[2]!.id, loggedById: manager.id,
      serviceType: 'ENGINE_REPAIR', description: 'Engine overhaul — cylinder head gasket replacement',
      cost: 45000, vendor: 'Ashok Leyland Authorized Service', serviceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      odometerAtService: 62000,
      // completedAt is null → vehicle remains IN_SHOP
    } }),
    prisma.maintenance.create({ data: {
      vehicleId: vehicles[0]!.id, loggedById: safetyOfficer.id,
      serviceType: 'OIL_CHANGE', description: 'Routine oil and filter change',
      cost: 3500, vendor: 'Quick Lube Service', serviceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      odometerAtService: 43800,
    } }),
    prisma.maintenance.create({ data: {
      vehicleId: vehicles[1]!.id, loggedById: manager.id,
      serviceType: 'TIRE_ROTATION', description: 'All 4 tires rotated and pressure checked',
      cost: 1200, serviceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      odometerAtService: 27500,
    } }),
  ]);
  console.log('  ✓ Created 3 maintenance logs');

  // ── Fuel Logs ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0]!.id, tripId: trips[1]!.id, liters: 45.5, costPerLiter: 96.5, totalCost: 4390.75, odometerKm: 44100, driverName: 'John Doe', loggedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[3]!.id, liters: 28.0, costPerLiter: 96.5, totalCost: 2702, odometerKm: 12080, driverName: 'Amit Kumar', loggedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[5]!.id, tripId: trips[3]!.id, liters: 120.0, costPerLiter: 94.0, totalCost: 11280, odometerKm: 115300, driverName: 'John Doe', loggedAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[1]!.id, liters: 22.5, costPerLiter: 96.5, totalCost: 2171.25, odometerKm: 27800, driverName: 'Suresh Yadav', loggedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }),
  ]);
  console.log('  ✓ Created 4 fuel logs');

  // ── Driver Incidents ─────────────────────────────────────────────────────
  await Promise.all([
    prisma.driverIncident.create({ data: { driverId: drivers[4]!.id, description: 'Over-speeding detected by GPS tracker on NH-48 — 92km/h in 70km/h zone', severity: 3, reportedBy: 'GPS System', reportedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) } }),
    prisma.driverIncident.create({ data: { driverId: drivers[4]!.id, description: 'Minor collision at depot gate — vehicle damage ₹15,000', severity: 4, reportedBy: 'Depot Manager', reportedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }),
    prisma.driverIncident.create({ data: { driverId: drivers[2]!.id, description: 'Late delivery — 2 hours behind schedule without communication', severity: 1, reportedBy: 'Customer', reportedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);
  console.log('  ✓ Created 3 driver incidents');

  console.log('\n✅  Seed complete!');
  console.log('\n📋  Login credentials:');
  console.log('  Manager:        manager@fleetflow.com');
  console.log('  Dispatcher:     dispatcher@fleetflow.com');
  console.log('  Safety Officer: safety@fleetflow.com');
  console.log('  Analyst:        analyst@fleetflow.com');
  console.log('  Password (all): FleetFlow@123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); proceSS.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });