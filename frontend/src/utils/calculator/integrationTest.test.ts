import { calculateBonus } from './calculationEngine';
import { CalculatorInput, RafParameters } from '../../types/calculator';

// Note: To run these tests, you'll need to install Jest types with:
// npm install --save-dev @types/jest

describe('Calculation Engine Integration Tests', () => {
  // Standard test inputs
  const standardInput: CalculatorInput = {
    baseSalary: 100000,
    targetBonusPct: 50,
    investmentWeight: 70,
    qualitativeWeight: 30,
    investmentScoreMultiplier: 1.2,
    qualScoreMultiplier: 0.8,
    raf: 1.0
  };

  const standardRafParams: RafParameters = {
    teamRevenueYear1: 1000000,
    teamRevenueYear2: 1100000,
    teamRevenueYear3: 1200000,
    sensitivityFactor: 1.0,
    lowerBound: 0.5,
    upperBound: 1.5
  };

  it('should calculate bonus correctly with standard inputs', () => {
    const result = calculateBonus(standardInput);
    
    // Check that all expected properties are present
    expect(result).toHaveProperty('targetBonus');
    expect(result).toHaveProperty('normalizedWeights');
    expect(result).toHaveProperty('investmentScore');
    expect(result).toHaveProperty('qualitativeScore');
    expect(result).toHaveProperty('preRafBonus');
    expect(result).toHaveProperty('raf');
    expect(result).toHaveProperty('finalBonus');
    expect(result).toHaveProperty('cappedBonus');
    expect(result).toHaveProperty('baseSalaryCap');
    expect(result).toHaveProperty('policyBreach');
    
    // Check specific calculations
    expect(result.targetBonus).toBe(50000); // 100000 * 50%
    expect(result.normalizedWeights.investmentWeight).toBeCloseTo(0.7);
    expect(result.normalizedWeights.qualitativeWeight).toBeCloseTo(0.3);
    expect(result.investmentScore).toBeCloseTo(0.84); // 0.7 * 1.2
    expect(result.qualitativeScore).toBeCloseTo(0.24); // 0.3 * 0.8
    expect(result.preRafBonus).toBeCloseTo(54000); // 50000 * (0.84 + 0.24)
    expect(result.raf).toBe(1.0);
    expect(result.finalBonus).toBeCloseTo(54000); // 54000 * 1.0
    expect(result.cappedBonus).toBeCloseTo(54000); // No cap applied
    expect(result.baseSalaryCap).toBe(300000); // 3 * 100000
    expect(result.policyBreach).toBe(false); // 54000 < 300000
  });

  it('should calculate bonus correctly with RAF parameters', () => {
    const result = calculateBonus(standardInput, standardRafParams);
    
    // The RAF should be calculated from the parameters
    expect(result.raf).not.toBe(1.0);
    expect(result.raf).toBeGreaterThan(0);
    
    // The final bonus should reflect the calculated RAF
    expect(result.finalBonus).toBeCloseTo(result.preRafBonus * result.raf);
  });

  it('should apply 3x base salary cap when bonus exceeds it', () => {
    const highBonusInput: CalculatorInput = {
      ...standardInput,
      targetBonusPct: 200,
      investmentScoreMultiplier: 2.0,
      qualScoreMultiplier: 2.0
    };
    
    const result = calculateBonus(highBonusInput);
    
    // The bonus should be capped at 3x base salary
    expect(result.finalBonus).toBeGreaterThan(300000); // Uncapped bonus > 300000
    expect(result.cappedBonus).toBe(300000); // Capped at 3x base salary
    expect(result.policyBreach).toBe(true);
    expect(result.appliedCap).toBe('3x Base Salary');
  });

  it('should apply MRT cap when applicable and lower than 3x base salary', () => {
    const highBonusInput: CalculatorInput = {
      ...standardInput,
      targetBonusPct: 150,
      investmentScoreMultiplier: 1.5,
      qualScoreMultiplier: 1.5
    };
    
    const result = calculateBonus(highBonusInput, undefined, true, 150);
    
    // The MRT cap should be 150% of base salary
    expect(result.mrtCap).toBe(150000); // 100000 * 150%
    
    // The bonus should be capped at the MRT cap
    expect(result.finalBonus).toBeGreaterThan(150000); // Uncapped bonus > 150000
    expect(result.cappedBonus).toBe(150000); // Capped at MRT cap
    expect(result.appliedCap).toBe('MRT Cap');
  });

  it('should handle zero weights by defaulting to equal weights', () => {
    const zeroWeightsInput: CalculatorInput = {
      ...standardInput,
      investmentWeight: 0,
      qualitativeWeight: 0
    };
    
    const result = calculateBonus(zeroWeightsInput);
    
    // Weights should default to 50/50
    expect(result.normalizedWeights.investmentWeight).toBe(0.5);
    expect(result.normalizedWeights.qualitativeWeight).toBe(0.5);
  });

  it('should handle zero base salary gracefully', () => {
    const zeroBaseSalaryInput: CalculatorInput = {
      ...standardInput,
      baseSalary: 0
    };
    
    const result = calculateBonus(zeroBaseSalaryInput);
    
    // All bonus amounts should be zero
    expect(result.targetBonus).toBe(0);
    expect(result.preRafBonus).toBe(0);
    expect(result.finalBonus).toBe(0);
    expect(result.cappedBonus).toBe(0);
    
    // Caps should be zero
    expect(result.baseSalaryCap).toBe(0);
    expect(result.bonusToSalaryRatio).toBe(0);
  });
});
