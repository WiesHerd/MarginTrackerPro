import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketDataSectionProps {
  tickerMarketData: Record<string, any>;
  isDarkMode: boolean;
}

const MarketDataSection: React.FC<MarketDataSectionProps> = ({
  tickerMarketData,
  isDarkMode
}) => {
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

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-slate-800/50 border-slate-700' 
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Trading Positions
      </h3>
      
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
                %
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
            </tr>
          </thead>
          <tbody>
            {Object.entries(tickerMarketData).map(([ticker, data]) => (
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
                    {formatChange(data.change)}
                  </div>
                </td>
                <td className={`py-2 px-3 ${
                  data.changePercent >= 0 
                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                }`}>
                  {formatChangePercent(data.changePercent)}
                </td>
                <td className={`py-2 px-3 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  {formatVolume(data.volume)}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketDataSection;
