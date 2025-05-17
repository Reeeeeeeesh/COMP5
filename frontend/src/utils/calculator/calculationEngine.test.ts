import {
  normalizeWeights,
  calculateTargetBonus,
  calculateInvestmentComponent,
  calculateQualitativeComponent,
  calculateWeightedPerformance,
  calculateInitialBonus,
  calculateRAF,
  performCapChecks,
  calculateFinalBonus,
  calculateBonusToSalaryRatio,
  calculateBonus
} from './calculationEngine';
import { CalculatorInput, RafParameters } from '../../types/calculator';

describe('Calculation Engine', () => {
  // Test data
  const standardInput: CalculatorInput = {
    baseSalary: 100000,
    targetBonusPct: 20,
    investmentWeight: 70,
    qualitativeWeight: 30,
    investmentScoreMultiplier: 1.0,
    qualScoreMultiplier: 1.0,
    raf: 1.0
  };

  const rafParams: RafParameters = {
    teamRevenueYear1: 1000000,
    teamRevenueYear2: 1100000,
    teamRevenueYear3: 1200000,
    sensitivityFactor: 1.0,
    lowerBound: 0.5,
    upperBound: 1.5
  };

  describe('normalizeWeights', () => {
    it('should normalize weights to sum to 1', () => {
      const result = normalizeWeights(70, 30);
      expect(result.normalizedInvestmentWeight).toBeCloseTo(0.7);
      expect(result.normalizedQualitativeWeight).toBeCloseTo(0.3);
    });

    it('should handle zero weights by defaulting to 50/50', () => {
      const result = normalizeWeights(0, 0);
      expect(result.normalizedInvestmentWeight).toBeCloseTo(0.5);
      expect(result.normalizedQualitativeWeight).toBeCloseTo(0.5);
    });
  });

  describe('calculateTargetBonus', () => {
    it('should calculate target bonus correctly', () => {
      const result = calculateTargetBonus(100000, 20);
      expect(result).toBe(20000);
    });

    it('should handle zero base salary', () => {
      const result = calculateTargetBonus(0, 20);
      expect(result).toBe(0);
    });

    it('should handle zero target bonus percentage', () => {
      const result = calculateTargetBonus(100000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateInvestmentComponent', () => {
    it('should calculate investment component correctly', () => {
      const result = calculateInvestmentComponent(0.7, 1.2);
      expect(result).toBeCloseTo(0.84);
    });
  });

  describe('calculateQualitativeComponent', () => {
    it('should calculate qualitative component correctly', () => {
      const result = calculateQualitativeComponent(0.3, 0.8);
      expect(result).toBeCloseTo(0.24);
    });
  });

  describe('calculateWeightedPerformance', () => {
    it('should calculate weighted performance correctly', () => {
      const result = calculateWeightedPerformance(0.84, 0.24);
      expect(result).toBeCloseTo(1.08);
    });
  });

  describe('calculateInitialBonus', () => {
    it('should calculate initial bonus correctly', () => {
      const result = calculateInitialBonus(20000, 1.08);
      expect(result).toBeCloseTo(21600);
    });
  });

  describe('calculateRAF', () => {
    it('should calculate RAF correctly', () => {
      const result = calculateRAF(rafParams);
      // The exact value will depend on the implementation, but it should be within bounds
      expect(result).toBeGreaterThanOrEqual(rafParams.lowerBound);
      expect(result).toBeLessThanOrEqual(rafParams.upperBound);
    });

    it('should respect lower bound', () => {
      const params = { ...rafParams, lowerBound: 1.0 };
      const result = calculateRAF(params);
      expect(result).toBeGreaterThanOrEqual(1.0);
    });

    it('should respect upper bound', () => {
      const params = { ...rafParams, upperBound: 1.0 };
      const result = calculateRAF(params);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });

  describe('performCapChecks', () => {
    it('should identify policy breach when bonus exceeds 3x base salary', () => {
      const result = performCapChecks(100000, 350000);
      expect(result.policyBreach).toBe(true);
      expect(result.appliedCap).toBe(300000);
    });

    it('should not identify policy breach when bonus is below 3x base salary', () => {
      const result = performCapChecks(100000, 250000);
      expect(result.policyBreach).toBe(false);
      expect(result.appliedCap).toBe(null);
    });

    it('should apply MRT cap when applicable and lower than 3x base salary', () => {
      const result = performCapChecks(100000, 250000, true, 150);
      expect(result.appliedCap).toBe(150000);
    });

    it('should apply the lower of MRT cap and 3x base salary', () => {
      const result = performCapChecks(100000, 350000, true, 250);
      expect(result.appliedCap).toBe(250000);
    });
  });

  describe('calculateFinalBonus', () => {
    it('should apply RAF to initial bonus', () => {
      const result = calculateFinalBonus(20000, 0.9, { baseSalaryCap: 300000, mrtCap: null, appliedCap: null, policyBreach: false });
      expect(result).toBeCloseTo(18000);
    });

    it('should apply cap if bonus exceeds cap', () => {
      const result = calculateFinalBonus(20000, 1.0, { baseSalaryCap: 300000, mrtCap: null, appliedCap: 15000, policyBreach: false });
      expect(result).toBe(15000);
    });
  });

  describe('calculateBonusToSalaryRatio', () => {
    it('should calculate bonus to salary ratio correctly', () => {
      const result = calculateBonusToSalaryRatio(20000, 100000);
      expect(result).toBe(0.2);
    });

    it('should handle zero base salary', () => {
      const result = calculateBonusToSalaryRatio(20000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateBonus', () => {
    it('should calculate bonus correctly for standard input', () => {
      const result = calculateBonus(standardInput);
      expect(result.finalBonus).toBeCloseTo(20000);
      expect(result.bonusToSalaryRatio).toBeCloseTo(0.2);
      expect(result.policyBreach).toBe(false);
    });

    it('should handle above-target performance', () => {
      const input = {
        ...standardInput,
        investmentScoreMultiplier: 1.5,
        qualScoreMultiplier: 1.3
      };
      const result = calculateBonus(input);
      expect(result.finalBonus).toBeGreaterThan(standardInput.baseSalary * (standardInput.targetBonusPct / 100));
    });

    it('should handle below-target performance', () => {
      const input = {
        ...standardInput,
        investmentScoreMultiplier: 0.7,
        qualScoreMultiplier: 0.8
      };
      const result = calculateBonus(input);
      expect(result.finalBonus).toBeLessThan(standardInput.baseSalary * (standardInput.targetBonusPct / 100));
    });

    it('should apply RAF correctly', () => {
      const input = {
        ...standardInput,
        raf: 0.8
      };
      const result = calculateBonus(input);
      expect(result.finalBonus).toBeCloseTo(16000);
    });

    it('should identify policy breach', () => {
      const input = {
        ...standardInput,
        targetBonusPct: 150,
        investmentScoreMultiplier: 1.5,
        qualScoreMultiplier: 1.5,
        raf: 1.5
      };
      const result = calculateBonus(input);
      expect(result.policyBreach).toBe(true);
    });

    it('should use RAF parameters if provided', () => {
      const result = calculateBonus(standardInput, rafParams);
      // The exact value will depend on the implementation, but it should be calculated
      expect(result.finalBonus).not.toBeNaN();
    });

    it('should apply MRT cap if applicable', () => {
      const input = {
        ...standardInput,
        targetBonusPct: 150,
        investmentScoreMultiplier: 1.5,
        qualScoreMultiplier: 1.5
      };
      const result = calculateBonus(input, undefined, true, 150);
      expect(result.appliedCap).toBe('MRT Cap');
    });
  });
});
