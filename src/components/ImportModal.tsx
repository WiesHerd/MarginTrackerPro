import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setShowImportModal } from '../store/slices/uiSlice';
import { setTrades } from '../store/slices/tradesSlice';
import { setLots } from '../store/slices/lotsSlice';
import { setEntries } from '../store/slices/ledgerSlice';
import { Trade, Lot, InterestLedgerEntry } from '../types';
import { validateTradeCSVRow, validateInterestLedgerCSVRow } from '../utils/validation';
import Papa from 'papaparse';
import { X, Upload, FileText } from 'lucide-react';

const ImportModal: React.FC = () => {
  const dispatch = useDispatch();
  const showImportModal = useSelector((state: RootState) => state.ui.showImportModal);

  const [importType, setImportType] = useState<'trades' | 'ledger'>('trades');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setSuccess('');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setSuccess('');

    try {
      const text = await file.text();
      
      if (importType === 'trades') {
        const result = Papa.parse<Trade>(text, {
          header: true,
          skipEmptyLines: true,
        });

        const validTrades: Trade[] = [];
        const validationErrors: string[] = [];

        result.data.forEach((row, index) => {
          try {
            const trade = {
              id: `trade_${Date.now()}_${index}`,
              date: row.date,
              ticker: row.ticker,
              side: row.side as 'BUY' | 'SELL' | 'SHORT' | 'COVER',
              qty: parseFloat(row.qty),
              price: parseFloat(row.price),
              fees: row.fees ? parseFloat(row.fees) : undefined,
              notes: row.notes,
            };

            validateTradeCSVRow(trade);
            validTrades.push(trade);
          } catch (error) {
            validationErrors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
          }
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
        } else {
          dispatch(setTrades(validTrades));
          setSuccess(`Successfully imported ${validTrades.length} trades`);
        }
      } else if (importType === 'ledger') {
        const result = Papa.parse<InterestLedgerEntry>(text, {
          header: true,
          skipEmptyLines: true,
        });

        const validEntries: InterestLedgerEntry[] = [];
        const validationErrors: string[] = [];

        result.data.forEach((row, index) => {
          try {
            const entry = {
              date: row.date,
              openingDebit: parseFloat(row.openingDebit),
              cashActivity: parseFloat(row.cashActivity),
              dailyInterest: parseFloat(row.dailyInterest),
              closingDebit: parseFloat(row.closingDebit),
              aprUsed: row.aprUsed ? parseFloat(row.aprUsed) : undefined,
            };

            validateInterestLedgerCSVRow(entry);
            validEntries.push(entry);
          } catch (error) {
            validationErrors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
          }
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
        } else {
          dispatch(setEntries(validEntries));
          setSuccess(`Successfully imported ${validEntries.length} ledger entries`);
        }
      }
    } catch (error) {
      setErrors([`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    dispatch(setShowImportModal(false));
    setFile(null);
    setErrors([]);
    setSuccess('');
  };

  if (!showImportModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
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
          {/* Import Type Selection */}
          <div className="mb-6">
            <label className="form-label">Import Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importType"
                  value="trades"
                  checked={importType === 'trades'}
                  onChange={(e) => setImportType(e.target.value as 'trades' | 'ledger')}
                  className="mr-2"
                />
                Trades (CSV)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importType"
                  value="ledger"
                  checked={importType === 'ledger'}
                  onChange={(e) => setImportType(e.target.value as 'trades' | 'ledger')}
                  className="mr-2"
                />
                Interest Ledger (CSV)
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="form-label">Select File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* CSV Format Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Expected CSV Format</h4>
            {importType === 'trades' ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Columns: date, ticker, side, qty, price, fees, notes</p>
                <p className="text-xs text-gray-500">
                  Example: 2024-01-15,AAPL,BUY,100,150.25,0.95,Bought AAPL shares
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">Columns: date, openingDebit, cashActivity, dailyInterest, closingDebit, aprUsed</p>
                <p className="text-xs text-gray-500">
                  Example: 2024-01-15,1000.00,-500.00,0.27,500.27,0.10
                </p>
              </div>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <h4 className="font-medium text-red-800 mb-2">Import Errors:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>{isProcessing ? 'Processing...' : 'Import'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
