import { Trade } from '../types';
import { TRADING_CONSTANTS } from '../constants';

export interface TradeMetrics {
  daysHeld: number;
  interestCost: number;
  profitLoss: number;
  totalReturn: number;
  marginRate: number;
  currentPrice: number;
  positionValue: number;
  marginUsed: number;
  marginUtilization: number;
  priceChangePercent: number;
  dailyReturn: number;
  annualizedReturn: number;
}

/**
 * Calculate comprehensive metrics for a trade position
 * Memoized for performance when used with React.useMemo
 */
export const calculateTradeMetrics = (
  trade: Trade, 
  selectedMarginRate: number
): TradeMetrics => {
  // Calculate days held
  const sellDate = trade.sellDate ? new Date(trade.sellDate) : new Date();
  const buyDate = new Date(trade.buyDate);
  const daysHeld = Math.ceil(
    (sellDate.getTime() - buyDate.getTime()) / TRADING_CONSTANTS.MILLISECONDS_PER_DAY
  );

  // Use trade's individual interest rate or fallback to selected rate
  const marginRate = trade.interestRate || selectedMarginRate;
  
  // Calculate interest cost
  const principal = trade.buyPrice * trade.quantity;
  const dailyRate = marginRate / TRADING_CONSTANTS.PERCENTAGE_MULTIPLIER / TRADING_CONSTANTS.DAYS_PER_YEAR;
  const interestCost = principal * dailyRate * daysHeld;

  // Determine current price (priority: sellPrice > currentPrice > buyPrice)
  const currentPrice = trade.sellPrice || trade.currentPrice || trade.buyPrice;
  
  // Calculate profit/loss
  const profitLoss = (currentPrice - trade.buyPrice) * trade.quantity;
  const totalReturn = profitLoss - interestCost;

  // Enhanced risk metrics
  const positionValue = currentPrice * trade.quantity;
  const marginUsed = trade.buyPrice * trade.quantity;
  const marginUtilization = (marginUsed / (positionValue || 1)) * TRADING_CONSTANTS.PERCENTAGE_MULTIPLIER;
  const priceChangePercent = ((currentPrice - trade.buyPrice) / trade.buyPrice) * TRADING_CONSTANTS.PERCENTAGE_MULTIPLIER;

  // Performance metrics
  const dailyReturn = totalReturn / daysHeld;
  const annualizedReturn = (dailyReturn * TRADING_CONSTANTS.DAYS_PER_YEAR) / marginUsed * TRADING_CONSTANTS.PERCENTAGE_MULTIPLIER;

  return {
    daysHeld,
    interestCost,
    profitLoss,
    totalReturn,
    marginRate,
    currentPrice,
    positionValue,
    marginUsed,
    marginUtilization,
    priceChangePercent,
    dailyReturn,
    annualizedReturn,
  };
};

/**
 * Calculate portfolio-level aggregated metrics
 * Optimized to avoid multiple iterations over trade arrays
 */
export const calculatePortfolioMetrics = (
  trades: Trade[],
  tradingHistory: Trade[],
  selectedMarginRate: number
) => {
  const openTrades = trades.filter(t => !t.sellPrice);
  const closedTrades = trades.filter(t => t.sellPrice);

  // Single pass through open trades for efficiency
  const openTradesMetrics = openTrades.reduce(
    (acc, trade) => {
      const metrics = calculateTradeMetrics(trade, selectedMarginRate);
      return {
        totalValue: acc.totalValue + metrics.positionValue,
        totalCost: acc.totalCost + (trade.buyPrice * trade.quantity),
        totalPnL: acc.totalPnL + metrics.totalReturn,
      };
    },
    { totalValue: 0, totalCost: 0, totalPnL: 0 }
  );

  // Single pass through closed trades
  const closedTradesMetrics = closedTrades.reduce(
    (acc, trade) => {
      const metrics = calculateTradeMetrics(trade, selectedMarginRate);
      return {
        totalPnL: acc.totalPnL + metrics.totalReturn,
        totalInterest: acc.totalInterest + metrics.interestCost,
      };
    },
    { totalPnL: 0, totalInterest: 0 }
  );

  const totalOpenPnL = openTradesMetrics.totalValue - openTradesMetrics.totalCost;

  return {
    openPnL: totalOpenPnL,
    closedPnL: closedTradesMetrics.totalPnL,
    totalPnL: totalOpenPnL + closedTradesMetrics.totalPnL,
    totalInterest: closedTradesMetrics.totalInterest,
    openPositions: openTrades.length,
    closedPositions: closedTrades.length,
  };
};



