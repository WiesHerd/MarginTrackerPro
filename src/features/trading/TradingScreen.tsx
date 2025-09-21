import React, { useState } from 'react';
import { DollarSign, TrendingUp, BarChart3, Calculator, Trash2, TrendingDown } from 'lucide-react';
import { Trade, BrokerSettings, TradeEventHandlers, BaseComponentProps, SellFormData } from './types';
import { formatCurrency } from '../../utils/formatting';
import PortfolioSummary from './components/PortfolioSummary';
import TradeForm from './components/TradeForm';

interface TradingScreenProps extends BaseComponentProps, TradeEventHandlers {
  readonly trades: Trade[];
  readonly tradingHistory: Trade[];
  readonly selectedMarginRate: number;
  readonly brokerSettings: BrokerSettings;
  readonly ticker?: string;
}

export const TradingScreen: React.FC<TradingScreenProps> = React.memo(({
  trades,
  tradingHistory,
  isDarkMode,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  selectedMarginRate,
  onSelectedMarginRateChange,
  brokerSettings,
  ticker,
  onTickerChange
}) => {
  // Local state for trading screen
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [sellForm, setSellForm] = useState<SellFormData>({
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      {trades.length > 0 && (
        <PortfolioSummary
          trades={trades}
          tradingHistory={tradingHistory}
          isDarkMode={isDarkMode}
          selectedMarginRate={selectedMarginRate}
        />
      )}

      {/* Trade Form */}
      <TradeForm
        isDarkMode={isDarkMode}
        selectedMarginRate={selectedMarginRate}
        onSelectedMarginRateChange={onSelectedMarginRateChange}
        brokerSettings={brokerSettings}
        onAddTrade={onAddTrade}
        ticker={ticker}
        onTickerChange={onTickerChange}
      />

      {/* Trading Positions Table */}
      <div className={`backdrop-blur-sm rounded-2xl shadow-2xl mt-8 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/50 border border-slate-700/50' 
          : 'bg-white/90 border border-gray-200/50'
      }`}>
        {/* Add Trading Positions Table Here */}
      </div>

      {/* Trading History moved to Performance screen */}

      {/* Modals */}
      {/* Add Delete Confirmation Modal */}
      {/* Add Trade Details Modal */}
    </div>
  );
});

// Add display name for better debugging
TradingScreen.displayName = 'TradingScreen';

export default TradingScreen;
