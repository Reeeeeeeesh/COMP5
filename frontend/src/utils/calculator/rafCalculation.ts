import { RafParameters } from '../../types/calculator';

/**
 * Calculates the average team revenue over a 3-year period
 * @param year1Revenue Revenue for year 1
 * @param year2Revenue Revenue for year 2
 * @param year3Revenue Revenue for year 3
 * @returns Average revenue over the 3-year period
 */
export function calculateAverageTeamRevenue(
  year1Revenue: number,
  year2Revenue: number,
  year3Revenue: number
): number {
  return (year1Revenue + year2Revenue + year3Revenue) / 3;
}

/**
 * Calculates the raw RAF value based on average revenue and sensitivity factor
 * @param averageRevenue Average revenue over the 3-year period
 * @param sensitivityFactor Sensitivity factor for RAF calculation
 * @returns Raw RAF value before applying bounds
 */
export function calculateRawRAF(averageRevenue: number, sensitivityFactor: number): number {
  if (averageRevenue <= 0) {
    return 1.0; // Default to neutral RAF if no revenue data
  }
  
  // Example formula: Higher revenue leads to higher RAF
  // This is a simplified implementation - actual formula would depend on business requirements
  // Using log10 to create a non-linear relationship between revenue and RAF
  return 1.0 + (Math.log10(averageRevenue) / 10) * sensitivityFactor;
}

/**
 * Applies bounds to the RAF value
 * @param rawRAF Raw RAF value before applying bounds
 * @param lowerBound Lower bound for RAF
 * @param upperBound Upper bound for RAF
 * @returns RAF value after applying bounds
 */
export function applyRAFBounds(rawRAF: number, lowerBound: number, upperBound: number): number {
  return Math.max(lowerBound, Math.min(upperBound, rawRAF));
}

/**
 * Calculates the Revenue Adjustment Factor (RAF) based on parameters
 * @param params RAF calculation parameters
 * @returns Calculated RAF value
 */
export function calculateRAF(params: RafParameters): number {
  // Calculate average revenue
  const averageRevenue = calculateAverageTeamRevenue(
    params.teamRevenueYear1,
    params.teamRevenueYear2,
    params.teamRevenueYear3
  );
  
  // Calculate raw RAF
  const rawRAF = calculateRawRAF(averageRevenue, params.sensitivityFactor);
  
  // Apply bounds
  return applyRAFBounds(rawRAF, params.lowerBound, params.upperBound);
}

/**
 * Calculates the impact of RAF on the bonus amount
 * @param initialBonus Initial bonus amount before applying RAF
 * @param raf Revenue Adjustment Factor
 * @returns Bonus amount after applying RAF
 */
export function applyRAFToBonus(initialBonus: number, raf: number): number {
  return initialBonus * raf;
}

/**
 * Determines the RAF adjustment direction and magnitude
 * @param raf Revenue Adjustment Factor
 * @returns Object containing the adjustment direction and percentage
 */
export function determineRAFAdjustment(raf: number): { direction: string; percentage: number } {
  if (raf === 1.0) {
    return { direction: 'neutral', percentage: 0 };
  } else if (raf > 1.0) {
    return { direction: 'upward', percentage: (raf - 1.0) * 100 };
  } else {
    return { direction: 'downward', percentage: (1.0 - raf) * 100 };
  }
}
