import React from 'react';
import { Trade } from '../../trading/types';
import { useMultipleTradeMetrics } from '../../trading/hooks/useTradeMetrics';
import { formatCurrency } from '../../../utils/formatting';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface PerformanceTableProps {
  trades: Trade[];
  tradingHistory: Trade[];
  isDarkMode: boolean;
  selectedMarginRate: number;
}

const PerformanceTable: React.FC<PerformanceTableProps> = React.memo(({
  trades,
  tradingHistory,
  isDarkMode,
  selectedMarginRate
}) => {
  const allTrades = [...trades, ...tradingHistory];
  const tradeMetrics = useMultipleTradeMetrics(allTrades, selectedMarginRate);

  return (
    <div>

      {/* Table */}
      <div className="overflow-x-auto">
        {tradeMetrics.length > 0 ? (
          <table className="w-full">
            <thead className={`border-b transition-all duration-300 ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Ticker
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Entry
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Exit
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  P&L
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  ROI %
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Interest
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Days
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Size
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-all duration-300 ${
              isDarkMode ? 'divide-slate-700' : 'divide-gray-200'
            }`}>
              {tradeMetrics.map(({ trade, metrics }, idx) => {
                const isOpen = !trade.sellPrice;
                const isProfitable = metrics.totalReturn >= 0;
                const roi = (metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100;

                return (
                  <tr key={`${trade.id}-row-${idx}`} className={`transition-all duration-200 hover:bg-opacity-50 ${
                    isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50/50'
                  }`}>
                    {/* Ticker */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isProfitable 
                            ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                            : (isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>
                          {trade.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div className={`text-sm font-medium transition-all duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {trade.ticker}
                          </div>
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {trade.quantity} shares
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isOpen 
                            ? (isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800')
                            : (isDarkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800')
                        }`}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                        {isProfitable ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>

                    {/* Entry */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatCurrency(trade.buyPrice)}
                      </div>
                      <div className={`text-xs transition-all duration-300 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        {trade.buyDate}
                      </div>
                    </td>

                    {/* Exit */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {trade.sellPrice ? (
                        <div>
                          <div className={`text-sm font-medium transition-all duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {formatCurrency(trade.sellPrice)}
                          </div>
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {trade.sellDate}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className={`text-sm font-medium transition-all duration-300 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {formatCurrency(metrics.currentPrice)}
                          </div>
                          <div className={`text-xs transition-all duration-300 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            Current
                          </div>
                        </div>
                      )}
                    </td>

                    {/* P&L */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold transition-all duration-300 ${
                        isProfitable 
                          ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                          : (isDarkMode ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {isProfitable ? '+' : ''}{formatCurrency(metrics.totalReturn)}
                      </div>
                    </td>

                    {/* ROI */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold transition-all duration-300 ${
                        roi >= 0 
                          ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                          : (isDarkMode ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                      </div>
                    </td>

                    {/* Interest */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium transition-all duration-300 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {formatCurrency(metrics.interestCost)}
                      </div>
                    </td>

                    {/* Days */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-medium transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {metrics.daysHeld}
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatCurrency(trade.buyPrice * trade.quantity)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={`flex items-center justify-center py-16 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg font-medium">No trade data available</p>
              <p className="text-sm">Execute trades to see detailed performance analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PerformanceTable.displayName = 'PerformanceTable';

export default PerformanceTable;
