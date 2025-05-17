import {
  exceedsBaseSalaryCap,
  calculateBaseSalaryCap,
  exceedsMRTCap,
  calculateMRTCap,
  applyCapToBonus,
  determineAppliedCap,
  performCapAndPolicyChecks
} from './capPolicyLogic';

describe('Cap and Policy Logic', () => {
  describe('exceedsBaseSalaryCap', () => {
    it('should return true when bonus exceeds 3x base salary', () => {
      expect(exceedsBaseSalaryCap(100000, 350000)).toBe(true);
    });

    it('should return false when bonus is equal to 3x base salary', () => {
      expect(exceedsBaseSalaryCap(100000, 300000)).toBe(false);
    });

    it('should return false when bonus is less than 3x base salary', () => {
      expect(exceedsBaseSalaryCap(100000, 250000)).toBe(false);
    });
  });

  describe('calculateBaseSalaryCap', () => {
    it('should calculate 3x base salary cap correctly', () => {
      expect(calculateBaseSalaryCap(100000)).toBe(300000);
    });

    it('should handle zero base salary', () => {
      expect(calculateBaseSalaryCap(0)).toBe(0);
    });
  });

  describe('exceedsMRTCap', () => {
    it('should return true when bonus exceeds MRT cap', () => {
      expect(exceedsMRTCap(100000, 250000, 200)).toBe(true);
    });

    it('should return false when bonus is equal to MRT cap', () => {
      expect(exceedsMRTCap(100000, 200000, 200)).toBe(false);
    });

    it('should return false when bonus is less than MRT cap', () => {
      expect(exceedsMRTCap(100000, 150000, 200)).toBe(false);
    });
  });

  describe('calculateMRTCap', () => {
    it('should calculate MRT cap correctly', () => {
      expect(calculateMRTCap(100000, 200)).toBe(200000);
    });

    it('should handle zero base salary', () => {
      expect(calculateMRTCap(0, 200)).toBe(0);
    });
  });

  describe('applyCapToBonus', () => {
    it('should not cap bonus when it is below all caps', () => {
      expect(applyCapToBonus(200000, 300000, null)).toBe(200000);
      expect(applyCapToBonus(200000, 300000, 250000)).toBe(200000);
    });

    it('should apply base salary cap when bonus exceeds it', () => {
      expect(applyCapToBonus(350000, 300000, null)).toBe(300000);
    });

    it('should apply MRT cap when bonus exceeds it and it is lower than base salary cap', () => {
      expect(applyCapToBonus(350000, 300000, 250000)).toBe(250000);
    });

    it('should apply base salary cap when it is lower than MRT cap', () => {
      expect(applyCapToBonus(350000, 200000, 250000)).toBe(200000);
    });
  });

  describe('determineAppliedCap', () => {
    it('should return null when no cap was applied', () => {
      expect(determineAppliedCap(200000, 200000, 300000, null)).toBe(null);
    });

    it('should return "3x Base Salary" when base salary cap was applied', () => {
      expect(determineAppliedCap(350000, 300000, 300000, null)).toBe('3x Base Salary');
    });

    it('should return "MRT Cap" when MRT cap was applied', () => {
      expect(determineAppliedCap(350000, 250000, 300000, 250000)).toBe('MRT Cap');
    });
  });

  describe('performCapAndPolicyChecks', () => {
    it('should correctly identify when no caps are exceeded', () => {
      const result = performCapAndPolicyChecks(100000, 200000);
      expect(result.baseSalaryCap).toBe(300000);
      expect(result.mrtCap).toBe(null);
      expect(result.appliedCap).toBe(null);
      expect(result.policyBreach).toBe(false);
    });

    it('should correctly identify when base salary cap is exceeded', () => {
      const result = performCapAndPolicyChecks(100000, 350000);
      expect(result.baseSalaryCap).toBe(300000);
      expect(result.mrtCap).toBe(null);
      expect(result.appliedCap).toBe(300000);
      expect(result.policyBreach).toBe(true);
    });

    it('should correctly identify when MRT cap is exceeded', () => {
      const result = performCapAndPolicyChecks(100000, 250000, true, 150);
      expect(result.baseSalaryCap).toBe(300000);
      expect(result.mrtCap).toBe(150000);
      expect(result.appliedCap).toBe(150000);
      expect(result.policyBreach).toBe(false);
    });

    it('should apply the lower of base salary cap and MRT cap', () => {
      const result = performCapAndPolicyChecks(100000, 350000, true, 250);
      expect(result.baseSalaryCap).toBe(300000);
      expect(result.mrtCap).toBe(250000);
      expect(result.appliedCap).toBe(250000);
      expect(result.policyBreach).toBe(true);
    });
  });
});
