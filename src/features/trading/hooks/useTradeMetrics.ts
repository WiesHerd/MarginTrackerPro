import { useMemo } from 'react';
import { Trade } from '../types';
import { calculateTradeMetrics, calculatePortfolioMetrics } from '../utils/tradeCalculations';

/**
 * Custom hook for memoized trade metrics calculations
 * Prevents unnecessary recalculations on component re-renders
 */
export const useTradeMetrics = (trade: Trade, selectedMarginRate: number) => {
  return useMemo(
    () => calculateTradeMetrics(trade, selectedMarginRate),
    [trade.id, trade.currentPrice, trade.sellPrice, selectedMarginRate, trade.interestRate]
  );
};

/**
 * Custom hook for memoized portfolio-level metrics
 * Optimized to recalculate only when trades actually change
 */
export const usePortfolioMetrics = (
  trades: Trade[],
  tradingHistory: Trade[],
  selectedMarginRate: number
) => {
  return useMemo(
    () => calculatePortfolioMetrics(trades, tradingHistory, selectedMarginRate),
    [
      trades.length,
      trades.map(t => `${t.id}-${t.currentPrice}-${t.sellPrice}`).join(','),
      tradingHistory.length,
      selectedMarginRate
    ]
  );
};

/**
 * Custom hook for memoized multiple trade metrics
 * Useful for tables and lists to avoid recalculating the same trade multiple times
 */
export const useMultipleTradeMetrics = (trades: Trade[], selectedMarginRate: number) => {
  return useMemo(
    () => trades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade, selectedMarginRate)
    })),
    [
      trades.length,
      trades.map(t => `${t.id}-${t.currentPrice}-${t.sellPrice}-${t.interestRate}`).join(','),
      selectedMarginRate
    ]
  );
};



