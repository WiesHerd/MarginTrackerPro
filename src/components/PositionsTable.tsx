import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectLots, selectModalStates } from '../store/selectors';
import { setSelectedTicker, setShowLotsDrawer } from '../store/slices/uiSlice';
import { getPositionSummary } from '../utils/margin';
import { getLotsForTicker } from '../utils/lots';
import { Eye, TrendingUp, TrendingDown } from 'lucide-react';

const PositionsTable: React.FC = () => {
  const dispatch = useDispatch();
  const lots = useSelector(selectLots);
  const { selectedTicker } = useSelector(selectModalStates);

  // Get unique tickers from lots
  const tickers = useMemo(() => {
    const uniqueTickers = [...new Set(lots.map(lot => lot.ticker))];
    return uniqueTickers;
  }, [lots]);

  // Mock market prices (in a real app, this would come from a price feed)
  const mockPrices: Record<string, number> = {
    'AAPL': 150.25,
    'MSFT': 300.15,
    'GOOGL': 2500.75,
    'TSLA': 200.50,
    'NVDA': 400.80,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleViewLots = (ticker: string) => {
    dispatch(setSelectedTicker(ticker));
    dispatch(setShowLotsDrawer(true));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Positions</h2>
        <p className="text-sm text-gray-600">Current holdings and market values</p>
      </div>

      {/* Mobile-First Card Layout */}
      <div className="p-4 sm:p-6 space-y-4">
        {tickers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No positions found</p>
            <p className="text-sm text-gray-400 mt-1">Add a trade to get started</p>
          </div>
        ) : (
          tickers.map(ticker => {
            const tickerLots = getLotsForTicker(ticker, lots);
            const marketPrice = mockPrices[ticker] || 0;
            const summary = getPositionSummary(ticker, tickerLots, marketPrice);
            
            return (
              <div key={ticker} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                {/* Header Row - Ticker and P&L */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{ticker}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{ticker}</div>
                      <div className="text-sm text-gray-500">
                        {tickerLots.length} lot{tickerLots.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* P&L Display */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${summary.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.totalUnrealizedPnL)}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-sm">
                      {summary.totalUnrealizedPnL >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-gray-500">P&L</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Quantity</div>
                    <div className={`text-lg font-semibold ${summary.totalQty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(summary.totalQty)}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Market Price</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {marketPrice > 0 ? formatCurrency(marketPrice) : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Market Value</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {summary.totalMarketValue > 0 ? formatCurrency(summary.totalMarketValue) : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Maintenance</div>
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(summary.totalRequiredMargin)}
                    </div>
                  </div>
                </div>

                {/* Action Button - Mobile Optimized */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleViewLots(ticker)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
                  >
                    <Eye className="h-5 w-5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PositionsTable;
