import { TripStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { HTTP } from '../../constants/statusCodes';
import { MSG } from '../../constants/messages';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { isExpired } from '../../utils/dateHelpers';
import type { Request } from 'express';
import type { CreateTripInput, UpdateTripStatusInput } from './trips.schema';

// ─── State Machine ────────────────────────────────────────────────────────────
// Defines which transitions are valid. Any attempt outside this map is rejected.
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  DRAFT: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],   // terminal state
  CANCELLED: [],   // terminal state
};

const assertValidTransition = (from: TripStatus, to: TripStatus): void => {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new AppError(
      HTTP.BAD_REQUEST,
      'INVALID_TRIP_TRANSITION',
      MSG.TRIP_INVALID_TRANSITION(from, to)
    );
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tripSelect = {
  id: true, tripNumber: true, status: true,
  origin: true, destination: true, distanceKm: true,
  cargoDescription: true, cargoWeightKg: true,
  estimatedFuelCost: true, odometerStart: true, odometerEnd: true,
  revenueGenerated: true, cancellationReason: true,
  dispatchedAt: true, completedAt: true, cancelledAt: true,
  createdAt: true, updatedAt: true,
  vehicle: { select: { id: true, licensePlate: true, make: true, model: true, type: true } },
  driver: { select: { id: true, name: true, phone: true, licenseCategory: true } },
  createdBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.TripSelect;

/** Generates sequential trip number: TRP-00001 */
const generateTripNumber = async (): Promise<string> => {
  // Count all trips (including cancelled) to get a monotonically increasing number
  const count = await prisma.trip.count();
  return `TRP-${String(count + 1).padStart(5, '0')}`;
};

// ─── Service Methods ──────────────────────────────────────────────────────────

export const getAll = async (req: Request) => {
  const { skip, take, page, pageSize } = parsePagination(req);
  const q = req.query as Record<string, string>;

  const where: Prisma.TripWhereInput = {
    ...(q['status'] && { status: q['status'] as TripStatus }),
    ...(q['vehicleId'] && { vehicleId: q['vehicleId'] }),
    ...(q['driverId'] && { driverId: q['driverId'] }),
  };

  const [trips, total] = await prisma.$transaction([
    prisma.trip.findMany({
      where, select: tripSelect, skip, take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trip.count({ where }),
  ]);

  return { trips, meta: buildMeta(total, { skip, take, page, pageSize }) };
};

export const getById = async (id: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      ...tripSelect,
      fuelLogs: {
        select: { id: true, liters: true, totalCost: true, odometerKm: true, loggedAt: true },
        orderBy: { loggedAt: 'asc' },
      },
    },
  });

  if (!trip) {
    throw new AppError(HTTP.NOT_FOUND, 'TRIP_NOT_FOUND', MSG.TRIP_NOT_FOUND);
  }

  return trip;
};

/**
 * CREATE TRIP
 *
 * Validation rules (ALL enforced server-side — frontend validation is UX-only):
 * 1. Vehicle must exist, be active, and be AVAILABLE
 * 2. Vehicle must not be RETIRED
 * 3. Driver must exist, be active, be ON_DUTY, not SUSPENDED
 * 4. Driver license must not be expired
 * 5. Driver licenseCategory must match vehicle type (TRUCK driver → TRUCK vehicle)
 * 6. cargoWeightKg must be ≤ vehicle maxCapacityKg
 *
 * On success:
 * - Trip is created with status DRAFT
 * - Vehicle and driver statuses are NOT changed yet (happens on DISPATCH)
 */
export const create = async (input: CreateTripInput, createdById: string) => {
  // ── Fetch vehicle + driver in parallel ────────────────────────────────────
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id: input.vehicleId, isActive: true },
      select: { id: true, status: true, type: true, maxCapacityKg: true, odometerKm: true },
    }),
    prisma.driver.findFirst({
      where: { id: input.driverId, isActive: true },
      select: { id: true, status: true, licenseCategory: true, licenseExpiryDate: true },
    }),
  ]);

  // ── Vehicle checks ────────────────────────────────────────────────────────
  if (!vehicle) {
    throw new AppError(HTTP.NOT_FOUND, 'VEHICLE_NOT_FOUND', MSG.VEHICLE_NOT_FOUND);
  }
  if (vehicle.status !== 'AVAILABLE') {
    throw new AppError(HTTP.CONFLICT, 'VEHICLE_NOT_AVAILABLE', MSG.VEHICLE_NOT_AVAILABLE);
  }

  // ── Driver checks ─────────────────────────────────────────────────────────
  if (!driver) {
    throw new AppError(HTTP.NOT_FOUND, 'DRIVER_NOT_FOUND', MSG.DRIVER_NOT_FOUND);
  }
  if (driver.status === 'SUSPENDED') {
    throw new AppError(HTTP.CONFLICT, 'DRIVER_SUSPENDED', MSG.DRIVER_SUSPENDED);
  }
  if (driver.status !== 'ON_DUTY') {
    throw new AppError(HTTP.CONFLICT, 'DRIVER_NOT_AVAILABLE', MSG.DRIVER_NOT_AVAILABLE);
  }
  if (isExpired(driver.licenseExpiryDate)) {
    throw new AppError(HTTP.CONFLICT, 'DRIVER_LICENSE_EXPIRED', MSG.DRIVER_LICENSE_EXPIRED);
  }
  if (driver.licenseCategory !== vehicle.type) {
    throw new AppError(
      HTTP.CONFLICT,
      'DRIVER_LICENSE_MISMATCH',
      MSG.DRIVER_LICENSE_MISMATCH(driver.licenseCategory, vehicle.type)
    );
  }

  // ── Cargo weight check ────────────────────────────────────────────────────
  const maxCapacity = Number(vehicle.maxCapacityKg);
  if (input.cargoWeightKg > maxCapacity) {
    throw new AppError(
      HTTP.BAD_REQUEST,
      'TRIP_OVERWEIGHT',
      MSG.TRIP_OVERWEIGHT(input.cargoWeightKg, maxCapacity)
    );
  }

  // ── Create trip ───────────────────────────────────────────────────────────
  const tripNumber = await generateTripNumber();

  const trip = await prisma.trip.create({
    data: {
      tripNumber,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      createdById,
      origin: input.origin,
      destination: input.destination,
      cargoWeightKg: input.cargoWeightKg,
      cargoDescription: input.cargoDescription ?? null,
      estimatedFuelCost: input.estimatedFuelCost ?? null,
      odometerStart: input.odometerStart ?? Number(vehicle.odometerKm),
      revenueGenerated: input.revenueGenerated ?? null,
      status: 'DRAFT',
    },
    select: tripSelect,
  });

  return trip;
};

/**
 * UPDATE TRIP STATUS
 *
 * State machine transitions:
 * DRAFT        → DISPATCHED: lock vehicle + driver (set both to ON_TRIP)
 * DISPATCHED   → IN_TRANSIT: just update status + timestamp
 * IN_TRANSIT   → COMPLETED:  update odometer, free vehicle + driver, increment trip counts
 * ANY → CANCELLED:           free vehicle + driver (if they were locked)
 *
 * All multi-table updates use prisma.$transaction for atomicity.
 */
export const updateStatus = async (id: string, input: UpdateTripStatusInput) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true, status: true, vehicleId: true, driverId: true,
      odometerStart: true, tripNumber: true,
    },
  });

  if (!trip) {
    throw new AppError(HTTP.NOT_FOUND, 'TRIP_NOT_FOUND', MSG.TRIP_NOT_FOUND);
  }

  assertValidTransition(trip.status, input.status);

  const now = new Date();

  // ── DRAFT → DISPATCHED ────────────────────────────────────────────────────
  if (input.status === 'DISPATCHED') {
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Re-check vehicle availability inside transaction (race condition guard)
      const vehicle = await tx.vehicle.findUnique({
        where: { id: trip.vehicleId },
        select: { status: true },
      });
      if (vehicle?.status !== 'AVAILABLE') {
        throw new AppError(HTTP.CONFLICT, 'VEHICLE_NOT_AVAILABLE', MSG.VEHICLE_NOT_AVAILABLE);
      }

      const [updated] = await Promise.all([
        tx.trip.update({
          where: { id },
          data: { status: 'DISPATCHED', dispatchedAt: now },
          select: tripSelect,
        }),
        tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } }),
        tx.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' as never } }),
      ]);
      return updated;
    });
    return updatedTrip;
  }

  // ── IN_TRANSIT → COMPLETED ────────────────────────────────────────────────
  if (input.status === 'COMPLETED') {
    const odometerEnd = input.odometerEnd!;

    // Validate odometer end is ≥ odometer start
    if (trip.odometerStart && odometerEnd < Number(trip.odometerStart)) {
      throw new AppError(
        HTTP.BAD_REQUEST,
        'INVALID_ODOMETER',
        `Final odometer (${odometerEnd}) cannot be less than start odometer (${trip.odometerStart})`
      );
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const distanceKm = trip.odometerStart
        ? odometerEnd - Number(trip.odometerStart)
        : null;

      const [updated] = await Promise.all([
        tx.trip.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            odometerEnd,
            distanceKm,
            ...(input.revenueGenerated !== undefined && { revenueGenerated: input.revenueGenerated }),
          },
          select: tripSelect,
        }),
        // Free vehicle and update its odometer
        tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: 'AVAILABLE', odometerKm: odometerEnd },
        }),
        // Free driver and increment their trip counts
        tx.driver.update({
          where: { id: trip.driverId },
          data: {
            status: 'ON_DUTY',
            completedTrips: { increment: 1 },
            totalTrips: { increment: 1 },
          },
        }),
      ]);
      return updated;
    });
    return updatedTrip;
  }

  // ── ANY → CANCELLED ───────────────────────────────────────────────────────
  if (input.status === 'CANCELLED') {
    const wasDispatched = ['DISPATCHED', 'IN_TRANSIT'].includes(trip.status);

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const ops: Promise<unknown>[] = [
        tx.trip.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            cancellationReason: input.cancellationReason,
          },
          select: tripSelect,
        }),
      ];

      // Only free vehicle/driver if they were locked (trip was dispatched or in transit)
      if (wasDispatched) {
        ops.push(
          tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }),
          tx.driver.update({
            where: { id: trip.driverId },
            data: { status: 'ON_DUTY', totalTrips: { increment: 1 } }, // count as attempted
          })
        );
      }

      const [updated] = await Promise.all(ops);
      return updated;
    });
    return updatedTrip;
  }

  // ── DISPATCHED → IN_TRANSIT ───────────────────────────────────────────────
  const updatedTrip = await prisma.trip.update({
    where: { id },
    data: { status: input.status },
    select: tripSelect,
  });
  return updatedTrip;
};