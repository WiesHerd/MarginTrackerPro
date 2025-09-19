import { describe, it, expect } from 'vitest';
import { 
  applyTradeToLotsFIFO,
  applyTradeToLotsLIFO,
  calculateUnrealizedPnL,
  calculateAllocatedInterest,
  getLotsForTicker,
  getTotalQuantityForTicker,
  validateSellTrade,
  splitLot
} from '../lots';
import { Trade, Lot } from '../../types';

describe('lots utilities', () => {
  const mockLots: Lot[] = [
    {
      id: 'lot1',
      ticker: 'AAPL',
      openDate: '2024-01-15',
      side: 'LONG',
      qtyOpen: 100,
      qtyInit: 100,
      costBasisPerShare: 150.25,
      feesTotal: 0.95
    },
    {
      id: 'lot2',
      ticker: 'AAPL',
      openDate: '2024-01-16',
      side: 'LONG',
      qtyOpen: 50,
      qtyInit: 50,
      costBasisPerShare: 152.50,
      feesTotal: 0.95
    }
  ];

  describe('applyTradeToLotsFIFO', () => {
    it('should create new lot for BUY trade', () => {
      const trade: Trade = {
        id: 'trade1',
        date: '2024-01-17',
        ticker: 'MSFT',
        side: 'BUY',
        qty: 25,
        price: 300.00,
        fees: 0.95
      };

      const result = applyTradeToLotsFIFO(trade, mockLots);
      
      expect(result.newLots).toHaveLength(1);
      expect(result.newLots[0].ticker).toBe('MSFT');
      expect(result.newLots[0].side).toBe('LONG');
      expect(result.newLots[0].qtyOpen).toBe(25);
      expect(result.updatedLots).toEqual(mockLots);
      expect(result.realizedPnL).toBe(0);
    });

    it('should create new lot for SHORT trade', () => {
      const trade: Trade = {
        id: 'trade1',
        date: '2024-01-17',
        ticker: 'GOOGL',
        side: 'SHORT',
        qty: 10,
        price: 2500.00,
        fees: 0.95
      };

      const result = applyTradeToLotsFIFO(trade, mockLots);
      
      expect(result.newLots).toHaveLength(1);
      expect(result.newLots[0].ticker).toBe('GOOGL');
      expect(result.newLots[0].side).toBe('SHORT');
      expect(result.newLots[0].qtyOpen).toBe(10);
    });

    it('should match SELL trade against existing lots using FIFO', () => {
      const trade: Trade = {
        id: 'trade1',
        date: '2024-01-17',
        ticker: 'AAPL',
        side: 'SELL',
        qty: 75,
        price: 160.00,
        fees: 0.95
      };

      const result = applyTradeToLotsFIFO(trade, mockLots);
      
      expect(result.realizedPnL).toBeCloseTo(731.25, 2); // 75 * (160 - 150.25)
      expect(result.updatedLots[0].qtyOpen).toBe(25); // 100 - 75
      expect(result.updatedLots[1].qtyOpen).toBe(50); // unchanged
    });
  });

  describe('applyTradeToLotsLIFO', () => {
    it('should match SELL trade against existing lots using LIFO', () => {
      const trade: Trade = {
        id: 'trade1',
        date: '2024-01-17',
        ticker: 'AAPL',
        side: 'SELL',
        qty: 30,
        price: 160.00,
        fees: 0.95
      };

      const result = applyTradeToLotsLIFO(trade, mockLots);
      
      expect(result.realizedPnL).toBeCloseTo(225, 2); // 30 * (160 - 152.50)
      expect(result.updatedLots[0].qtyOpen).toBe(100); // unchanged
      expect(result.updatedLots[1].qtyOpen).toBe(20); // 50 - 30
    });
  });

  describe('calculateUnrealizedPnL', () => {
    it('should calculate unrealized P&L for profitable position', () => {
      const lot = mockLots[0];
      const result = calculateUnrealizedPnL(lot, 160.25);
      expect(result).toBe(1000); // 100 * (160.25 - 150.25)
    });

    it('should calculate unrealized P&L for losing position', () => {
      const lot = mockLots[0];
      const result = calculateUnrealizedPnL(lot, 140.25);
      expect(result).toBe(-1000); // 100 * (140.25 - 150.25)
    });

    it('should return 0 when no current price provided', () => {
      const lot = mockLots[0];
      const result = calculateUnrealizedPnL(lot, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateAllocatedInterest', () => {
    it('should calculate allocated interest based on days held', () => {
      const lot = mockLots[0];
      const totalInterest = 100;
      const totalDays = 30;
      
      const result = calculateAllocatedInterest(lot, totalInterest, totalDays);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getLotsForTicker', () => {
    it('should return lots for specific ticker', () => {
      const result = getLotsForTicker('AAPL', mockLots);
      expect(result).toHaveLength(2);
      expect(result.every(lot => lot.ticker === 'AAPL')).toBe(true);
    });

    it('should return empty array for ticker with no lots', () => {
      const result = getLotsForTicker('MSFT', mockLots);
      expect(result).toHaveLength(0);
    });
  });

  describe('getTotalQuantityForTicker', () => {
    it('should calculate total quantity for ticker', () => {
      const result = getTotalQuantityForTicker('AAPL', mockLots);
      expect(result).toBe(150); // 100 + 50
    });

    it('should return 0 for ticker with no lots', () => {
      const result = getTotalQuantityForTicker('MSFT', mockLots);
      expect(result).toBe(0);
    });
  });

  describe('validateSellTrade', () => {
    it('should validate successful sell trade', () => {
      const trade: Trade = {
        id: 'trade1',
        date: '2024-01-17',
        ticker: 'AAPL',
        side: 'SELL',
        qty: 50,
        price: 160.00,
        fees: 0.95
      };

      const result = validateSellTrade(trade, mockLots);
      expect(result.isValid).toBe(true);
      expect(result.availableQty).toBe(150);
    });

    it('should reject sell trade with insufficient quantity', () => {
      const trade: Trade = {
        id: 'trade1',
        date: '2024-01-17',
        ticker: 'AAPL',
        side: 'SELL',
        qty: 200,
        price: 160.00,
        fees: 0.95
      };

      const result = validateSellTrade(trade, mockLots);
      expect(result.isValid).toBe(false);
      expect(result.availableQty).toBe(150);
      expect(result.error).toContain('Insufficient quantity');
    });
  });

  describe('splitLot', () => {
    it('should split lot correctly', () => {
      const lot = mockLots[0];
      const sellQty = 30;
      
      const result = splitLot(lot, sellQty);
      
      expect(result.remainingLot.qtyOpen).toBe(70);
      expect(result.remainingLot.qtyInit).toBe(70);
      expect(result.soldLot.qtyOpen).toBe(30);
      expect(result.soldLot.qtyInit).toBe(30);
      expect(result.soldLot.costBasisPerShare).toBe(lot.costBasisPerShare);
    });
  });
});
