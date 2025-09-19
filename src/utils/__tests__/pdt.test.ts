import { describe, it, expect } from 'vitest';
import { 
  isDayTrade, 
  getLast5BusinessDays, 
  countDayTradesLast5Days, 
  getPDTStatus,
  getDayTradesForDate,
  wouldCreateDayTrade,
  getPDTWarningMessage
} from '../pdt';
import { Trade, PDTStatus } from '../../types';
import { format } from 'date-fns';

describe('PDT utilities', () => {
  const mockTrades: Trade[] = [
    {
      id: 'trade1',
      date: '2024-01-15',
      ticker: 'AAPL',
      side: 'BUY',
      qty: 100,
      price: 150.25,
      fees: 0.95
    },
    {
      id: 'trade2',
      date: '2024-01-15',
      ticker: 'AAPL',
      side: 'SELL',
      qty: 50,
      price: 152.50,
      fees: 0.95
    },
    {
      id: 'trade3',
      date: '2024-01-16',
      ticker: 'MSFT',
      side: 'BUY',
      qty: 25,
      price: 300.00,
      fees: 0.95
    },
    {
      id: 'trade4',
      date: '2024-01-16',
      ticker: 'MSFT',
      side: 'SELL',
      qty: 25,
      price: 305.00,
      fees: 0.95
    },
    {
      id: 'trade5',
      date: '2024-01-17',
      ticker: 'GOOGL',
      side: 'SHORT',
      qty: 10,
      price: 2500.00,
      fees: 0.95
    },
    {
      id: 'trade6',
      date: '2024-01-17',
      ticker: 'GOOGL',
      side: 'COVER',
      qty: 10,
      price: 2480.00,
      fees: 0.95
    }
  ];

  describe('isDayTrade', () => {
    it('should identify day trade correctly', () => {
      const sellTrade = mockTrades[1]; // AAPL SELL on 2024-01-15
      const result = isDayTrade(sellTrade, mockTrades);
      expect(result).toBe(true);
    });

    it('should not identify non-day trade', () => {
      const buyTrade = mockTrades[0]; // AAPL BUY on 2024-01-15
      const result = isDayTrade(buyTrade, mockTrades);
      expect(result).toBe(false);
    });

    it('should identify short/cover as day trade', () => {
      const coverTrade = mockTrades[5]; // GOOGL COVER on 2024-01-17
      const result = isDayTrade(coverTrade, mockTrades);
      expect(result).toBe(true);
    });
  });

  describe('getLast5BusinessDays', () => {
    it('should return last 5 business days', () => {
      const fromDate = new Date('2024-01-20'); // Saturday
      const result = getLast5BusinessDays(fromDate);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('2024-01-19'); // Friday
      expect(result[1]).toBe('2024-01-18'); // Thursday
      expect(result[2]).toBe('2024-01-17'); // Wednesday
      expect(result[3]).toBe('2024-01-16'); // Tuesday
      expect(result[4]).toBe('2024-01-15'); // Monday
    });
  });

  describe('countDayTradesLast5Days', () => {
    it('should count day trades in last 5 business days', () => {
      const result = countDayTradesLast5Days(mockTrades, '2024-01-20');
      expect(result).toBe(3); // AAPL, MSFT, GOOGL day trades
    });

    it('should return 0 when no day trades', () => {
      const noDayTrades: Trade[] = [
        {
          id: 'trade1',
          date: '2024-01-15',
          ticker: 'AAPL',
          side: 'BUY',
          qty: 100,
          price: 150.25,
          fees: 0.95
        }
      ];
      const result = countDayTradesLast5Days(noDayTrades, '2024-01-20');
      expect(result).toBe(0);
    });
  });

  describe('getPDTStatus', () => {
    it('should return PDT status with risk warning', () => {
      const result = getPDTStatus(mockTrades, '2024-01-20');
      
      expect(result.dayTradesLast5Days).toBe(3);
      expect(result.isPDTRisk).toBe(false); // 3 < 4
      expect(result.last5BusinessDays).toHaveLength(5);
      expect(result.dayTradesByDate['2024-01-15']).toBe(1);
      expect(result.dayTradesByDate['2024-01-16']).toBe(1);
      expect(result.dayTradesByDate['2024-01-17']).toBe(1);
    });

    it('should identify PDT risk when approaching limit', () => {
      // Add more day trades to trigger PDT risk
      const moreTrades = [...mockTrades, ...mockTrades.map(trade => ({
        ...trade,
        id: `extra_${trade.id}`,
        date: '2024-01-18'
      }))];
      
      const result = getPDTStatus(moreTrades, '2024-01-20');
      expect(result.dayTradesLast5Days).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getDayTradesForDate', () => {
    it('should return day trades for specific date', () => {
      const result = getDayTradesForDate('2024-01-15', mockTrades);
      expect(result).toHaveLength(1); // AAPL SELL
      expect(result[0].ticker).toBe('AAPL');
      expect(result[0].side).toBe('SELL');
    });

    it('should return empty array for date with no day trades', () => {
      const result = getDayTradesForDate('2024-01-18', mockTrades);
      expect(result).toHaveLength(0);
    });
  });

  describe('wouldCreateDayTrade', () => {
    it('should detect if new trade would create day trade', () => {
      const newTrade: Trade = {
        id: 'new_trade',
        date: '2024-01-15',
        ticker: 'AAPL',
        side: 'SELL',
        qty: 25,
        price: 155.00,
        fees: 0.95
      };

      const result = wouldCreateDayTrade(newTrade, mockTrades);
      expect(result).toBe(true);
    });

    it('should not detect day trade for different date', () => {
      const newTrade: Trade = {
        id: 'new_trade',
        date: '2024-01-18',
        ticker: 'AAPL',
        side: 'SELL',
        qty: 25,
        price: 155.00,
        fees: 0.95
      };

      const result = wouldCreateDayTrade(newTrade, mockTrades);
      expect(result).toBe(false);
    });
  });

  describe('getPDTWarningMessage', () => {
    it('should return PDT risk warning', () => {
      const pdtStatus: PDTStatus = {
        dayTradesLast5Days: 4,
        isPDTRisk: true,
        last5BusinessDays: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
        dayTradesByDate: {}
      };

      const result = getPDTWarningMessage(pdtStatus);
      expect(result).toContain('PDT Risk');
      expect(result).toContain('4 day trades');
    });

    it('should return approaching limit warning', () => {
      const pdtStatus: PDTStatus = {
        dayTradesLast5Days: 3,
        isPDTRisk: false,
        last5BusinessDays: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
        dayTradesByDate: {}
      };

      const result = getPDTWarningMessage(pdtStatus);
      expect(result).toContain('Approaching PDT limit');
      expect(result).toContain('3 day trades');
    });

    it('should return info message for low count', () => {
      const pdtStatus: PDTStatus = {
        dayTradesLast5Days: 1,
        isPDTRisk: false,
        last5BusinessDays: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
        dayTradesByDate: {}
      };

      const result = getPDTWarningMessage(pdtStatus);
      expect(result).toContain('Day trades: 1');
    });
  });
});
