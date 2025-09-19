import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectHeaderData } from '../store/selectors';
import { setShowTradeModal, setShowSettingsModal, setShowImportModal, setShowExportModal } from '../store/slices/uiSlice';
import { Plus, Settings, Upload, Download, Calculator } from 'lucide-react';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { broker } = useSelector(selectHeaderData);
  
  // Mock values for now - these would come from calculations
  const totalEquity = 0;
  const totalDebit = 0;
  const availableBuyingPower = 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <Calculator className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Margin Cost Calculator</h1>
              <p className="text-sm text-gray-600">{broker?.brokerName || 'Margin Calculator'}</p>
            </div>
          </div>

          {/* Account Summary */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Equity</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalEquity)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Margin Debit</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(totalDebit)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Available BP</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(availableBuyingPower)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => dispatch(setShowTradeModal(true))}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Trade</span>
            </button>
            
            <button
              onClick={() => dispatch(setShowImportModal(true))}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            
            <button
              onClick={() => dispatch(setShowExportModal(true))}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={() => dispatch(setShowSettingsModal(true))}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
