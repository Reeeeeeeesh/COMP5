/**
 * Types for the calculator inputs, intermediate calculations, and results
 */

/**
 * Calculator input parameters
 */
export interface CalculatorInput {
  baseSalary: number;
  targetBonusPct: number;
  investmentWeight: number;
  qualitativeWeight: number;
  investmentScoreMultiplier: number;
  qualScoreMultiplier: number;
  raf: number;
}

/**
 * Intermediate calculation components
 */
export interface CalculationComponents {
  investmentComponent: number;
  qualitativeComponent: number;
  weightedPerformance: number;
  targetBonus: number;
  initialBonus: number;
}

/**
 * RAF calculation parameters
 */
export interface RafParameters {
  teamRevenueYear1: number;
  teamRevenueYear2: number;
  teamRevenueYear3: number;
  sensitivityFactor: number;
  lowerBound: number;
  upperBound: number;
}

/**
 * Cap and policy check results
 */
export interface CapCheckResults {
  baseSalaryCap: number;
  mrtCap: number | null;
  appliedCap: number | null;
  policyBreach: boolean;
}

/**
 * Final calculation results
 */
export interface CalculationResult {
  // Original properties
  investmentComponent: number;
  qualitativeComponent: number;
  weightedPerformance: number;
  finalBonus: number;
  bonusToSalaryRatio: number;
  policyBreach: boolean;
  appliedCap: string | null;
  
  // New properties from enhanced calculation engine
  targetBonus?: number;
  normalizedWeights?: { investmentWeight: number; qualitativeWeight: number };
  investmentScore?: number;
  qualitativeScore?: number;
  preRafBonus?: number;
  raf?: number;
  cappedBonus?: number;
  baseSalaryCap?: number;
  mrtCap?: number | null;
}
