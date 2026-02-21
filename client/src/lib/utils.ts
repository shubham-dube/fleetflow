import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import type { VehicleStatus, DriverStatus, TripStatus, LicenseStatus } from '@/types/models.types'

// ─── Class name utility ───────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Number formatters ────────────────────────────────────────────────────────
export function formatCurrency(value: string | number, currency = '₹'): string {
  const num = Number(value)
  if (isNaN(num)) return `${currency}0`
  if (num >= 10_00_000) return `${currency}${(num / 10_00_000).toFixed(1)}L`
  if (num >= 1_000) return `${currency}${(num / 1_000).toFixed(1)}K`
  return `${currency}${num.toFixed(0)}`
}

export function formatNumber(value: string | number, decimals = 0): string {
  const num = Number(value)
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-IN', { maximumFractionDigits: decimals })
}

export function formatWeight(value: string | number): string {
  const num = Number(value)
  if (isNaN(num)) return '0 kg'
  return `${num.toLocaleString('en-IN')} kg`
}

export function formatOdometer(value: string | number): string {
  const num = Number(value)
  if (isNaN(num)) return '0 km'
  return `${num.toLocaleString('en-IN')} km`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ─── Date formatters ──────────────────────────────────────────────────────────
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    return format(parseISO(`${dateStr}-01`), 'MMM yyyy')
  } catch {
    return dateStr
  }
}

// ─── Status display helpers ───────────────────────────────────────────────────
export const vehicleStatusConfig: Record<VehicleStatus, { label: string; color: string }> = {
  AVAILABLE: { label: 'Available', color: 'status-available' },
  ON_TRIP: { label: 'On Trip', color: 'status-onTrip' },
  IN_SHOP: { label: 'In Shop', color: 'status-inShop' },
  RETIRED: { label: 'Retired', color: 'status-retired' },
}

export const driverStatusConfig: Record<DriverStatus, { label: string; color: string }> = {
  ON_DUTY: { label: 'On Duty', color: 'status-available' },
  OFF_DUTY: { label: 'Off Duty', color: 'status-draft' },
  SUSPENDED: { label: 'Suspended', color: 'status-retired' },
}

export const tripStatusConfig: Record<TripStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'status-draft' },
  DISPATCHED: { label: 'Dispatched', color: 'status-onTrip' },
  IN_TRANSIT: { label: 'In Transit', color: 'status-inTransit' },
  COMPLETED: { label: 'Completed', color: 'status-completed' },
  CANCELLED: { label: 'Cancelled', color: 'status-retired' },
}

export const licenseStatusConfig: Record<LicenseStatus, { label: string; color: string }> = {
  VALID: { label: 'Valid', color: 'status-available' },
  EXPIRING_SOON: { label: 'Expiring', color: 'status-inShop' },
  EXPIRED: { label: 'Expired', color: 'status-retired' },
}

// ─── Trip number formatter ────────────────────────────────────────────────────
export function formatTripNumber(tripNumber: string): string {
  return tripNumber // Already formatted as TRP-00042
}

// ─── Service type labels ──────────────────────────────────────────────────────
export const serviceTypeLabels: Record<string, string> = {
  OIL_CHANGE: 'Oil Change',
  TIRE_ROTATION: 'Tire Rotation',
  BRAKE_SERVICE: 'Brake Service',
  ENGINE_REPAIR: 'Engine Repair',
  ELECTRICAL: 'Electrical',
  BODY_WORK: 'Body Work',
  INSPECTION: 'Inspection',
  OTHER: 'Other',
}

// ─── Vehicle type labels ──────────────────────────────────────────────────────
export const vehicleTypeLabels: Record<string, string> = {
  TRUCK: 'Truck',
  VAN: 'Van',
  BIKE: 'Bike',
}

// ─── Truncate text ────────────────────────────────────────────────────────────
export function truncate(str: string, n: number): string {
  return str.length > n ? `${str.slice(0, n)}…` : str
}