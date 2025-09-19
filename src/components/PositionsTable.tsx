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
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Positions</h2>
        <p className="text-sm text-gray-600">Current holdings and market values</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Ticker</th>
              <th className="table-cell text-right">Quantity</th>
              <th className="table-cell text-right">Market Price</th>
              <th className="table-cell text-right">Market Value</th>
              <th className="table-cell text-right">Unrealized P&L</th>
              <th className="table-cell text-right">Maintenance Req</th>
              <th className="table-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickers.map(ticker => {
              const tickerLots = getLotsForTicker(ticker, lots);
              const marketPrice = mockPrices[ticker] || 0;
              const summary = getPositionSummary(ticker, tickerLots, marketPrice);
              
              return (
                <tr key={ticker} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{ticker}</div>
                    <div className="text-sm text-gray-500">
                      {tickerLots.length} lot{tickerLots.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <span className={`font-medium ${summary.totalQty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(summary.totalQty)}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    {marketPrice > 0 ? formatCurrency(marketPrice) : 'N/A'}
                  </td>
                  <td className="table-cell text-right">
                    {summary.totalMarketValue > 0 ? formatCurrency(summary.totalMarketValue) : 'N/A'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {summary.totalUnrealizedPnL >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${summary.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.totalUnrealizedPnL)}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-gray-600">
                      {formatCurrency(summary.totalRequiredMargin)}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <button
                      onClick={() => handleViewLots(ticker)}
                      className="btn btn-sm btn-secondary flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Lots</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tickers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No positions found</p>
            <p className="text-sm text-gray-400 mt-1">Add a trade to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionsTable;
