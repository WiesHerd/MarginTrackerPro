import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setShowRateTiersModal } from '../store/slices/uiSlice';
import { updateRateTiers, addRateTier, updateRateTier, deleteRateTier } from '../store/slices/brokerSlice';
import { RateTier } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

const RateTiersModal: React.FC = () => {
  const dispatch = useDispatch();
  const showRateTiersModal = useSelector((state: RootState) => state.ui.showRateTiersModal);
  const tiers = useSelector((state: RootState) => state.broker.settings.tiers);

  const [localTiers, setLocalTiers] = useState<RateTier[]>(tiers);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTierChange = (index: number, field: keyof RateTier, value: string | number) => {
    const newTiers = [...localTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setLocalTiers(newTiers);
    
    // Clear error when user starts typing
    if (errors[`${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`${index}_${field}`]: '' }));
    }
  };

  const handleAddTier = () => {
    const newTier: RateTier = {
      minBalance: 0,
      maxBalance: undefined,
      apr: 0.10,
    };
    setLocalTiers([...localTiers, newTier]);
  };

  const handleDeleteTier = (index: number) => {
    if (localTiers.length <= 1) {
      setErrors({ general: 'At least one rate tier is required' });
      return;
    }
    setLocalTiers(localTiers.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    try {
      dispatch(updateRateTiers(localTiers));
      dispatch(setShowRateTiersModal(false));
      setErrors({});
    } catch (error) {
      setErrors({ general: 'Failed to save rate tiers' });
    }
  };

  const handleClose = () => {
    dispatch(setShowRateTiersModal(false));
    setLocalTiers(tiers);
    setErrors({});
  };

  const formatAPR = (apr: number) => {
    return `${(apr * 100).toFixed(3)}%`;
  };

  if (!showRateTiersModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rate Tiers</h3>
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
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            {localTiers.map((tier, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Tier {index + 1}</h4>
                  {localTiers.length > 1 && (
                    <button
                      onClick={() => handleDeleteTier(index)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Delete tier ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Min Balance</label>
                    <input
                      type="number"
                      value={tier.minBalance}
                      onChange={(e) => handleTierChange(index, 'minBalance', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      step="0.01"
                      min="0"
                      aria-label={`Minimum balance for tier ${index + 1}`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Balance (optional)</label>
                    <input
                      type="number"
                      value={tier.maxBalance || ''}
                      onChange={(e) => handleTierChange(index, 'maxBalance', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="form-input"
                      step="0.01"
                      min="0"
                      aria-label={`Maximum balance for tier ${index + 1}`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">APR (%)</label>
                    <input
                      type="number"
                      value={tier.apr * 100}
                      onChange={(e) => handleTierChange(index, 'apr', (parseFloat(e.target.value) || 0) / 100)}
                      className="form-input"
                      step="0.001"
                      min="0"
                      max="100"
                      aria-label={`APR percentage for tier ${index + 1}`}
                    />
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <p>APR: {formatAPR(tier.apr)}</p>
                  <p>Range: ${tier.minBalance.toLocaleString()} - {tier.maxBalance ? `$${tier.maxBalance.toLocaleString()}` : 'No limit'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={handleAddTier}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Tier</span>
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Save Rate Tiers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateTiersModal;
