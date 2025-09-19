import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectModalStates, selectBroker, selectSettings } from '../store/selectors';
import { setShowSettingsModal } from '../store/slices/uiSlice';
import { updateSettings } from '../store/slices/brokerSlice';
import { setFIFO, setDefaultFees, setRounding } from '../store/slices/settingsSlice';
import { X, Save } from 'lucide-react';

const SettingsModal: React.FC = () => {
  const dispatch = useDispatch();
  const { showSettingsModal } = useSelector(selectModalStates);
  const broker = useSelector(selectBroker);
  const { fifo, defaultFeesPerTrade, rounding } = useSelector(selectSettings);

  const [formData, setFormData] = useState({
    brokerName: broker.brokerName,
    baseRateName: broker.baseRateName || '',
    dayCountBasis: broker.dayCountBasis,
    initialMarginPct: broker.initialMarginPct,
    maintenanceMarginPct: broker.maintenanceMarginPct,
    fifo,
    defaultFeesPerTrade: defaultFeesPerTrade || 0,
    rounding,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update broker settings
      dispatch(updateSettings({
        brokerName: formData.brokerName,
        baseRateName: formData.baseRateName || undefined,
        dayCountBasis: formData.dayCountBasis,
        initialMarginPct: formData.initialMarginPct,
        maintenanceMarginPct: formData.maintenanceMarginPct,
      }));

      // Update app settings
      dispatch(setFIFO(formData.fifo));
      dispatch(setDefaultFees(formData.defaultFeesPerTrade || undefined));
      dispatch(setRounding(formData.rounding));

      dispatch(setShowSettingsModal(false));
      setErrors({});
    } catch (error) {
      setErrors({ general: 'Failed to save settings' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(setShowSettingsModal(false));
    setErrors({});
  };

  if (!showSettingsModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
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

          <div className="space-y-6">
            {/* Broker Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Broker Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="brokerName" className="form-label">
                    Broker Name *
                  </label>
                  <input
                    type="text"
                    id="brokerName"
                    name="brokerName"
                    value={formData.brokerName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.brokerName ? 'border-red-300' : ''}`}
                    placeholder="Charles Schwab"
                    required
                  />
                  {errors.brokerName && <p className="form-error">{errors.brokerName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="baseRateName" className="form-label">
                    Base Rate Name
                  </label>
                  <input
                    type="text"
                    id="baseRateName"
                    name="baseRateName"
                    value={formData.baseRateName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.baseRateName ? 'border-red-300' : ''}`}
                    placeholder="Schwab Base Rate"
                  />
                  {errors.baseRateName && <p className="form-error">{errors.baseRateName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="dayCountBasis" className="form-label">
                    Day Count Basis *
                  </label>
                  <select
                    id="dayCountBasis"
                    name="dayCountBasis"
                    value={formData.dayCountBasis}
                    onChange={handleInputChange}
                    className={`form-select ${errors.dayCountBasis ? 'border-red-300' : ''}`}
                    required
                  >
                    <option value={360}>360 days</option>
                    <option value={365}>365 days</option>
                  </select>
                  {errors.dayCountBasis && <p className="form-error">{errors.dayCountBasis}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="initialMarginPct" className="form-label">
                    Initial Margin %
                  </label>
                  <input
                    type="number"
                    id="initialMarginPct"
                    name="initialMarginPct"
                    value={formData.initialMarginPct}
                    onChange={handleInputChange}
                    className={`form-input ${errors.initialMarginPct ? 'border-red-300' : ''}`}
                    step="0.01"
                    min="0"
                    max="1"
                    required
                  />
                  {errors.initialMarginPct && <p className="form-error">{errors.initialMarginPct}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="maintenanceMarginPct" className="form-label">
                    Maintenance Margin %
                  </label>
                  <input
                    type="number"
                    id="maintenanceMarginPct"
                    name="maintenanceMarginPct"
                    value={formData.maintenanceMarginPct}
                    onChange={handleInputChange}
                    className={`form-input ${errors.maintenanceMarginPct ? 'border-red-300' : ''}`}
                    step="0.01"
                    min="0"
                    max="1"
                    required
                  />
                  {errors.maintenanceMarginPct && <p className="form-error">{errors.maintenanceMarginPct}</p>}
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">App Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Lot Matching Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="fifo"
                        checked={formData.fifo}
                        onChange={() => setFormData(prev => ({ ...prev, fifo: true }))}
                        className="mr-2"
                      />
                      FIFO (First In, First Out)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="fifo"
                        checked={!formData.fifo}
                        onChange={() => setFormData(prev => ({ ...prev, fifo: false }))}
                        className="mr-2"
                      />
                      LIFO (Last In, First Out)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="defaultFeesPerTrade" className="form-label">
                    Default Fees per Trade
                  </label>
                  <input
                    type="number"
                    id="defaultFeesPerTrade"
                    name="defaultFeesPerTrade"
                    value={formData.defaultFeesPerTrade}
                    onChange={handleInputChange}
                    className={`form-input ${errors.defaultFeesPerTrade ? 'border-red-300' : ''}`}
                    step="0.01"
                    min="0"
                  />
                  {errors.defaultFeesPerTrade && <p className="form-error">{errors.defaultFeesPerTrade}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="rounding" className="form-label">
                    Decimal Places
                  </label>
                  <input
                    type="number"
                    id="rounding"
                    name="rounding"
                    value={formData.rounding}
                    onChange={handleInputChange}
                    className={`form-input ${errors.rounding ? 'border-red-300' : ''}`}
                    min="0"
                    max="10"
                    required
                  />
                  {errors.rounding && <p className="form-error">{errors.rounding}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
