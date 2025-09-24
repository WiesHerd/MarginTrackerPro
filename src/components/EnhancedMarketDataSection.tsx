import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Zap } from 'lucide-react';
import { fetchEnhancedMarketData, formatMarketCap, formatPercentage } from '../utils/enhancedYahooData';
import { EnhancedMarketData } from '../utils/enhancedYahooData';

interface EnhancedMarketDataSectionProps {
  tickers: string[];
  isDarkMode: boolean;
  onDataUpdate?: (data: Record<string, EnhancedMarketData>) => void;
}

const EnhancedMarketDataSection: React.FC<EnhancedMarketDataSectionProps> = ({
  tickers,
  isDarkMode,
  onDataUpdate
}) => {
  const [marketData, setMarketData] = useState<Record<string, EnhancedMarketData>>({});
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchData = async () => {
    if (tickers.length === 0) return;
    
    setLoading(true);
    try {
      const data = await fetchEnhancedMarketData(tickers, true);
      setMarketData(data);
      onDataUpdate?.(data);
    } catch (error) {
      console.error('Error fetching enhanced market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tickers.join(',')]);

  const formatVolume = (vol: number | null | undefined) => {
    if (vol !== null && vol !== undefined && vol >= 0) {
      return vol === 0 ? '0' : `${(vol / 1000000).toFixed(1)}M`;
    }
    return '—';
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return '—';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (changePercent: number | null | undefined) => {
    if (changePercent === null || changePercent === undefined) return '—';
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Loading enhanced market data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-slate-800/50 border-slate-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Enhanced Market Data
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              showAdvanced
                ? (isDarkMode 
                    ? 'bg-blue-700/20 text-blue-300 border-blue-500/40' 
                    : 'bg-blue-50 text-blue-600 border-blue-300')
                : (isDarkMode 
                    ? 'bg-slate-700/50 text-slate-400 border-slate-600' 
                    : 'bg-gray-100 text-gray-600 border-gray-300')
            }`}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          <button
            onClick={fetchData}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <th className={`text-left py-2 px-3 text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Symbol
              </th>
              <th className={`text-left py-2 px-3 text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Price
              </th>
              <th className={`text-left py-2 px-3 text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Change
              </th>
              <th className={`text-left py-2 px-3 text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Volume
              </th>
              <th className={`text-left py-2 px-3 text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Status
              </th>
              {showAdvanced && (
                <>
                  <th className={`text-left py-2 px-3 text-sm font-medium ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Market Cap
                  </th>
                  <th className={`text-left py-2 px-3 text-sm font-medium ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    52W High
                  </th>
                  <th className={`text-left py-2 px-3 text-sm font-medium ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    52W Low
                  </th>
                  <th className={`text-left py-2 px-3 text-sm font-medium ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Bid/Ask
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {Object.entries(marketData).map(([ticker, data]) => (
              <tr key={ticker} className={`border-b ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <td className={`py-2 px-3 font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {ticker}
                </td>
                <td className={`py-2 px-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatPrice(data.price)}
                </td>
                <td className={`py-2 px-3 ${
                  data.change >= 0 
                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                }`}>
                  <div className="flex items-center">
                    {data.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <div>
                      <div>{formatChange(data.change)}</div>
                      <div className="text-xs">{formatChangePercent(data.changePercent)}</div>
                    </div>
                  </div>
                </td>
                <td className={`py-2 px-3 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  <div>{formatVolume(data.volume)}</div>
                  {data.volumeVsAverage && (
                    <div className="text-xs flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      {formatPercentage(data.volumeVsAverage, 0)} vs avg
                    </div>
                  )}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      data.isMarketOpen 
                        ? 'bg-green-400' 
                        : 'bg-red-400'
                    }`}></div>
                    <span className={`text-sm ${
                      data.isMarketOpen 
                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                        : (isDarkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {data.isMarketOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </td>
                {showAdvanced && (
                  <>
                    <td className={`py-2 px-3 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      {formatMarketCap(data.marketCap)}
                    </td>
                    <td className={`py-2 px-3 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      {formatPrice(data.fiftyTwoWeekHigh)}
                    </td>
                    <td className={`py-2 px-3 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      {formatPrice(data.fiftyTwoWeekLow)}
                    </td>
                    <td className={`py-2 px-3 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      <div className="text-xs">
                        <div>B: {formatPrice(data.bid)}</div>
                        <div>A: {formatPrice(data.ask)}</div>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedMarketDataSection;
