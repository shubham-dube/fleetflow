// Fuel efficiency: km per liter
export const calcFuelEfficiency = (
  odometerStartKm: number,
  odometerEndKm: number,
  liters: number
): number => {
  const km = odometerEndKm - odometerStartKm;
  if (km <= 0 || liters <= 0) return 0;
  return Math.round((km / liters) * 100) / 100;
};

// Vehicle ROI = (Revenue - (Maintenance + Fuel)) / AcquisitionCost * 100
export const calcVehicleROI = (
  revenue: number,
  maintenanceCost: number,
  fuelCost: number,
  acquisitionCost: number
): number => {
  if (acquisitionCost <= 0) return 0;
  return Math.round(((revenue - (maintenanceCost + fuelCost)) / acquisitionCost) * 10000) / 100;
};

// Safety score penalty per incident severity
// Severity 1 = minor, 5 = critical
export const calcSafetyScorePenalty = (severity: number): number => {
  const penalties: Record<number, number> = { 1: 2, 2: 5, 3: 10, 4: 20, 5: 35 };
  return penalties[severity] ?? 5;
};