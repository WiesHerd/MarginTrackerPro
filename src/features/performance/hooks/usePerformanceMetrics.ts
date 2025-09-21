import { useMemo } from 'react';
import { Trade } from '../../trading/types';
import { calculateTradeMetrics } from '../../trading/utils/tradeCalculations';

export interface PerformanceMetrics {
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturnPerTrade: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  largestWin: number;
  largestLoss: number;
  totalInterest: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalDaysTrading: number;
  avgHoldingPeriod: number;
  monthlyReturns: Array<{ month: string; pnl: number; trades: number }>;
  tickerPerformance: Array<{ ticker: string; pnl: number; trades: number; winRate: number }>;
}

export const usePerformanceMetrics = (
  trades: Trade[],
  tradingHistory: Trade[],
  selectedMarginRate: number
): PerformanceMetrics => {
  return useMemo(() => {
    const allTrades = [...trades, ...tradingHistory];
    const closedTrades = allTrades.filter(trade => trade.sellPrice);
    
    if (closedTrades.length === 0) {
      return {
        totalPnL: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgReturnPerTrade: 0,
        avgWinningTrade: 0,
        avgLosingTrade: 0,
        largestWin: 0,
        largestLoss: 0,
        totalInterest: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalDaysTrading: 0,
        avgHoldingPeriod: 0,
        monthlyReturns: [],
        tickerPerformance: [],
      };
    }

    // Calculate metrics for each trade
    const tradeMetrics = closedTrades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade, selectedMarginRate)
    }));

    // Basic calculations
    const totalPnL = tradeMetrics.reduce((sum, { metrics }) => sum + metrics.totalReturn, 0);
    const totalInterest = tradeMetrics.reduce((sum, { metrics }) => sum + metrics.interestCost, 0);
    const winningTrades = tradeMetrics.filter(({ metrics }) => metrics.totalReturn > 0);
    const losingTrades = tradeMetrics.filter(({ metrics }) => metrics.totalReturn < 0);
    
    const winRate = (winningTrades.length / closedTrades.length) * 100;
    const avgReturnPerTrade = totalPnL / closedTrades.length;
    
    const avgWinningTrade = winningTrades.length > 0 
      ? winningTrades.reduce((sum, { metrics }) => sum + metrics.totalReturn, 0) / winningTrades.length 
      : 0;
    
    const avgLosingTrade = losingTrades.length > 0 
      ? losingTrades.reduce((sum, { metrics }) => sum + metrics.totalReturn, 0) / losingTrades.length 
      : 0;

    const largestWin = Math.max(...tradeMetrics.map(({ metrics }) => metrics.totalReturn), 0);
    const largestLoss = Math.min(...tradeMetrics.map(({ metrics }) => metrics.totalReturn), 0);

    // Profit Factor (Gross Profit / Gross Loss)
    const grossProfit = winningTrades.reduce((sum, { metrics }) => sum + metrics.totalReturn, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, { metrics }) => sum + metrics.totalReturn, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Sharpe Ratio (simplified version)
    const returns = tradeMetrics.map(({ metrics }) => metrics.totalReturn);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Calculate cumulative returns for drawdown
    let cumulativePnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const { metrics } of tradeMetrics) {
      cumulativePnL += metrics.totalReturn;
      if (cumulativePnL > peak) {
        peak = cumulativePnL;
      }
      const drawdown = peak - cumulativePnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Time-based metrics
    const totalDaysTrading = tradeMetrics.reduce((sum, { metrics }) => sum + metrics.daysHeld, 0);
    const avgHoldingPeriod = totalDaysTrading / closedTrades.length;

    // Monthly returns
    const monthlyData = new Map<string, { pnl: number; trades: number }>();
    
    tradeMetrics.forEach(({ trade, metrics }) => {
      if (trade.sellDate) {
        const month = trade.sellDate.substring(0, 7); // YYYY-MM format
        const existing = monthlyData.get(month) || { pnl: 0, trades: 0 };
        monthlyData.set(month, {
          pnl: existing.pnl + metrics.totalReturn,
          trades: existing.trades + 1
        });
      }
    });

    const monthlyReturns = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Ticker performance
    const tickerData = new Map<string, { pnl: number; trades: number; wins: number }>();
    
    tradeMetrics.forEach(({ trade, metrics }) => {
      const existing = tickerData.get(trade.ticker) || { pnl: 0, trades: 0, wins: 0 };
      tickerData.set(trade.ticker, {
        pnl: existing.pnl + metrics.totalReturn,
        trades: existing.trades + 1,
        wins: existing.wins + (metrics.totalReturn > 0 ? 1 : 0)
      });
    });

    const tickerPerformance = Array.from(tickerData.entries())
      .map(([ticker, data]) => ({
        ticker,
        pnl: data.pnl,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100
      }))
      .sort((a, b) => b.pnl - a.pnl);

    return {
      totalPnL,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgReturnPerTrade,
      avgWinningTrade,
      avgLosingTrade,
      largestWin,
      largestLoss,
      totalInterest,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      totalDaysTrading,
      avgHoldingPeriod,
      monthlyReturns,
      tickerPerformance,
    };
  }, [trades, tradingHistory, selectedMarginRate]);
};


