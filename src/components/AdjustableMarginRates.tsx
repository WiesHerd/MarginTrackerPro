import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateRateTier, addRateTier, deleteRateTier, updateRateTiers } from '../store/slices/brokerSlice';
import { ChevronDown, ChevronUp, Edit3, Trash2, Plus } from 'lucide-react';

interface AdjustableMarginRatesProps {
  isDarkMode: boolean;
  className?: string;
}

const AdjustableMarginRates: React.FC<AdjustableMarginRatesProps> = ({ 
  isDarkMode, 
  className = '' 
}) => {
  const dispatch = useDispatch();
  const { tiers } = useSelector((state: RootState) => state.broker.settings);
  const [localTiers, setLocalTiers] = useState(tiers);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Initialize local state with Redux state only once
  useEffect(() => {
    console.log('Component mounted, initial tiers:', tiers);
    setLocalTiers(tiers);
  }, []); // Only run on mount

  // Don't sync with Redux state changes - let user control when to save

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return `${amount.toLocaleString()}`;
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    const updatedTiers = [...localTiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setLocalTiers(updatedTiers);
  };

  const handleSave = (index: number) => {
    const tier = localTiers[index];
    const newErrors: { [key: string]: string } = {};

    if (tier.minBalance < 0) {
      newErrors.minBalance = 'Minimum balance must be positive';
    }
    if (tier.maxBalance && tier.maxBalance <= tier.minBalance) {
      newErrors.maxBalance = 'Maximum balance must be greater than minimum';
    }
    if (tier.apr < 0 || tier.apr > 1) {
      newErrors.apr = 'APR must be between 0% and 100%';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    dispatch(updateRateTier({ index, tier }));
    setEditingIndex(null);
    
    // Visual feedback that changes are applied and saved
    console.log('Rate updated, saved to localStorage, and will sync across all app components');
  };

  const handleCancel = (index: number) => {
    setLocalTiers(tiers);
    setEditingIndex(null);
    setErrors({});
  };

  const handleDelete = (index: number) => {
    if (tiers.length > 1) {
      dispatch(deleteRateTier(index));
    }
  };

  const handleAddNew = () => {
    const newTier = {
      minBalance: 0,
      maxBalance: undefined,
      apr: 0.1
    };
    console.log('Adding new tier:', newTier);
    
    // Update local state immediately
    const updatedTiers = [...localTiers, newTier];
    setLocalTiers(updatedTiers);
    
    // Dispatch to Redux
    dispatch(addRateTier(newTier));
    
    // Set editing index to the newly added tier (last index)
    setEditingIndex(updatedTiers.length - 1);
    console.log('Set editing index to:', updatedTiers.length - 1);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Add Rate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Rate</span>
        </button>
      </div>

      {/* Rate Tiers */}
      <div className="space-y-1">
        {localTiers.map((tier, index) => {
          const isEditing = editingIndex === index;
          const effectiveRate = parseFloat((tier.apr * 100).toFixed(3));

          return (
            <div
              key={index}
              className={`border rounded-lg p-2 transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/80' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
                      {isEditing ? (
                        // Edit Mode
                        <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 -m-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className={`block text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Minimum Balance
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={tier.minBalance}
                                  onChange={(e) => handleTierChange(index, 'minBalance', parseFloat(e.target.value) || 0)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    isDarkMode 
                                      ? 'bg-slate-700 border-slate-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="0"
                                  min="0"
                                  step="1000"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  {tier.minBalance >= 1000000 ? 'M' : 'K'}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className={`block text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Maximum Balance
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={tier.maxBalance || ''}
                                  onChange={(e) => handleTierChange(index, 'maxBalance', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    isDarkMode 
                                      ? 'bg-slate-700 border-slate-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="No limit"
                                  min="0"
                                  step="1000"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  {tier.maxBalance && tier.maxBalance >= 1000000 ? 'M' : 'K'}
                                </div>
                              </div>
                            </div>
                          </div>
                  
                  <div className="space-y-1">
                    <label className={`block text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      APR
                    </label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={parseFloat((tier.apr * 100).toFixed(3))}
                        onChange={(e) => handleTierChange(index, 'apr', (parseFloat(e.target.value) || 0) / 100)}
                        className={`w-full px-2 py-1 pr-6 text-sm border rounded ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        step="0.001"
                        min="0"
                        max="100"
                        placeholder="0.000"
                        title="Enter APR percentage"
                        aria-label="APR percentage"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">%</span>
                    </div>
                  </div>

                   <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                     <button
                       onClick={() => handleCancel(index)}
                       className={`px-4 py-2 text-sm rounded transition-colors touch-manipulation ${
                         isDarkMode 
                           ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                           : 'bg-gray-500 hover:bg-gray-600 text-white'
                       }`}
                     >
                       Cancel
                     </button>
                    <button
                      onClick={() => handleSave(index)}
                      className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors touch-manipulation"
                    >
                      Save
                    </button>
                   </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onDoubleClick={() => handleEdit(index)}
                    title="Double-click to edit"
                  >
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(tier.minBalance)} - {tier.maxBalance ? formatCurrency(tier.maxBalance) : 'No limit'}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      APR: {effectiveRate.toFixed(3)}%
                    </div>
                  </div>
                  
                   <div className="flex items-center space-x-1 sm:space-x-2">
                     <button
                       onClick={() => {
                         const newApr = Math.max(0, tier.apr - 0.0001);
                         console.log('Decreasing APR from', (tier.apr * 100).toFixed(3), 'to', (newApr * 100).toFixed(3));
                         handleTierChange(index, 'apr', newApr);
                         // Don't auto-save, let user use "Save All Changes" button
                       }}
                       className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${
                         isDarkMode 
                           ? 'hover:bg-slate-700 text-slate-400' 
                           : 'hover:bg-gray-200 text-gray-500'
                       }`}
                       aria-label="Decrease rate by 0.01%"
                     >
                       <ChevronDown className="h-4 w-4 sm:h-3 sm:w-3" />
                     </button>
                     
                     <div className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs font-mono min-w-[60px] text-center">
                       {effectiveRate.toFixed(3)}%
                     </div>
                     
                     <button
                       onClick={() => {
                         const newApr = Math.min(1, tier.apr + 0.0001);
                         console.log('Increasing APR from', (tier.apr * 100).toFixed(3), 'to', (newApr * 100).toFixed(3));
                         handleTierChange(index, 'apr', newApr);
                         // Don't auto-save, let user use "Save All Changes" button
                       }}
                       className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${
                         isDarkMode 
                           ? 'hover:bg-slate-700 text-slate-400' 
                           : 'hover:bg-gray-200 text-gray-500'
                       }`}
                       aria-label="Increase rate by 0.01%"
                     >
                       <ChevronUp className="h-4 w-4 sm:h-3 sm:w-3" />
                     </button>
                     
                     <button
                       onClick={() => handleEdit(index)}
                       className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${
                         isDarkMode 
                           ? 'hover:bg-slate-700 text-slate-400' 
                           : 'hover:bg-gray-200 text-gray-500'
                       }`}
                       aria-label="Edit tier"
                     >
                       <Edit3 className="h-4 w-4 sm:h-3 sm:w-3" />
                     </button>
                     
                     {tiers.length > 1 && (
                       <button
                         onClick={() => handleDelete(index)}
                         className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${
                           isDarkMode 
                             ? 'hover:bg-red-900/20 text-red-400' 
                             : 'hover:bg-red-50 text-red-500'
                         }`}
                         aria-label="Delete tier"
                       >
                         <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                       </button>
                     )}
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => {
            // Save all local changes to Redux store (which automatically saves to localStorage)
            dispatch(updateRateTiers(localTiers));
            setSaveStatus('Saved!');
            console.log('All rates saved to localStorage:', localTiers);
            
            // Clear status after 2 seconds
            setTimeout(() => setSaveStatus(''), 2000);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saveStatus || 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdjustableMarginRates;