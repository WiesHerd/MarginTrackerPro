import React from 'react';
import { Trade } from '../types';

interface TradingDashboardProps {
  trades: Trade[];
  tradingHistory: Trade[];
  calculateTradeMetrics: (trade: Trade) => any;
  isDarkMode: boolean;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({
  trades,
  tradingHistory,
  calculateTradeMetrics,
  isDarkMode
}) => {
  const openTrades = trades.filter(t => !t.sellPrice);
  const closedTrades = trades.filter(t => t.sellPrice);
  
  const totalOpenValue = openTrades.reduce((sum, trade) => {
    const metrics = calculateTradeMetrics(trade);
    return sum + (metrics.currentPrice * trade.quantity);
  }, 0);

  const totalClosedPnL = closedTrades.reduce((sum, trade) => {
    const metrics = calculateTradeMetrics(trade);
    return sum + metrics.totalReturn;
  }, 0);

  const totalOpenPnL = openTrades.reduce((sum, trade) => {
    const metrics = calculateTradeMetrics(trade);
    return sum + metrics.unrealizedPnL;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Open Positions */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-medium ${
            isDarkMode ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Open Positions
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${
            isDarkMode 
              ? 'bg-blue-900/30 text-blue-300' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {openTrades.length}
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          ${totalOpenValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className={`text-sm ${
          totalOpenPnL >= 0 
            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
            : (isDarkMode ? 'text-red-400' : 'text-red-600')
        }`}>
          {totalOpenPnL >= 0 ? '+' : ''}${totalOpenPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Closed Trades */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-medium ${
            isDarkMode ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Closed Trades
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${
            isDarkMode 
              ? 'bg-green-900/30 text-green-300' 
              : 'bg-green-100 text-green-700'
          }`}>
            {closedTrades.length}
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          ${totalClosedPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className={`text-sm ${
          totalClosedPnL >= 0 
            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
            : (isDarkMode ? 'text-red-400' : 'text-red-600')
        }`}>
          {totalClosedPnL >= 0 ? '+' : ''}${totalClosedPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Total Portfolio */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-medium ${
            isDarkMode ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Total Portfolio
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${
            isDarkMode 
              ? 'bg-purple-900/30 text-purple-300' 
              : 'bg-purple-100 text-purple-700'
          }`}>
            {trades.length + tradingHistory.length}
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          ${(totalOpenValue + totalClosedPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className={`text-sm ${
          (totalOpenPnL + totalClosedPnL) >= 0 
            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
            : (isDarkMode ? 'text-red-400' : 'text-red-600')
        }`}>
          {(totalOpenPnL + totalClosedPnL) >= 0 ? '+' : ''}${(totalOpenPnL + totalClosedPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
