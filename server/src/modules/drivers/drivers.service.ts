import { DriverStatus, LicenseCategory, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { HTTP } from '../../constants/statusCodes';
import { MSG } from '../../constants/messages';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { isExpired, isExpiringSoon } from '../../utils/dateHelpers';
import { calcSafetyScorePenalty } from '../../utils/calcHelpers';
import type { Request } from 'express';
import type { CreateDriverInput, UpdateDriverInput, UpdateDriverStatusInput, LogIncidentInput } from './drivers.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const driverSelect = {
  id: true, name: true, phone: true, email: true,
  licenseNumber: true, licenseCategory: true, licenseExpiryDate: true,
  status: true, safetyScore: true, totalTrips: true, completedTrips: true,
  isActive: true, suspendedReason: true, createdAt: true, updatedAt: true,
} satisfies Prisma.DriverSelect;

// ─── Service Methods ──────────────────────────────────────────────────────────

export const getAll = async (req: Request) => {
  const { skip, take, page, pageSize } = parsePagination(req);
  const q = req.query as Record<string, string>;

  const where: Prisma.DriverWhereInput = {
    isActive: q['isActive'] !== undefined ? q['isActive'] === 'true' : true,
    ...(q['status'] && { status: q['status'] as DriverStatus }),
    ...(q['licenseCategory'] && { licenseCategory: q['licenseCategory'] as LicenseCategory }),
    // Expiring within N days filter
    ...(q['expiringWithinDays'] && {
      licenseExpiryDate: {
        lte: new Date(Date.now() + parseInt(q['expiringWithinDays']!) * 24 * 60 * 60 * 1000),
        gte: new Date(), // not yet expired
      },
    }),
  };

  const [drivers, total] = await prisma.$transaction([
    prisma.driver.findMany({ where, select: driverSelect, skip, take, orderBy: { name: 'asc' } }),
    prisma.driver.count({ where }),
  ]);

  // Enrich each driver with computed fields
  const enriched = drivers.map((d) => ({
    ...d,
    completionRate: d.totalTrips > 0
      ? Math.round((d.completedTrips / d.totalTrips) * 10000) / 100
      : 0,
    licenseStatus: isExpired(d.licenseExpiryDate)
      ? 'EXPIRED'
      : isExpiringSoon(d.licenseExpiryDate, 30)
      ? 'EXPIRING_SOON'
      : 'VALID',
  }));

  return { drivers: enriched, meta: buildMeta(total, { skip, take, page, pageSize }) };
};

export const getById = async (id: string) => {
  const driver = await prisma.driver.findFirst({
    where: { id, isActive: true },
    select: driverSelect,
  });

  if (!driver) {
    throw new AppError(HTTP.NOT_FOUND, 'DRIVER_NOT_FOUND', MSG.DRIVER_NOT_FOUND);
  }

  return {
    ...driver,
    completionRate: driver.totalTrips > 0
      ? Math.round((driver.completedTrips / driver.totalTrips) * 10000) / 100
      : 0,
    licenseStatus: isExpired(driver.licenseExpiryDate)
      ? 'EXPIRED'
      : isExpiringSoon(driver.licenseExpiryDate, 30)
      ? 'EXPIRING_SOON'
      : 'VALID',
  };
};

export const getDriverProfile = async (id: string) => {
  const driver = await prisma.driver.findFirst({
    where: { id, isActive: true },
    select: {
      ...driverSelect,
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, tripNumber: true, origin: true, destination: true,
          status: true, dispatchedAt: true, completedAt: true,
          vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
        },
      },
      incidents: {
        orderBy: { reportedAt: 'desc' },
        select: {
          id: true, description: true, severity: true, reportedAt: true, reportedBy: true,
          tripId: true,
        },
      },
    },
  });

  if (!driver) {
    throw new AppError(HTTP.NOT_FOUND, 'DRIVER_NOT_FOUND', MSG.DRIVER_NOT_FOUND);
  }

  return {
    ...driver,
    completionRate: driver.totalTrips > 0
      ? Math.round((driver.completedTrips / driver.totalTrips) * 10000) / 100
      : 0,
    licenseStatus: isExpired(driver.licenseExpiryDate)
      ? 'EXPIRED'
      : isExpiringSoon(driver.licenseExpiryDate, 30)
      ? 'EXPIRING_SOON'
      : 'VALID',
  };
};

export const create = async (input: CreateDriverInput) => {
  const driver = await prisma.driver.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      licenseNumber: input.licenseNumber,
      licenseCategory: input.licenseCategory,
      licenseExpiryDate: input.licenseExpiryDate,
    },
    select: driverSelect,
  });
  return driver;
};

export const update = async (id: string, input: UpdateDriverInput) => {
  await getById(id); // verify exists

  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.phone && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.licenseNumber && { licenseNumber: input.licenseNumber }),
      ...(input.licenseCategory && { licenseCategory: input.licenseCategory }),
      ...(input.licenseExpiryDate && { licenseExpiryDate: input.licenseExpiryDate }),
    },
    select: driverSelect,
  });
  return driver;
};

/**
 * UPDATE DRIVER STATUS
 * Suspension requires a reason (enforced in schema).
 * A suspended driver cannot be assigned to new trips (enforced in trips service).
 */
export const updateStatus = async (id: string, input: UpdateDriverStatusInput) => {
  const driver = await getById(id);

  // Cannot un-suspend to ON_TRIP directly — must go through OFF_DUTY first
  if (driver.status === 'SUSPENDED' && input.status === 'ON_TRIP' as DriverStatus) {
    throw new AppError(
      HTTP.BAD_REQUEST,
      'INVALID_STATUS_TRANSITION',
      'A suspended driver must be set to OFF_DUTY before being placed ON_DUTY'
    );
  }

  const updated = await prisma.driver.update({
    where: { id },
    data: {
      status: input.status,
      // Clear reason when un-suspending, set when suspending
      suspendedReason: input.status === 'SUSPENDED' ? input.suspendedReason : null,
    },
    select: driverSelect,
  });
  return updated;
};

/**
 * LOG INCIDENT
 * Creates an incident record and atomically decrements the driver's safety score.
 * Safety score has a floor of 0 — cannot go negative.
 */
export const logIncident = async (id: string, input: LogIncidentInput) => {
  const driver = await getById(id);

  const penalty = calcSafetyScorePenalty(input.severity);
  const currentScore = Number(driver.safetyScore);
  const newScore = Math.max(0, currentScore - penalty);

  // Atomic: create incident + update safety score in one transaction
  const [incident] = await prisma.$transaction([
    prisma.driverIncident.create({
      data: {
        driverId: id,
        description: input.description,
        severity: input.severity,
        tripId: input.tripId ?? null,
        reportedBy: input.reportedBy ?? null,
      },
    }),
    prisma.driver.update({
      where: { id },
      data: { safetyScore: newScore },
    }),
  ]);

  return { incident, newSafetyScore: newScore, penaltyApplied: penalty };
};

/**
 * DEACTIVATE DRIVER (soft delete)
 * Cannot deactivate a driver currently ON_TRIP.
 */
export const deactivate = async (id: string) => {
  const driver = await getById(id);

  if (driver.status === DriverStatus.ON_DUTY) {
    throw new AppError(
      HTTP.CONFLICT,
      'DRIVER_ON_DUTY',
      'Cannot deactivate a driver currently on a trip OR duty. Complete or cancel the trip first.'
    );
  }

  await prisma.driver.update({
    where: { id },
    data: { isActive: false, status: 'OFF_DUTY' },
  });
};

/**
 * GET AVAILABLE DRIVERS FOR DISPATCHER
 * Returns ON_DUTY drivers with valid, non-expired licenses.
 * Optionally filtered by license category (to match vehicle type).
 */
export const getAvailable = async (licenseCategory?: string) => {
  const today = new Date();

  const drivers = await prisma.driver.findMany({
    where: {
      isActive: true,
      status: 'ON_DUTY',
      licenseExpiryDate: { gt: today }, // must not be expired
      ...(licenseCategory && { licenseCategory: licenseCategory as LicenseCategory }),
    },
    select: {
      id: true, name: true, phone: true,
      licenseNumber: true, licenseCategory: true, licenseExpiryDate: true,
      safetyScore: true,
    },
    orderBy: { name: 'asc' },
  });

  return drivers;
};