import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Trade, BaseComponentProps, PortfolioMetrics } from '../types';
import { formatCurrency } from '../../../utils/formatting';
import { usePortfolioMetrics } from '../hooks/useTradeMetrics';

interface PortfolioSummaryProps extends BaseComponentProps {
  readonly trades: Trade[];
  readonly tradingHistory: Trade[];
  readonly selectedMarginRate: number;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = React.memo(({
  trades,
  tradingHistory,
  isDarkMode,
  selectedMarginRate
}) => {
  // Use optimized hook for portfolio calculations
  const portfolioMetrics = usePortfolioMetrics(trades, tradingHistory, selectedMarginRate);

  return (
    <div className={`mb-5 backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-800/50 border border-slate-700/50' 
        : 'bg-white/90 border border-gray-200/50'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className={`text-lg font-bold mb-1 transition-all duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Portfolio Dashboard</h2>
          <p className={`text-xs transition-all duration-300 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Real-time margin trading performance
            <span className="ml-2 text-blue-400">📈 Market Data</span>
          </p>
        </div>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Open P&L Card */}
        <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/20'
            : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
        }`}>
          <div className="relative">
            <div className={`text-lg font-bold transition-all duration-300 ${
              portfolioMetrics.openPnL >= 0 
                ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                : (isDarkMode ? 'text-red-400' : 'text-red-600')
            }`}>
              {portfolioMetrics.openPnL >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.openPnL)}
            </div>
            <div className={`text-xs mt-0.5 transition-all duration-300 ${
              isDarkMode ? 'text-emerald-300/80' : 'text-emerald-600'
            }`}>Open P&L</div>
          </div>
        </div>

        {/* Closed P&L Card */}
        <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/20'
            : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
        }`}>
          <div className="relative">
            <div className={`text-lg font-bold transition-all duration-300 ${
              portfolioMetrics.closedPnL >= 0 
                ? (isDarkMode ? 'text-purple-400' : 'text-purple-600')
                : (isDarkMode ? 'text-red-400' : 'text-red-600')
            }`}>
              {portfolioMetrics.closedPnL >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.closedPnL)}
            </div>
            <div className={`text-xs mt-0.5 transition-all duration-300 ${
              isDarkMode ? 'text-purple-300/80' : 'text-purple-600'
            }`}>Closed P&L</div>
          </div>
        </div>

        {/* Total P&L Card */}
        <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-600/30'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <div className="relative">
            <div className={`text-lg font-bold transition-all duration-300 ${
              portfolioMetrics.totalPnL >= 0 
                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                : (isDarkMode ? 'text-red-400' : 'text-red-600')
            }`}>
              {portfolioMetrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.totalPnL)}
            </div>
            <div className={`text-xs mt-0.5 transition-all duration-300 ${
              isDarkMode ? 'text-slate-300/80' : 'text-gray-600'
            }`}>Total P&L</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add display name for better debugging
PortfolioSummary.displayName = 'PortfolioSummary';

export default PortfolioSummary;
