import React, { useMemo } from 'react';
import { Trade } from '../../trading/types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';
import { calculateTradeMetrics } from '../../trading/utils/tradeCalculations';

interface TradePerformanceSummaryProps {
  trades: Trade[];
  tradingHistory: Trade[];
  isDarkMode: boolean;
  selectedMarginRate: number;
}

const TradePerformanceSummary: React.FC<TradePerformanceSummaryProps> = React.memo(({
  trades,
  tradingHistory,
  isDarkMode,
  selectedMarginRate
}) => {
  const { bestTrades, worstTrades, highestInterestTrades } = useMemo(() => {
    // Include BOTH open and closed trades for comprehensive analysis
    const allTrades = [...trades, ...tradingHistory];
    
    if (allTrades.length === 0) {
      return { bestTrades: [], worstTrades: [], highestInterestTrades: [] };
    }

    // Calculate metrics for all trades (open and closed)
    const tradesWithMetrics = allTrades.map(trade => ({
      trade,
      metrics: calculateTradeMetrics(trade, trade.interestRate || selectedMarginRate)
    }));

    // Get best and worst performing trades (by total return)
    const sortedByPnL = [...tradesWithMetrics].sort((a, b) => b.metrics.totalReturn - a.metrics.totalReturn);
    const bestTrades = sortedByPnL.slice(0, 3);
    const worstTrades = sortedByPnL.slice(-3).reverse();

    // Get trades with highest interest costs
    const sortedByInterest = [...tradesWithMetrics].sort((a, b) => b.metrics.interestCost - a.metrics.interestCost);
    const highestInterestTrades = sortedByInterest.slice(0, 3);

    return { bestTrades, worstTrades, highestInterestTrades };
  }, [trades, tradingHistory, selectedMarginRate]);

  return (
    <div className="space-y-6">
        {bestTrades.length > 0 ? (
          <>
            {/* Minimalistic Performance Summary */}
            <div className="space-y-4">
              {/* Best Trades - Sleek Minimal Design */}
              <div>
                <div className={`text-xs font-medium mb-3 transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>BEST PERFORMERS</div>
                <div className="space-y-2">
                          {bestTrades.map(({ trade, metrics }, index) => (
                            <div key={`${trade.id}-best-${index}`} className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:bg-opacity-50 ${
                      isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className={`text-sm font-medium transition-all duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{trade.ticker}</div>
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {metrics.daysHeld}d • {formatCurrency(metrics.positionValue)} • {trade.sellPrice ? 'Closed' : 'Open'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold transition-all duration-300 ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          +{formatCurrency(metrics.totalReturn)}
                        </div>
                        <div className={`text-xs transition-all duration-300 ${
                          isDarkMode ? 'text-emerald-300/70' : 'text-emerald-500/70'
                        }`}>
                          {((metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worst Trades - Sleek Minimal Design */}
              <div>
                <div className={`text-xs font-medium mb-3 transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>WORST PERFORMERS</div>
                <div className="space-y-2">
                          {worstTrades.map(({ trade, metrics }, index) => (
                            <div key={`${trade.id}-worst-${index}`} className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:bg-opacity-50 ${
                      isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className={`text-sm font-medium transition-all duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{trade.ticker}</div>
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {metrics.daysHeld}d • {formatCurrency(metrics.positionValue)} • {trade.sellPrice ? 'Closed' : 'Open'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold transition-all duration-300 ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {formatCurrency(metrics.totalReturn)}
                        </div>
                        <div className={`text-xs transition-all duration-300 ${
                          isDarkMode ? 'text-red-300/70' : 'text-red-500/70'
                        }`}>
                          {((metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highest Interest - Sleek Minimal Design */}
              <div>
                <div className={`text-xs font-medium mb-3 transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>HIGHEST INTEREST COSTS</div>
                <div className="space-y-2">
                          {highestInterestTrades.map(({ trade, metrics }, index) => (
                            <div key={`${trade.id}-int-${index}`} className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:bg-opacity-50 ${
                      isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className={`text-sm font-medium transition-all duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{trade.ticker}</div>
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {metrics.daysHeld}d • {formatCurrency(metrics.positionValue)} • {metrics.marginRate.toFixed(2)}% rate
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold transition-all duration-300 ${
                          isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`}>
                          {formatCurrency(metrics.interestCost)}
                        </div>
                        <div className={`text-xs transition-all duration-300 ${
                          isDarkMode ? 'text-yellow-300/70' : 'text-yellow-500/70'
                        }`}>
                          {metrics.marginRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex items-center justify-center py-8 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            <div className={`text-center p-6 rounded-2xl shadow-lg ${
              isDarkMode 
                ? 'bg-slate-800/50 border border-slate-700/50' 
                : 'bg-white/90 border border-gray-200/50'
            }`}>
              {/* Professional Analytics Icon */}
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-emerald-500/20 border border-emerald-500/30' 
                  : 'bg-emerald-50 border border-emerald-200'
              }`}>
                <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              
              <h3 className={`text-base font-semibold mb-1 transition-all duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>No Performance Data</h3>
              <p className={`text-xs transition-all duration-300 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>Add some trades to see performance analysis</p>
            </div>
          </div>
        )}
    </div>
  );
});

TradePerformanceSummary.displayName = 'TradePerformanceSummary';

export default TradePerformanceSummary;
