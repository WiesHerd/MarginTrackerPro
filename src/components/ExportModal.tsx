import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { setShowExportModal } from '../store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { StorageService } from '../utils/storage';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { X, Download, FileText, Database } from 'lucide-react';

const ExportModal: React.FC = () => {
  const dispatch = useDispatch();
  const showExportModal = useSelector((state: RootState) => state.ui.showExportModal);
  const trades = useSelector((state: RootState) => state.trades.trades);
  const lots = useSelector((state: RootState) => state.lots.lots);
  const ledger = useSelector((state: RootState) => state.ledger.entries);

  const [exportType, setExportType] = useState<'trades' | 'ledger' | 'all'>('trades');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let csvData = '';
      let filename = '';

      if (exportType === 'trades') {
        const csvData = Papa.unparse(trades, {
          header: true,
        });
        filename = `trades_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(csvData, filename);
      } else if (exportType === 'ledger') {
        const csvData = Papa.unparse(ledger, {
          header: true,
        });
        filename = `interest_ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(csvData, filename);
      } else if (exportType === 'all') {
        const jsonData = await StorageService.exportData();
        filename = `margin_calculator_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
        downloadJSON(jsonData, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadJSON = (jsonData: string, filename: string) => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    dispatch(setShowExportModal(false));
  };

  if (!showExportModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Export Type Selection */}
          <div className="mb-6">
            <label className="form-label">Export Type</label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="trades"
                  checked={exportType === 'trades'}
                  onChange={(e) => setExportType(e.target.value as 'trades' | 'ledger' | 'all')}
                  className="mr-3"
                />
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Trades (CSV)</p>
                    <p className="text-sm text-gray-600">{trades.length} trades</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="ledger"
                  checked={exportType === 'ledger'}
                  onChange={(e) => setExportType(e.target.value as 'trades' | 'ledger' | 'all')}
                  className="mr-3"
                />
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Interest Ledger (CSV)</p>
                    <p className="text-sm text-gray-600">{ledger.length} entries</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => setExportType(e.target.value as 'trades' | 'ledger' | 'all')}
                  className="mr-3"
                />
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Complete Backup (JSON)</p>
                    <p className="text-sm text-gray-600">All data including settings</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Export Details</h4>
            {exportType === 'trades' && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Exports all trades with columns:</p>
                <p className="text-xs text-gray-500 font-mono">
                  id, date, ticker, side, qty, price, fees, notes
                </p>
              </div>
            )}
            {exportType === 'ledger' && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Exports interest ledger with columns:</p>
                <p className="text-xs text-gray-500 font-mono">
                  date, openingDebit, cashActivity, dailyInterest, closingDebit, aprUsed
                </p>
              </div>
            )}
            {exportType === 'all' && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Exports complete application state:</p>
                <p className="text-xs text-gray-500">
                  Trades, lots, ledger, broker settings, app settings
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
