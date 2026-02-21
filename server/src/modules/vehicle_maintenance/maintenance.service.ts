import { ServiceType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { HTTP } from '../../constants/statusCodes';
import { MSG } from '../../constants/messages';
import { parsePagination, buildMeta } from '../../utils/pagination';
import type { Request } from 'express';
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from './maintenance.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const maintenanceSelect = {
  id: true, serviceType: true, description: true, cost: true,
  vendor: true, serviceDate: true, completedAt: true, odometerAtService: true,
  createdAt: true, updatedAt: true,
  vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
  loggedBy: { select: { id: true, name: true } },
} satisfies Prisma.MaintenanceSelect;

// ─── Service Methods ──────────────────────────────────────────────────────────

export const getAll = async (req: Request) => {
  const { skip, take, page, pageSize } = parsePagination(req);
  const q = req.query as Record<string, string>;

  const where: Prisma.MaintenanceWhereInput = {
    ...(q['vehicleId'] && { vehicleId: q['vehicleId'] }),
    ...(q['serviceType'] && { serviceType: q['serviceType'] as ServiceType }),
    // inShop=true → only open logs (completedAt IS NULL)
    // inShop=false → only completed logs
    ...(q['inShop'] === 'true' && { completedAt: null }),
    ...(q['inShop'] === 'false' && { completedAt: { not: null } }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.maintenance.findMany({
      where, select: maintenanceSelect, skip, take,
      orderBy: { serviceDate: 'desc' },
    }),
    prisma.maintenance.count({ where }),
  ]);

  return { logs, meta: buildMeta(total, { skip, take, page, pageSize }) };
};

export const getById = async (id: string) => {
  const log = await prisma.maintenance.findUnique({ where: { id }, select: maintenanceSelect });
  if (!log) {
    throw new AppError(HTTP.NOT_FOUND, 'MAINTENANCE_NOT_FOUND', MSG.MAINTENANCE_NOT_FOUND);
  }
  return log;
};

/**
 * CREATE MAINTENANCE LOG
 *
 * Business rules:
 * - Vehicle must exist and be active
 * - Vehicle must NOT be currently ON_TRIP (can't service a vehicle that's on the road)
 * - On success: atomically creates the log AND sets vehicle status to IN_SHOP
 *
 * Uses prisma.$transaction so both operations succeed or both fail together.
 */
export const create = async (input: CreateMaintenanceInput, loggedById: string) => {
  // Verify vehicle exists and is eligible for maintenance
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, isActive: true },
    select: { id: true, status: true, odometerKm: true },
  });

  if (!vehicle) {
    throw new AppError(HTTP.NOT_FOUND, 'VEHICLE_NOT_FOUND', MSG.VEHICLE_NOT_FOUND);
  }

  if (vehicle.status === 'ON_TRIP') {
    throw new AppError(
      HTTP.CONFLICT,
      'VEHICLE_ON_TRIP',
      'Cannot log maintenance for a vehicle currently on a trip. Complete the trip first.'
    );
  }

  if (vehicle.status === 'RETIRED') {
    throw new AppError(
      HTTP.CONFLICT,
      'VEHICLE_RETIRED',
      'Cannot log maintenance for a retired vehicle.'
    );
  }

  // Atomic: create log + set vehicle IN_SHOP
  const [log] = await prisma.$transaction([
    prisma.maintenance.create({
      data: {
        vehicleId: input.vehicleId,
        loggedById,
        serviceType: input.serviceType,
        description: input.description,
        cost: input.cost,
        vendor: input.vendor ?? null,
        serviceDate: input.serviceDate,
        odometerAtService: input.odometerAtService ?? Number(vehicle.odometerKm),
      },
      select: maintenanceSelect,
    }),
    // Set vehicle IN_SHOP regardless of its previous status
    // (AVAILABLE → IN_SHOP, IN_SHOP stays IN_SHOP if multiple logs)
    prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: 'IN_SHOP' },
    }),
  ]);

  return log;
};

export const update = async (id: string, input: UpdateMaintenanceInput) => {
  const log = await getById(id);

  if (log.completedAt) {
    throw new AppError(
      HTTP.CONFLICT,
      'MAINTENANCE_ALREADY_COMPLETE',
      MSG.MAINTENANCE_ALREADY_COMPLETE
    );
  }

  const updated = await prisma.maintenance.update({
    where: { id },
    data: {
      ...(input.serviceType && { serviceType: input.serviceType }),
      ...(input.description && { description: input.description }),
      ...(input.cost !== undefined && { cost: input.cost }),
      ...(input.vendor !== undefined && { vendor: input.vendor ?? null }),
      ...(input.serviceDate && { serviceDate: input.serviceDate }),
      ...(input.odometerAtService !== undefined && { odometerAtService: input.odometerAtService }),
    },
    select: maintenanceSelect,
  });

  return updated;
};

/**
 * COMPLETE MAINTENANCE
 *
 * Marks the maintenance log as done (sets completedAt = now).
 * CRITICAL BUSINESS RULE: After completing, checks if ANY OTHER open logs
 * exist for this vehicle. Only restores vehicle to AVAILABLE if this was
 * the LAST open maintenance log. This prevents prematurely un-blocking
 * a vehicle that has multiple concurrent service items.
 */
export const complete = async (id: string) => {
  const log = await getById(id);

  if (log.completedAt) {
    throw new AppError(
      HTTP.CONFLICT,
      'MAINTENANCE_ALREADY_COMPLETE',
      MSG.MAINTENANCE_ALREADY_COMPLETE
    );
  }

  const updatedLog = await prisma.$transaction(async (tx) => {
    // Mark this log complete
    const completed = await tx.maintenance.update({
      where: { id },
      data: { completedAt: new Date() },
      select: maintenanceSelect,
    });

    // Count remaining open logs for this vehicle (excluding the one we just completed)
    const remainingOpenLogs = await tx.maintenance.count({
      where: {
        vehicleId: log.vehicle.id,
        completedAt: null,
        id: { not: id },
      },
    });

    // Only restore vehicle if no more open maintenance logs exist
    if (remainingOpenLogs === 0) {
      await tx.vehicle.update({
        where: { id: log.vehicle.id },
        data: { status: 'AVAILABLE' },
      });
    }

    return { log: completed, vehicleRestored: remainingOpenLogs === 0, remainingOpenLogs };
  });

  return updatedLog;
};

/**
 * GET OPEN MAINTENANCE LOGS (vehicles currently IN_SHOP)
 * Quick dashboard query — returns only active/open logs
 */
export const getOpenLogs = async () => {
  const logs = await prisma.maintenance.findMany({
    where: { completedAt: null },
    select: maintenanceSelect,
    orderBy: { serviceDate: 'asc' }, // oldest first — shows most urgent
  });
  return logs;
};