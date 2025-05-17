import {
  calculateAverageTeamRevenue,
  calculateRawRAF,
  applyRAFBounds,
  calculateRAF,
  applyRAFToBonus,
  determineRAFAdjustment
} from './rafCalculation';
import { RafParameters } from '../../types/calculator';

describe('RAF Calculation', () => {
  // Test data
  const standardParams: RafParameters = {
    teamRevenueYear1: 1000000,
    teamRevenueYear2: 1100000,
    teamRevenueYear3: 1200000,
    sensitivityFactor: 1.0,
    lowerBound: 0.5,
    upperBound: 1.5
  };

  describe('calculateAverageTeamRevenue', () => {
    it('should calculate average revenue correctly', () => {
      const result = calculateAverageTeamRevenue(1000000, 1100000, 1200000);
      expect(result).toBe(1100000);
    });

    it('should handle zero values', () => {
      const result = calculateAverageTeamRevenue(0, 0, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateRawRAF', () => {
    it('should calculate raw RAF correctly for positive revenue', () => {
      const result = calculateRawRAF(1000000, 1.0);
      // The exact value will depend on the implementation, but it should be a number
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should return 1.0 for zero revenue', () => {
      const result = calculateRawRAF(0, 1.0);
      expect(result).toBe(1.0);
    });

    it('should scale with sensitivity factor', () => {
      const result1 = calculateRawRAF(1000000, 1.0);
      const result2 = calculateRawRAF(1000000, 2.0);
      // Higher sensitivity factor should result in a larger deviation from 1.0
      expect(Math.abs(result2 - 1.0)).toBeGreaterThan(Math.abs(result1 - 1.0));
    });
  });

  describe('applyRAFBounds', () => {
    it('should not modify RAF within bounds', () => {
      const result = applyRAFBounds(1.2, 0.5, 1.5);
      expect(result).toBe(1.2);
    });

    it('should apply lower bound', () => {
      const result = applyRAFBounds(0.3, 0.5, 1.5);
      expect(result).toBe(0.5);
    });

    it('should apply upper bound', () => {
      const result = applyRAFBounds(1.7, 0.5, 1.5);
      expect(result).toBe(1.5);
    });
  });

  describe('calculateRAF', () => {
    it('should calculate RAF correctly', () => {
      const result = calculateRAF(standardParams);
      // The exact value will depend on the implementation, but it should be within bounds
      expect(result).toBeGreaterThanOrEqual(standardParams.lowerBound);
      expect(result).toBeLessThanOrEqual(standardParams.upperBound);
    });

    it('should respect lower bound', () => {
      const params = { ...standardParams, lowerBound: 1.0 };
      const result = calculateRAF(params);
      expect(result).toBeGreaterThanOrEqual(1.0);
    });

    it('should respect upper bound', () => {
      const params = { ...standardParams, upperBound: 1.0 };
      const result = calculateRAF(params);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });

  describe('applyRAFToBonus', () => {
    it('should multiply bonus by RAF', () => {
      const result = applyRAFToBonus(20000, 1.2);
      expect(result).toBe(24000);
    });

    it('should handle zero bonus', () => {
      const result = applyRAFToBonus(0, 1.2);
      expect(result).toBe(0);
    });

    it('should handle zero RAF', () => {
      const result = applyRAFToBonus(20000, 0);
      expect(result).toBe(0);
    });
  });

  describe('determineRAFAdjustment', () => {
    it('should identify neutral adjustment', () => {
      const result = determineRAFAdjustment(1.0);
      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
    });

    it('should identify upward adjustment', () => {
      const result = determineRAFAdjustment(1.2);
      expect(result.direction).toBe('upward');
      expect(result.percentage).toBe(20);
    });

    it('should identify downward adjustment', () => {
      const result = determineRAFAdjustment(0.8);
      expect(result.direction).toBe('downward');
      expect(result.percentage).toBe(20);
    });
  });
});
