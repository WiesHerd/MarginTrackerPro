import React from 'react';
import { AnalystRecommendation, AnalystEstimate, getRatingColor, getRatingBadgeColor } from '../utils/fmp';

interface AnalystRecommendationsProps {
  recommendations: AnalystRecommendation[];
  estimates: AnalystEstimate[];
  symbol: string;
  isDarkMode: boolean;
  loading?: boolean;
}

const AnalystRecommendations: React.FC<AnalystRecommendationsProps> = ({
  recommendations,
  estimates,
  symbol,
  isDarkMode,
  loading = false
}) => {
  if (loading) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analyst Recommendations
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Loading analyst data...
          </span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analyst Recommendations
          </h3>
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          No analyst recommendations available for {symbol}
        </div>
      </div>
    );
  }

  const latestRecommendation = recommendations[0];
  const latestEstimate = estimates[0];

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Analyst Recommendations
        </h3>
      </div>

      <div className="space-y-4">
        {/* Current Rating */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${getRatingColor(latestRecommendation.rating)}`}>
              {latestRecommendation.rating}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Rating Score: {latestRecommendation.ratingScore}/5
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingBadgeColor(latestRecommendation.rating)}`}>
            {latestRecommendation.ratingRecommendation}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              P/E Ratio
            </div>
            <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {latestRecommendation.ratingDetailsPriceEarningsRatio?.toFixed(2) || 'N/A'}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              ROE
            </div>
            <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {latestRecommendation.ratingDetailsReturnOnEquity?.toFixed(2) || 'N/A'}%
            </div>
          </div>
        </div>

        {/* Analyst Estimates */}
        {latestEstimate && (
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Revenue Estimate (Next Year)
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Low: ${latestEstimate.estimatedRevenueLow?.toLocaleString() || 'N/A'}
              </span>
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Avg: ${latestEstimate.estimatedRevenueAvg?.toLocaleString() || 'N/A'}
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                High: ${latestEstimate.estimatedRevenueHigh?.toLocaleString() || 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          <div className="flex items-center justify-between">
            <span>Dividend Yield: {latestRecommendation.ratingDetailsDividendYield?.toFixed(2) || 'N/A'}%</span>
            <span>Debt/Equity: {latestRecommendation.ratingDetailsDebtToEquity?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystRecommendations;
