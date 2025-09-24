import React from 'react';
import { Clock } from 'lucide-react';

interface AutoRefreshControlsProps {
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  priceUpdateInterval: NodeJS.Timeout | null;
  lastRefreshTime: string;
  isDarkMode: boolean;
  onRefreshPrices: () => void;
}

const AutoRefreshControls: React.FC<AutoRefreshControlsProps> = ({
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  priceUpdateInterval,
  lastRefreshTime,
  isDarkMode,
  onRefreshPrices
}) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={onRefreshPrices}
        className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
          isDarkMode
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
        }`}
      >
        Refresh Prices
      </button>
      
      <button
        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${
          autoRefreshEnabled
            ? (isDarkMode 
                ? 'bg-emerald-700/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-300')
            : (isDarkMode 
                ? 'bg-slate-700/50 text-slate-400 border-slate-600' 
                : 'bg-gray-100 text-gray-600 border-gray-300')
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${
          autoRefreshEnabled ? 'bg-emerald-400' : 'bg-gray-400'
        }`}></div>
        Auto
      </button>
      
      <span className={`text-xs px-1.5 py-0.5 rounded border ${
        priceUpdateInterval
          ? (isDarkMode ? 'border-emerald-500/40 text-emerald-300' : 'border-emerald-300 text-emerald-600')
          : (isDarkMode ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-600')
      }`}>
        {priceUpdateInterval ? 'Live' : 'Paused'}
      </span>

      {lastRefreshTime && (
        <div className={`flex items-center gap-1 text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-gray-500'
        }`}>
          <Clock className="w-3 h-3" />
          <span>Last updated: {lastRefreshTime}</span>
        </div>
      )}
    </div>
  );
};

export default AutoRefreshControls;
