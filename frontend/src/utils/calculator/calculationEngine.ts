import { CalculatorInput, CalculationResult, RafParameters } from '../../types/calculator';
import { performCapAndPolicyChecks, applyCapToBonus } from './capPolicyLogic';
import { calculateRAF, applyRAFToBonus } from './rafCalculation';

/**
 * Calculates the target bonus amount based on base salary and target bonus percentage
 * @param baseSalary Base salary in GBP
 * @param targetBonusPct Target bonus percentage
 * @returns Target bonus amount
 */
export function calculateTargetBonus(baseSalary: number, targetBonusPct: number): number {
  return baseSalary * (targetBonusPct / 100);
}

/**
 * Normalizes weights to ensure they sum to 1.0
 * @param investmentWeight Weight for investment component
 * @param qualitativeWeight Weight for qualitative component
 * @returns Normalized weights object
 */
export function normalizeWeights(investmentWeight: number, qualitativeWeight: number): { investmentWeight: number, qualitativeWeight: number } {
  const sum = investmentWeight + qualitativeWeight;
  
  if (sum === 0) {
    // Default to equal weights if both are zero
    return { investmentWeight: 0.5, qualitativeWeight: 0.5 };
  }
  
  return {
    investmentWeight: investmentWeight / sum,
    qualitativeWeight: qualitativeWeight / sum
  };
}

/**
 * Calculates the weighted score for a component
 * @param weight Component weight
 * @param scoreMultiplier Score multiplier
 * @returns Weighted score
 */
export function calculateComponentScore(weight: number, scoreMultiplier: number): number {
  return weight * scoreMultiplier;
}

/**
 * Calculates the pre-RAF bonus amount
 * @param targetBonus Target bonus amount
 * @param investmentScore Investment component score
 * @param qualitativeScore Qualitative component score
 * @returns Pre-RAF bonus amount
 */
export function calculatePreRafBonus(targetBonus: number, investmentScore: number, qualitativeScore: number): number {
  return targetBonus * (investmentScore + qualitativeScore);
}

/**
 * Calculates the bonus to salary ratio
 * @param finalBonus Final bonus amount
 * @param baseSalary Base salary
 * @returns Bonus to salary ratio
 */
export function calculateBonusToSalaryRatio(finalBonus: number, baseSalary: number): number {
  return baseSalary > 0 ? finalBonus / baseSalary : 0;
}

/**
 * Main function to calculate the bonus based on input parameters
 * @param input Calculator input parameters
 * @param rafParams Optional RAF parameters (if not provided, uses the RAF value from input)
 * @param isMRT Whether the employee is a Material Risk Taker
 * @param mrtCapPct MRT cap percentage
 * @returns Calculation results
 */
export function calculateBonus(
  input: CalculatorInput,
  rafParams?: RafParameters,
  isMRT: boolean = false,
  mrtCapPct: number = 200
): CalculationResult {
  // Calculate target bonus
  const targetBonus = calculateTargetBonus(input.baseSalary, input.targetBonusPct);
  
  // Normalize weights
  const normalizedWeights = normalizeWeights(input.investmentWeight, input.qualitativeWeight);
  
  // Calculate component scores
  const investmentScore = calculateComponentScore(normalizedWeights.investmentWeight, input.investmentScoreMultiplier);
  const qualitativeScore = calculateComponentScore(normalizedWeights.qualitativeWeight, input.qualScoreMultiplier);
  
  // Calculate pre-RAF bonus
  const preRafBonus = calculatePreRafBonus(targetBonus, investmentScore, qualitativeScore);
  
  // Calculate RAF (either from input or from RAF parameters)
  const raf = rafParams ? calculateRAF(rafParams) : input.raf;
  
  // Apply RAF to get final bonus
  const finalBonus = applyRAFToBonus(preRafBonus, raf);
  
  // Perform cap and policy checks
  const capChecks = performCapAndPolicyChecks(input.baseSalary, finalBonus, isMRT, mrtCapPct);
  
  // Apply cap if necessary
  const cappedBonus = capChecks.appliedCap !== null 
    ? applyCapToBonus(finalBonus, capChecks.baseSalaryCap, capChecks.mrtCap) 
    : finalBonus;
  
  // Calculate bonus to salary ratio
  const bonusToSalaryRatio = calculateBonusToSalaryRatio(cappedBonus, input.baseSalary);
  
  // Return calculation result
  return {
    targetBonus,
    normalizedWeights,
    investmentScore,
    qualitativeScore,
    preRafBonus,
    raf,
    finalBonus,
    cappedBonus,
    bonusToSalaryRatio,
    baseSalaryCap: capChecks.baseSalaryCap,
    mrtCap: capChecks.mrtCap,
    appliedCap: capChecks.appliedCap ? capChecks.appliedCap.toString() : null,
    policyBreach: capChecks.policyBreach
  };
}
