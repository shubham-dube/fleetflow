import { VehicleStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { HTTP } from '../../constants/statusCodes';
import { MSG } from '../../constants/messages';
import { parsePagination, buildMeta } from '../../utils/pagination';
import type { Request } from 'express';
import type { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Standard vehicle select — never over-fetch, never return internal-only fields */
const vehicleSelect = {
  id: true,
  licensePlate: true,
  make: true,
  model: true,
  year: true,
  type: true,
  maxCapacityKg: true,
  odometerKm: true,
  status: true,
  acquisitionCost: true,
  notes: true,
  isActive: true,
  retiredAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VehicleSelect;

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * LIST VEHICLES
 * Supports filtering by status, type, isActive + pagination.
 * Default: returns only active (non-retired) vehicles.
 */
export const getAll = async (req: Request) => {
  const { skip, take, page, pageSize } = parsePagination(req);
  const { status, type, isActive } = req.query as Record<string, string>;

  // Build where clause dynamically — only add filter if value exists
  const where: Prisma.VehicleWhereInput = {
    // Default to showing only active vehicles unless explicitly asked for all
    isActive: isActive !== undefined ? isActive === 'true' : true,
    ...(status && { status: status as VehicleStatus }),
    ...(type && { type: type as Prisma.EnumVehicleTypeFilter }),
  };

  const [vehicles, total] = await prisma.$transaction([
    prisma.vehicle.findMany({ where, select: vehicleSelect, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, meta: buildMeta(total, { skip, take, page, pageSize }) };
};

/**
 * GET SINGLE VEHICLE
 */
export const getById = async (id: string) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, isActive: true },
    select: vehicleSelect,
  });

  if (!vehicle) {
    throw new AppError(HTTP.NOT_FOUND, 'VEHICLE_NOT_FOUND', MSG.VEHICLE_NOT_FOUND);
  }

  return vehicle;
};

/**
 * GET VEHICLE HISTORY
 * Returns full operational history: all trips + all maintenance + fuel logs
 * for a single vehicle. Used in vehicle detail page.
 */
export const getHistory = async (id: string) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, isActive: true },
    select: {
      ...vehicleSelect,
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, tripNumber: true, origin: true, destination: true,
          cargoWeightKg: true, status: true, dispatchedAt: true,
          completedAt: true, odometerStart: true, odometerEnd: true,
          revenueGenerated: true,
          driver: { select: { id: true, name: true } },
        },
      },
      maintenanceLogs: {
        orderBy: { serviceDate: 'desc' },
        take: 50,
        select: {
          id: true, serviceType: true, description: true, cost: true,
          vendor: true, serviceDate: true, completedAt: true,
          odometerAtService: true,
        },
      },
      fuelLogs: {
        orderBy: { loggedAt: 'desc' },
        take: 50,
        select: {
          id: true, liters: true, costPerLiter: true, totalCost: true,
          odometerKm: true, loggedAt: true, notes: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new AppError(HTTP.NOT_FOUND, 'VEHICLE_NOT_FOUND', MSG.VEHICLE_NOT_FOUND);
  }

  // Compute summary stats
  const totalFuelCost = vehicle.fuelLogs.reduce((sum, f) => sum + Number(f.totalCost), 0);
  const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, m) => sum + Number(m.cost), 0);
  const totalRevenue = vehicle.trips.reduce((sum, t) => sum + Number(t.revenueGenerated ?? 0), 0);

  return {
    vehicle,
    summary: {
      totalTrips: vehicle.trips.length,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOperationalCost: Math.round((totalFuelCost + totalMaintenanceCost) * 100) / 100,
    },
  };
};

/**
 * CREATE VEHICLE
 * License plate uniqueness is enforced by DB unique constraint.
 * Prisma P2002 error is caught by global error middleware → 409 response.
 */
export const create = async (input: CreateVehicleInput) => {
  const vehicle = await prisma.vehicle.create({
    data: {
      licensePlate: input.licensePlate,
      make: input.make,
      model: input.model,
      year: input.year,
      type: input.type,
      maxCapacityKg: input.maxCapacityKg,
      odometerKm: input.odometerKm ?? 0,
      acquisitionCost: input.acquisitionCost,
      notes: input.notes,
    },
    select: vehicleSelect,
  });

  return vehicle;
};

/**
 * UPDATE VEHICLE
 * License plate cannot be changed (business rule — it's the physical identifier).
 */
export const update = async (id: string, input: UpdateVehicleInput) => {
  // Verify exists first
  await getById(id);

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(input.make && { make: input.make }),
      ...(input.model && { model: input.model }),
      ...(input.year && { year: input.year }),
      ...(input.type && { type: input.type }),
      ...(input.maxCapacityKg !== undefined && { maxCapacityKg: input.maxCapacityKg }),
      ...(input.acquisitionCost !== undefined && { acquisitionCost: input.acquisitionCost }),
      ...(input.odometerKm !== undefined && { odometerKm: input.odometerKm }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    select: vehicleSelect,
  });

  return vehicle;
};

/**
 * RETIRE VEHICLE (soft delete)
 * Business rules:
 * - Cannot retire a vehicle currently ON_TRIP
 * - Cannot retire a vehicle currently IN_SHOP (open maintenance)
 * Sets isActive=false, status=RETIRED, retiredAt=now
 */
export const retire = async (id: string) => {
  const vehicle = await getById(id);

  if (vehicle.status === 'ON_TRIP') {
    throw new AppError(
      HTTP.CONFLICT,
      'VEHICLE_ON_TRIP',
      'Cannot retire a vehicle that is currently on a trip. Complete or cancel the trip first.'
    );
  }

  if (vehicle.status === 'IN_SHOP') {
    throw new AppError(
      HTTP.CONFLICT,
      'VEHICLE_IN_SHOP',
      'Cannot retire a vehicle currently in the shop. Complete all maintenance first.'
    );
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: { isActive: false, status: 'RETIRED', retiredAt: new Date() },
    select: vehicleSelect,
  });

  return updated;
};

/**
 * GET AVAILABLE VEHICLES FOR DISPATCHER
 * Returns AVAILABLE vehicles filtered by type (for trip creation form dropdown).
 * This is a lightweight query — no pagination, just what the dispatcher needs.
 */
export const getAvailable = async (type?: string) => {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      status: 'AVAILABLE',
      ...(type && { type: type as Prisma.EnumVehicleTypeFilter }),
    },
    select: {
      id: true,
      licensePlate: true,
      make: true,
      model: true,
      type: true,
      maxCapacityKg: true,
      odometerKm: true,
    },
    orderBy: { licensePlate: 'asc' },
  });

  return vehicles;
};