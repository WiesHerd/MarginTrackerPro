import React from 'react';
import { Trade } from '../../trading/types';
import { calculateTradeMetrics } from '../../trading/utils/tradeCalculations';
import { formatCurrency } from '../../../utils/formatting';

interface TradingHistoryProps {
  tradingHistory: Trade[];
  isDarkMode: boolean;
  selectedMarginRate: number;
}

const TradingHistory: React.FC<TradingHistoryProps> = React.memo(({ tradingHistory, isDarkMode, selectedMarginRate }) => {
  if (tradingHistory.length === 0) {
    return (
      <div className={`flex items-center justify-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📈</div>
          <p className="text-lg font-medium">No completed trades yet</p>
          <p className="text-sm">Close a position to see it in your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b transition-all duration-300 ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Position</th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Action</th>
            <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Buy Price</th>
            <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Sell Price</th>
            <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Return</th>
            <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>% Change</th>
            <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Days</th>
            <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Interest</th>
            <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>P&L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tradingHistory.map((trade, idx) => {
            const metrics = calculateTradeMetrics(trade, selectedMarginRate);
            const isProfitable = metrics.totalReturn > 0;
            const percentageChange = (metrics.totalReturn / (trade.buyPrice * trade.quantity)) * 100;
            return (
              <tr key={`${trade.id}-hist-${idx}`} className={`transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className={`text-sm font-bold transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{trade.ticker}</div>
                    <div className={`text-xs transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{trade.quantity} shares</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    trade.action === 'PARTIAL_SELL'
                      ? (isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                      : (isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                  }`}>
                    {trade.action === 'PARTIAL_SELL' ? 'Partial Sell' : 'Sell'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(trade.buyPrice)}</div>
                  <div className={`text-xs transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{trade.buyDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{trade.sellPrice ? formatCurrency(trade.sellPrice) : '-'}</div>
                  <div className={`text-xs transition-all duration-300 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{trade.sellDate || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold transition-all duration-300 ${isProfitable ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>{isProfitable ? '+' : ''}{formatCurrency(metrics.totalReturn)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold transition-all duration-300 ${isProfitable ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>{isProfitable ? '+' : ''}{percentageChange.toFixed(2)}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className={`text-sm font-bold transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{metrics.daysHeld}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold transition-all duration-300 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formatCurrency(metrics.interestCost)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold transition-all duration-300 ${metrics.profitLoss >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>{formatCurrency(metrics.profitLoss)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

TradingHistory.displayName = 'TradingHistory';

export default TradingHistory;


