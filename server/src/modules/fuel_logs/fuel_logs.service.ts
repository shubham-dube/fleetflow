import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { HTTP } from '../../constants/statusCodes';
import { MSG } from '../../constants/messages';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { calcFuelEfficiency } from '../../utils/calcHelpers';
import type { Request } from 'express';
import type { CreateFuelLogInput } from './fluel_logs.schema';

const fuelLogSelect = {
  id: true, liters: true, costPerLiter: true, totalCost: true,
  odometerKm: true, loggedAt: true, driverName: true, notes: true, createdAt: true,
  vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
  trip: { select: { id: true, tripNumber: true } },
} satisfies Prisma.FuelLogSelect;

export const getAll = async (req: Request) => {
  const { skip, take, page, pageSize } = parsePagination(req);
  const q = req.query as Record<string, string>;

  const where: Prisma.FuelLogWhereInput = {
    ...(q['vehicleId'] && { vehicleId: q['vehicleId'] }),
    ...(q['tripId'] && { tripId: q['tripId'] }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.fuelLog.findMany({ where, select: fuelLogSelect, skip, take, orderBy: { loggedAt: 'desc' } }),
    prisma.fuelLog.count({ where }),
  ]);

  return { logs, meta: buildMeta(total, { skip, take, page, pageSize }) };
};

export const getById = async (id: string) => {
  const log = await prisma.fuelLog.findUnique({ where: { id }, select: fuelLogSelect });
  if (!log) throw new AppError(HTTP.NOT_FOUND, 'FUEL_LOG_NOT_FOUND', 'Fuel log not found');
  return log;
};

/**
 * CREATE FUEL LOG
 * - totalCost auto-calculated server-side (liters × costPerLiter)
 * - odometerKm must be ≥ vehicle's current odometer
 * - tripId (if provided) must belong to same vehicle
 * - Updates vehicle odometer atomically
 * - Returns fuel efficiency if a previous log exists to compare against
 */
export const create = async (input: CreateFuelLogInput) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, isActive: true },
    select: { id: true, status: true, odometerKm: true },
  });

  if (!vehicle) {
    throw new AppError(HTTP.NOT_FOUND, 'VEHICLE_NOT_FOUND', MSG.VEHICLE_NOT_FOUND);
  }

  if (input.odometerKm < Number(vehicle.odometerKm)) {
    throw new AppError(
      HTTP.BAD_REQUEST,
      'INVALID_ODOMETER',
      `Odometer reading (${input.odometerKm} km) cannot be less than vehicle's current odometer (${Number(vehicle.odometerKm)} km)`
    );
  }

  if (input.tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: input.tripId },
      select: { vehicleId: true },
    });
    if (!trip) throw new AppError(HTTP.NOT_FOUND, 'TRIP_NOT_FOUND', MSG.TRIP_NOT_FOUND);
    if (trip.vehicleId !== input.vehicleId) {
      throw new AppError(HTTP.BAD_REQUEST, 'TRIP_VEHICLE_MISMATCH', 'The selected trip does not belong to this vehicle');
    }
  }

  // Get previous log for efficiency calculation
  const previousLog = await prisma.fuelLog.findFirst({
    where: { vehicleId: input.vehicleId },
    orderBy: { odometerKm: 'desc' },
    select: { odometerKm: true },
  });

  // Server-side calculation — totalCost is never trusted from client
  const totalCost = Math.round(input.liters * input.costPerLiter * 100) / 100;

  const [log] = await prisma.$transaction([
    prisma.fuelLog.create({
      data: {
        vehicleId: input.vehicleId,
        tripId: input.tripId ?? null,
        liters: input.liters,
        costPerLiter: input.costPerLiter,
        totalCost,
        odometerKm: input.odometerKm,
        driverName: input.driverName ?? null,
        loggedAt: input.loggedAt ?? new Date(),
        notes: input.notes ?? null,
      },
      select: fuelLogSelect,
    }),
    prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: { odometerKm: input.odometerKm },
    }),
  ]);

  const fuelEfficiency = previousLog
    ? calcFuelEfficiency(Number(previousLog.odometerKm), input.odometerKm, input.liters)
    : null;

  return { log, fuelEfficiency };
};

export const getVehicleFuelSummary = async (vehicleId: string) => {
  const logs = await prisma.fuelLog.findMany({
    where: { vehicleId },
    select: { liters: true, totalCost: true, odometerKm: true },
    orderBy: { odometerKm: 'asc' },
  });

  if (logs.length === 0) return { totalLiters: 0, totalCost: 0, avgEfficiency: null, fillUps: 0 };

  const totalLiters = logs.reduce((s, l) => s + Number(l.liters), 0);
  const totalCost = logs.reduce((s, l) => s + Number(l.totalCost), 0);
  const firstOdometer = Number(logs[0]!.odometerKm);
  const lastOdometer = Number(logs[logs.length - 1]!.odometerKm);
  const totalKm = lastOdometer - firstOdometer;
  const avgEfficiency = totalLiters > 0 && totalKm > 0
    ? Math.round((totalKm / totalLiters) * 100) / 100
    : null;

  return {
    totalLiters: Math.round(totalLiters * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    avgEfficiency,
    fillUps: logs.length,
  };
};