import React, { useCallback } from 'react';
import { DollarSign } from 'lucide-react';
import { Trade, BrokerSettings, BaseComponentProps, TradeEventHandlers, TradeFormData } from '../types';
import { formatCurrency } from '../../../utils/formatting';
import { FORM_VALIDATION } from '../constants';

interface TradeFormProps extends BaseComponentProps {
  readonly selectedMarginRate: number;
  readonly brokerSettings: BrokerSettings;
  readonly ticker?: string;
  readonly onSelectedMarginRateChange: TradeEventHandlers['onSelectedMarginRateChange'];
  readonly onAddTrade: TradeEventHandlers['onAddTrade'];
  readonly onTickerChange?: TradeEventHandlers['onTickerChange'];
}

export const TradeForm: React.FC<TradeFormProps> = React.memo(({
  isDarkMode,
  selectedMarginRate,
  onSelectedMarginRateChange,
  brokerSettings,
  onAddTrade,
  ticker = '',
  onTickerChange
}) => {
  // Memoized function to avoid recreation on every render
  const getMarginRateLabel = useCallback((rate: number): string => {
    const marginRate = brokerSettings.marginRates.find(r => r.effectiveRate === rate);
    if (marginRate) {
      const formatToK = (amount: number) => {
        if (amount >= 1000) {
          return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount.toLocaleString()}`;
      };
      return `${formatToK(marginRate.minBalance)} - ${formatToK(marginRate.maxBalance)} (${rate.toFixed(3)}%)`;
    }
    return `${rate.toFixed(3)}%`;
  }, [brokerSettings.marginRates]);

  // Memoized submit handler with proper validation
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const rawData = {
      ticker: String(formData.get('ticker') || '').trim().toUpperCase(),
      buyPrice: Number(formData.get('buyPrice') || 0),
      buyDate: String(formData.get('buyDate') || new Date().toISOString().split('T')[0]),
      quantity: Number(formData.get('quantity') || 0),
      interestRate: selectedMarginRate,
    };

    // Basic validation
    if (!rawData.ticker || rawData.buyPrice <= 0 || rawData.quantity < FORM_VALIDATION.MIN_QUANTITY) {
      console.error('Invalid form data:', rawData);
      return;
    }

    const tradeData: TradeFormData = {
      ticker: rawData.ticker,
      buyPrice: rawData.buyPrice,
      buyDate: rawData.buyDate,
      quantity: rawData.quantity,
      interestRate: rawData.interestRate,
    };
    
    console.log('Saving trade with interest rate:', selectedMarginRate);
    onAddTrade(tradeData);
    (e.target as HTMLFormElement).reset();
    
    // Update ticker if callback provided
    onTickerChange?.(tradeData.ticker);
  }, [selectedMarginRate, onAddTrade, onTickerChange]);

  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-2xl p-5 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-800/50 border border-slate-700/50' 
        : 'bg-white/90 border border-gray-200/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <h2 className={`text-lg font-bold transition-all duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Trade Execution Terminal</h2>
        </div>
        <button 
          form="tradeForm" 
          type="submit" 
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Execute Trade
        </button>
      </div>

      <form id="tradeForm" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          {/* Ticker Symbol */}
          <div>
            <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Ticker Symbol</label>
            <input 
              type="text" 
              name="ticker" 
              defaultValue={ticker} 
              required 
              className={`w-full h-[42px] px-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-semibold ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-blue-500/30 focus:border-blue-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-400'
              }`} 
              placeholder="e.g., AAPL" 
            />
          </div>

          {/* Quantity */}
          <div>
            <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Quantity</label>
            <input 
              type="number" 
              name="quantity" 
              required 
              min={FORM_VALIDATION.MIN_QUANTITY}
              className={`w-full h-[42px] px-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-semibold ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-blue-500/30 focus:border-blue-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-400'
              }`} 
              placeholder="Number of shares" 
            />
          </div>

          {/* Buy Price */}
          <div>
            <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Buy Price</label>
            <input 
              type="number" 
              name="buyPrice" 
              required 
              step={FORM_VALIDATION.PRICE_STEP}
              min={FORM_VALIDATION.MIN_PRICE}
              className={`w-full h-[42px] px-3 border-2 rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-semibold ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-300 focus:ring-blue-500/30 focus:border-blue-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-400'
              }`} 
              placeholder="Price per share" 
            />
          </div>

          {/* Buy Date */}
          <div>
            <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Buy Date</label>
            <input 
              type="date" 
              name="buyDate" 
              required 
              defaultValue={new Date().toISOString().split('T')[0]} 
              className={`w-full h-[42px] px-3 border rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-medium ${
                isDarkMode 
                  ? 'bg-slate-700/80 border-slate-500/60 text-white focus:ring-purple-500/40 focus:border-purple-400/80'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/40 focus:border-purple-400'
              }`}
              aria-label="Buy date"
              title="Select the date when you bought the position"
            />
          </div>

          {/* Margin Rate */}
          <div>
            <label className={`block text-xs font-bold mb-2 transition-all duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Margin Rate</label>
            <select 
              value={selectedMarginRate} 
              onChange={(e) => onSelectedMarginRateChange(parseFloat(e.target.value))}
              className={`w-full h-[42px] px-3 border rounded-lg focus:ring-2 transition-all duration-200 shadow-sm text-sm font-medium ${
                isDarkMode 
                  ? 'bg-slate-700/80 border-slate-500/60 text-white focus:ring-purple-500/40 focus:border-purple-400/80'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/40 focus:border-purple-400'
              }`}
              title="Select margin rate based on account balance"
            >
              {brokerSettings.marginRates.map((rate, index) => (
                <option 
                  key={index} 
                  value={rate.effectiveRate} 
                  className={`${
                    isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  {getMarginRateLabel(rate.effectiveRate)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

// Add display name for better debugging
TradeForm.displayName = 'TradeForm';

export default TradeForm;
