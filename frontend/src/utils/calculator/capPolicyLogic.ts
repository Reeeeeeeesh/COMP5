import { CapCheckResults } from '../../types/calculator';

/**
 * Checks if a bonus exceeds the 3x base salary cap
 * @param baseSalary Base salary in GBP
 * @param bonus Bonus amount to check
 * @returns Whether the bonus exceeds the cap
 */
export function exceedsBaseSalaryCap(baseSalary: number, bonus: number): boolean {
  const cap = baseSalary * 3;
  return bonus > cap;
}

/**
 * Calculates the 3x base salary cap
 * @param baseSalary Base salary in GBP
 * @returns The 3x base salary cap amount
 */
export function calculateBaseSalaryCap(baseSalary: number): number {
  return baseSalary * 3;
}

/**
 * Checks if a bonus exceeds the MRT cap
 * @param baseSalary Base salary in GBP
 * @param bonus Bonus amount to check
 * @param mrtCapPct MRT cap percentage
 * @returns Whether the bonus exceeds the MRT cap
 */
export function exceedsMRTCap(baseSalary: number, bonus: number, mrtCapPct: number): boolean {
  const cap = baseSalary * (mrtCapPct / 100);
  return bonus > cap;
}

/**
 * Calculates the MRT cap
 * @param baseSalary Base salary in GBP
 * @param mrtCapPct MRT cap percentage
 * @returns The MRT cap amount
 */
export function calculateMRTCap(baseSalary: number, mrtCapPct: number): number {
  return baseSalary * (mrtCapPct / 100);
}

/**
 * Applies caps to a bonus amount
 * @param bonus Bonus amount to cap
 * @param baseSalaryCap 3x base salary cap
 * @param mrtCap MRT cap (if applicable)
 * @returns The capped bonus amount
 */
export function applyCapToBonus(bonus: number, baseSalaryCap: number, mrtCap: number | null): number {
  let cappedBonus = bonus;
  
  // Apply 3x base salary cap
  if (bonus > baseSalaryCap) {
    cappedBonus = baseSalaryCap;
  }
  
  // Apply MRT cap if applicable and lower than current capped bonus
  if (mrtCap !== null && bonus > mrtCap && mrtCap < cappedBonus) {
    cappedBonus = mrtCap;
  }
  
  return cappedBonus;
}

/**
 * Determines which cap was applied (if any)
 * @param originalBonus Original bonus amount before capping
 * @param cappedBonus Bonus amount after capping
 * @param baseSalaryCap 3x base salary cap
 * @param mrtCap MRT cap (if applicable)
 * @returns String indicating which cap was applied, or null if no cap was applied
 */
export function determineAppliedCap(
  originalBonus: number, 
  cappedBonus: number, 
  baseSalaryCap: number, 
  mrtCap: number | null
): string | null {
  if (originalBonus <= cappedBonus) {
    return null;
  }
  
  if (cappedBonus === baseSalaryCap) {
    return '3x Base Salary';
  }
  
  if (mrtCap !== null && cappedBonus === mrtCap) {
    return 'MRT Cap';
  }
  
  return null;
}

/**
 * Performs comprehensive cap and policy checks on a bonus amount
 * @param baseSalary Base salary in GBP
 * @param bonus Bonus amount to check
 * @param isMRT Whether the employee is a Material Risk Taker
 * @param mrtCapPct MRT cap percentage (if applicable)
 * @returns Results of cap and policy checks
 */
export function performCapAndPolicyChecks(
  baseSalary: number, 
  bonus: number, 
  isMRT: boolean = false, 
  mrtCapPct: number = 200
): CapCheckResults {
  // Calculate caps
  const baseSalaryCap = calculateBaseSalaryCap(baseSalary);
  const mrtCap = isMRT ? calculateMRTCap(baseSalary, mrtCapPct) : null;
  
  // Check for policy breach
  const policyBreach = exceedsBaseSalaryCap(baseSalary, bonus);
  
  // Determine if a cap should be applied
  let appliedCap: number | null = null;
  
  if (bonus > baseSalaryCap) {
    appliedCap = baseSalaryCap;
  }
  
  if (isMRT && mrtCap !== null && bonus > mrtCap && (appliedCap === null || mrtCap < appliedCap)) {
    appliedCap = mrtCap;
  }
  
  return {
    baseSalaryCap,
    mrtCap,
    appliedCap,
    policyBreach
  };
}
