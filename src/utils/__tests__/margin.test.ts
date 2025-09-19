import { describe, it, expect } from 'vitest';
import { 
  calculateMarketValue, 
  computeEquity, 
  maintenanceRequirement, 
  computeMaintenanceRequirement,
  computeABP,
  computeInitialMargin,
  isMarginCall,
  calculateEquityImpact,
  getPositionSummary,
  getAccountSummary
} from '../margin';
import { PositionSnapshot, Lot, BrokerSettings } from '../../types';

describe('margin utilities', () => {
  describe('calculateMarketValue', () => {
    it('should calculate market value correctly', () => {
      expect(calculateMarketValue(100, 150.25)).toBe(15025);
    });

    it('should handle zero quantity', () => {
      expect(calculateMarketValue(0, 150.25)).toBe(0);
    });

    it('should handle zero price', () => {
      expect(calculateMarketValue(100, 0)).toBe(0);
    });
  });

  describe('computeEquity', () => {
    it('should calculate equity correctly', () => {
      const positions: PositionSnapshot[] = [
        { date: '2024-01-15', ticker: 'AAPL', lotId: 'lot1', qty: 100, marketPrice: 150.25 }
      ];
      const result = computeEquity(positions, 10000, 0);
      expect(result).toBe(5025); // 15025 - 10000
    });

    it('should handle credit balance', () => {
      const positions: PositionSnapshot[] = [
        { date: '2024-01-15', ticker: 'AAPL', lotId: 'lot1', qty: 100, marketPrice: 150.25 }
      ];
      const result = computeEquity(positions, 0, 1000);
      expect(result).toBe(16025); // 15025 + 1000
    });
  });

  describe('maintenanceRequirement', () => {
    it('should calculate maintenance requirement for long position', () => {
      const result = maintenanceRequirement(100, 150.25, 0.30);
      expect(result).toBe(4507.5); // 100 * 150.25 * 0.30
    });

    it('should calculate maintenance requirement for short position', () => {
      const result = maintenanceRequirement(-100, 150.25, 0.30);
      expect(result).toBe(4507.5); // 100 * 150.25 * 0.30
    });
  });

  describe('computeMaintenanceRequirement', () => {
    it('should calculate total maintenance requirement', () => {
      const positions: PositionSnapshot[] = [
        { date: '2024-01-15', ticker: 'AAPL', lotId: 'lot1', qty: 100, marketPrice: 150.25 },
        { date: '2024-01-15', ticker: 'MSFT', lotId: 'lot2', qty: 50, marketPrice: 300.15 }
      ];
      const lots: Lot[] = [];
      const result = computeMaintenanceRequirement(positions, lots, 0.30);
      expect(result).toBe(11256.75); // (100 * 150.25 + 50 * 300.15) * 0.30
    });
  });

  describe('computeABP', () => {
    it('should calculate available buying power', () => {
      const result = computeABP(50000, 15000, 0.50);
      expect(result).toBe(70000); // 2 * (50000 - 15000)
    });

    it('should return 0 when equity is less than maintenance requirement', () => {
      const result = computeABP(10000, 15000, 0.50);
      expect(result).toBe(0);
    });
  });

  describe('computeInitialMargin', () => {
    it('should calculate initial margin requirement', () => {
      const result = computeInitialMargin(10000, 0.50);
      expect(result).toBe(5000);
    });
  });

  describe('isMarginCall', () => {
    it('should detect margin call when equity is below maintenance requirement', () => {
      expect(isMarginCall(10000, 15000)).toBe(true);
    });

    it('should not detect margin call when equity is above maintenance requirement', () => {
      expect(isMarginCall(20000, 15000)).toBe(false);
    });
  });

  describe('calculateEquityImpact', () => {
    it('should calculate positive equity impact for profitable position', () => {
      const result = calculateEquityImpact(100, 160.25, 150.25);
      expect(result).toBe(1000); // 100 * (160.25 - 150.25)
    });

    it('should calculate negative equity impact for losing position', () => {
      const result = calculateEquityImpact(100, 140.25, 150.25);
      expect(result).toBe(-1000); // 100 * (140.25 - 150.25)
    });
  });

  describe('getPositionSummary', () => {
    it('should calculate position summary correctly', () => {
      const lots: Lot[] = [
        {
          id: 'lot1',
          ticker: 'AAPL',
          openDate: '2024-01-15',
          side: 'LONG',
          qtyOpen: 100,
          qtyInit: 100,
          costBasisPerShare: 150.25,
          feesTotal: 0.95
        }
      ];
      const result = getPositionSummary('AAPL', lots, 160.25);
      
      expect(result.totalQty).toBe(100);
      expect(result.totalMarketValue).toBe(16025);
      expect(result.totalCostBasis).toBe(15025);
      expect(result.totalUnrealizedPnL).toBe(1000);
      expect(result.totalRequiredMargin).toBe(4807.5); // 100 * 160.25 * 0.30
      expect(result.equityImpact).toBe(1000);
    });
  });

  describe('getAccountSummary', () => {
    it('should calculate account summary correctly', () => {
      const positions: PositionSnapshot[] = [
        { date: '2024-01-15', ticker: 'AAPL', lotId: 'lot1', qty: 100, marketPrice: 150.25 }
      ];
      const lots: Lot[] = [];
      const broker: BrokerSettings = {
        brokerName: 'Test Broker',
        tiers: [],
        dayCountBasis: 360,
        initialMarginPct: 0.50,
        maintenanceMarginPct: 0.30
      };
      
      const result = getAccountSummary(positions, lots, 10000, broker);
      
      expect(result.totalEquity).toBe(5025); // 15025 - 10000
      expect(result.totalDebit).toBe(10000);
      expect(result.totalMarketValue).toBe(15025);
      expect(result.maintenanceRequirement).toBe(4507.5); // 100 * 150.25 * 0.30
      expect(result.isMarginCall).toBe(false);
    });
  });
});
