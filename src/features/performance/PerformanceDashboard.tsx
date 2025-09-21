import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, BarChart3, Calculator } from 'lucide-react';
import { Trade, BaseComponentProps } from '../trading/types';
import { formatCurrency } from '../../utils/formatting';
// Remove analytics; show trading history instead
import TradingHistory from './components/TradingHistory';
import AllocationChart from './components/AllocationChart';
import PerformanceTable from './components/PerformanceTable';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

interface PerformanceDashboardProps extends BaseComponentProps {
  readonly trades: Trade[];
  readonly tradingHistory: Trade[];
  readonly selectedMarginRate: number;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = React.memo(({
  trades,
  tradingHistory,
  isDarkMode,
  selectedMarginRate
}) => {
  const performanceMetrics = usePerformanceMetrics(trades, tradingHistory, selectedMarginRate);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className={`backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/50 border border-slate-700/50' 
          : 'bg-white/90 border border-gray-200/50'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className={`text-lg font-bold transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Performance Dashboard</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total P&L */}
          <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/20'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 transition-all duration-300 ${
              isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/20'
            }`}></div>
            <div className="relative">
              <div className={`text-lg font-bold transition-all duration-300 ${
                performanceMetrics.totalPnL >= 0 
                  ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                  : (isDarkMode ? 'text-red-400' : 'text-red-600')
              }`}>
                {performanceMetrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(performanceMetrics.totalPnL)}
              </div>
              <div className={`text-xs mt-0.5 transition-all duration-300 ${
                isDarkMode ? 'text-emerald-300/80' : 'text-emerald-600'
              }`}>Total P&L</div>
              <div className="flex items-center mt-0.5">
                <div className={`w-1 h-1 rounded-full mr-1 transition-all duration-300 ${
                  performanceMetrics.totalPnL >= 0 
                    ? (isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500')
                    : (isDarkMode ? 'bg-red-400' : 'bg-red-500')
                }`}></div>
                <span className={`text-xs transition-all duration-300 ${
                  isDarkMode ? 'text-emerald-300/60' : 'text-emerald-600'
                }`}>Combined</span>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/20'
              : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 transition-all duration-300 ${
              isDarkMode ? 'bg-blue-500/10' : 'bg-blue-500/20'
            }`}></div>
            <div className="relative">
              <div className={`text-lg font-bold transition-all duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {performanceMetrics.winRate.toFixed(1)}%
              </div>
              <div className={`text-xs mt-0.5 transition-all duration-300 ${
                isDarkMode ? 'text-blue-300/80' : 'text-blue-600'
              }`}>Win Rate</div>
              <div className="flex items-center mt-0.5">
                <div className={`w-1 h-1 rounded-full mr-1 transition-all duration-300 ${
                  isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
                <span className={`text-xs transition-all duration-300 ${
                  isDarkMode ? 'text-blue-300/60' : 'text-blue-600'
                }`}>Success Rate</span>
              </div>
            </div>
          </div>

          {/* Total Interest Paid */}
          <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20'
              : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 transition-all duration-300 ${
              isDarkMode ? 'bg-red-500/10' : 'bg-red-500/20'
            }`}></div>
            <div className="relative">
              <div className={`text-lg font-bold transition-all duration-300 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {formatCurrency(performanceMetrics.totalInterest)}
              </div>
              <div className={`text-xs mt-0.5 transition-all duration-300 ${
                isDarkMode ? 'text-red-300/80' : 'text-red-600'
              }`}>Interest Paid</div>
              <div className="flex items-center mt-0.5">
                <div className={`w-1 h-1 rounded-full mr-1 transition-all duration-300 ${
                  isDarkMode ? 'bg-red-400' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs transition-all duration-300 ${
                  isDarkMode ? 'text-red-300/60' : 'text-red-600'
                }`}>Margin Cost</span>
              </div>
            </div>
          </div>

          {/* Active Positions */}
          <div className={`relative overflow-hidden rounded-lg border p-3 backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/20'
              : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 transition-all duration-300 ${
              isDarkMode ? 'bg-purple-500/10' : 'bg-purple-500/20'
            }`}></div>
            <div className="relative">
              <div className={`text-lg font-bold transition-all duration-300 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {trades.length}
              </div>
              <div className={`text-xs mt-0.5 transition-all duration-300 ${
                isDarkMode ? 'text-purple-300/80' : 'text-purple-600'
              }`}>Active Positions</div>
              <div className="flex items-center mt-0.5">
                <div className={`w-1 h-1 rounded-full mr-1 transition-all duration-300 ${
                  isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
                }`}></div>
                <span className={`text-xs transition-all duration-300 ${
                  isDarkMode ? 'text-purple-300/60' : 'text-purple-600'
                }`}>Open Trades</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading History moved here */}
      <div className={`backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/50 border border-slate-700/50' 
          : 'bg-white/90 border border-gray-200/50'
      }`}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h2 className={`text-lg font-bold transition-all duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Trading History</h2>
          <div className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
            isDarkMode 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {tradingHistory.length} completed
          </div>
        </div>
        <TradingHistory
          tradingHistory={tradingHistory}
          isDarkMode={isDarkMode}
          selectedMarginRate={selectedMarginRate}
        />
      </div>

      {/* Performance Table */}
      <div className={`backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/50 border border-slate-700/50' 
          : 'bg-white/90 border border-gray-200/50'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className={`text-lg font-bold transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Trade Performance</h2>
          </div>
        </div>
        
        <PerformanceTable
          trades={trades}
          tradingHistory={tradingHistory}
          isDarkMode={isDarkMode}
          selectedMarginRate={selectedMarginRate}
        />
      </div>
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;
