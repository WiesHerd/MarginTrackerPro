import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setShowLotsDrawer, setSelectedTicker } from '../store/slices/uiSlice';
import { getLotsForTicker } from '../utils/lots';
import { format } from 'date-fns';
import { X, Edit, Trash2 } from 'lucide-react';

const LotsDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const showLotsDrawer = useSelector((state: RootState) => state.ui.showLotsDrawer);
  const selectedTicker = useSelector((state: RootState) => state.ui.selectedTicker);
  const lots = useSelector((state: RootState) => state.lots.lots);

  const handleClose = () => {
    dispatch(setShowLotsDrawer(false));
    dispatch(setSelectedTicker(undefined));
  };

  const tickerLots = selectedTicker ? getLotsForTicker(selectedTicker, lots) : [];

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

  if (!showLotsDrawer || !selectedTicker) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Lots for {selectedTicker}
                </h3>
                <p className="text-sm text-gray-600">
                  {tickerLots.length} lot{tickerLots.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close drawer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {tickerLots.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500">No lots found for {selectedTicker}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {tickerLots.map((lot, index) => (
                  <div key={lot.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Lot {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          aria-label={`Edit lot ${index + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Delete lot ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Side:</span>
                        <span className={`text-sm font-medium ${lot.side === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                          {lot.side}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Open Date:</span>
                        <span className="text-sm text-gray-900">
                          {format(new Date(lot.openDate), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatNumber(lot.qtyOpen)} / {formatNumber(lot.qtyInit)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cost Basis:</span>
                        <span className="text-sm text-gray-900">
                          {formatCurrency(lot.costBasisPerShare)} per share
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Cost:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(lot.qtyOpen * lot.costBasisPerShare)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fees:</span>
                        <span className="text-sm text-gray-900">
                          {formatCurrency(lot.feesTotal)}
                        </span>
                      </div>

                      {lot.maintenanceMarginPct && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Maintenance %:</span>
                          <span className="text-sm text-gray-900">
                            {(lot.maintenanceMarginPct * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total Lots: {tickerLots.length}</span>
              <span>
                Total Qty: {formatNumber(tickerLots.reduce((sum, lot) => sum + lot.qtyOpen, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotsDrawer;
