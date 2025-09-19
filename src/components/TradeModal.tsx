import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectModalStates, selectSettings } from '../store/selectors';
import { setShowTradeModal } from '../store/slices/uiSlice';
import { addTrade } from '../store/slices/tradesSlice';
import { validateTradeForm } from '../utils/validation';
import { format } from 'date-fns';
import { X, Plus } from 'lucide-react';

const TradeModal: React.FC = () => {
  const dispatch = useDispatch();
  const { showTradeModal } = useSelector(selectModalStates);
  const { defaultFeesPerTrade } = useSelector(selectSettings);

  const [formData, setFormData] = useState({
    ticker: '',
    side: 'BUY' as 'BUY' | 'SELL' | 'SHORT' | 'COVER',
    qty: '',
    price: '',
    fees: defaultFeesPerTrade?.toString() || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tradeData = {
        ...formData,
        qty: parseFloat(formData.qty),
        price: parseFloat(formData.price),
        fees: formData.fees ? parseFloat(formData.fees) : undefined,
      };

      const validatedData = validateTradeForm(tradeData);
      
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...validatedData,
      };

      dispatch(addTrade(trade));
      dispatch(setShowTradeModal(false));
      
      // Reset form
      setFormData({
        ticker: '',
        side: 'BUY',
        qty: '',
        price: '',
        fees: defaultFeesPerTrade?.toString() || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
      setErrors({});
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'Invalid trade data' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(setShowTradeModal(false));
    setErrors({});
  };

  if (!showTradeModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add Trade</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ticker */}
            <div className="form-group">
              <label htmlFor="ticker" className="form-label">
                Ticker *
              </label>
              <input
                type="text"
                id="ticker"
                name="ticker"
                value={formData.ticker}
                onChange={handleInputChange}
                className={`form-input ${errors.ticker ? 'border-red-300' : ''}`}
                placeholder="AAPL"
                required
              />
              {errors.ticker && <p className="form-error">{errors.ticker}</p>}
            </div>

            {/* Side */}
            <div className="form-group">
              <label htmlFor="side" className="form-label">
                Side *
              </label>
              <select
                id="side"
                name="side"
                value={formData.side}
                onChange={handleInputChange}
                className={`form-select ${errors.side ? 'border-red-300' : ''}`}
                required
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="SHORT">Short</option>
                <option value="COVER">Cover</option>
              </select>
              {errors.side && <p className="form-error">{errors.side}</p>}
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label htmlFor="qty" className="form-label">
                Quantity *
              </label>
              <input
                type="number"
                id="qty"
                name="qty"
                value={formData.qty}
                onChange={handleInputChange}
                className={`form-input ${errors.qty ? 'border-red-300' : ''}`}
                placeholder="100"
                step="0.01"
                min="0"
                required
              />
              {errors.qty && <p className="form-error">{errors.qty}</p>}
            </div>

            {/* Price */}
            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`form-input ${errors.price ? 'border-red-300' : ''}`}
                placeholder="150.25"
                step="0.01"
                min="0"
                required
              />
              {errors.price && <p className="form-error">{errors.price}</p>}
            </div>

            {/* Fees */}
            <div className="form-group">
              <label htmlFor="fees" className="form-label">
                Fees
              </label>
              <input
                type="number"
                id="fees"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                className={`form-input ${errors.fees ? 'border-red-300' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.fees && <p className="form-error">{errors.fees}</p>}
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`form-input ${errors.date ? 'border-red-300' : ''}`}
                required
              />
              {errors.date && <p className="form-error">{errors.date}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className={`form-input ${errors.notes ? 'border-red-300' : ''}`}
              rows={3}
              placeholder="Optional notes about this trade"
            />
            {errors.notes && <p className="form-error">{errors.notes}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Trade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
