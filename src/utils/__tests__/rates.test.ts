import { describe, it, expect } from 'vitest';
import { pickTierAPR, calculateDailyInterest, getDefaultSchwabTiers, formatAPR, parseAPR } from '../rates';
import { RateTier } from '../../types';

describe('rates utilities', () => {
  describe('pickTierAPR', () => {
    const tiers: RateTier[] = [
      { minBalance: 0, maxBalance: 25000, apr: 0.119 },
      { minBalance: 25000, maxBalance: 100000, apr: 0.111 },
      { minBalance: 100000, maxBalance: 250000, apr: 0.106 },
      { minBalance: 250000, maxBalance: 1000000, apr: 0.102 },
      { minBalance: 1000000, apr: 0.098 }
    ];

    it('should return correct APR for balance in first tier', () => {
      expect(pickTierAPR(10000, tiers)).toBe(0.119);
    });

    it('should return correct APR for balance in middle tier', () => {
      expect(pickTierAPR(50000, tiers)).toBe(0.111);
    });

    it('should return correct APR for balance in highest tier', () => {
      expect(pickTierAPR(1500000, tiers)).toBe(0.098);
    });

    it('should return correct APR for exact tier boundary', () => {
      expect(pickTierAPR(25000, tiers)).toBe(0.111);
    });

    it('should return 0 for negative balance', () => {
      expect(pickTierAPR(-1000, tiers)).toBe(0);
    });
  });

  describe('calculateDailyInterest', () => {
    it('should calculate daily interest with 360-day basis', () => {
      const result = calculateDailyInterest(10000, 0.10, 360);
      expect(result).toBeCloseTo(2.78, 2);
    });

    it('should calculate daily interest with 365-day basis', () => {
      const result = calculateDailyInterest(10000, 0.10, 365);
      expect(result).toBeCloseTo(2.74, 2);
    });

    it('should return 0 for zero balance', () => {
      const result = calculateDailyInterest(0, 0.10, 360);
      expect(result).toBe(0);
    });

    it('should return 0 for negative balance', () => {
      const result = calculateDailyInterest(-1000, 0.10, 360);
      expect(result).toBe(0);
    });
  });

  describe('getDefaultSchwabTiers', () => {
    it('should return default Schwab tiers', () => {
      const tiers = getDefaultSchwabTiers();
      expect(tiers).toHaveLength(5);
      expect(tiers[0].minBalance).toBe(0);
      expect(tiers[0].maxBalance).toBe(25000);
      expect(tiers[0].apr).toBe(0.119);
    });
  });

  describe('formatAPR', () => {
    it('should format APR as percentage', () => {
      expect(formatAPR(0.10)).toBe('10.000%');
      expect(formatAPR(0.119)).toBe('11.900%');
    });
  });

  describe('parseAPR', () => {
    it('should parse percentage string to decimal', () => {
      expect(parseAPR('10%')).toBe(0.10);
      expect(parseAPR('11.9%')).toBe(0.119);
      expect(parseAPR('10')).toBe(0.10);
    });

    it('should return 0 for invalid input', () => {
      expect(parseAPR('invalid')).toBe(0);
      expect(parseAPR('')).toBe(0);
    });
  });
});
