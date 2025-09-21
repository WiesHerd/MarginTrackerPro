import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BrokerSettings, RateTier } from '@/types';
import { validateBrokerSettings } from '@/utils/validation';
import { getDefaultSchwabTiers } from '@/utils/rates';

// Load settings from localStorage or use defaults
const loadBrokerSettings = (): BrokerSettings => {
  try {
    const saved = localStorage.getItem('brokerSettings');
    console.log('Loading from localStorage:', saved);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Parsed settings:', parsed);
      // Validate the loaded settings
      try {
        const validated = validateBrokerSettings(parsed);
        console.log('Validation successful:', validated);
        return validated;
      } catch (validationError) {
        console.error('Validation failed:', validationError);
        console.log('Falling back to default settings');
        return defaultBrokerSettings;
      }
    }
  } catch (error) {
    console.warn('Failed to load broker settings from localStorage:', error);
  }
  console.log('Using default settings');
  return defaultBrokerSettings;
};

// Save settings to localStorage
const saveBrokerSettings = (settings: BrokerSettings) => {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem('brokerSettings', serialized);
    console.log('Saved to localStorage:', serialized);
  } catch (error) {
    console.warn('Failed to save broker settings to localStorage:', error);
  }
};

const defaultBrokerSettings: BrokerSettings = {
  brokerName: 'Charles Schwab',
  baseRateName: 'Schwab Base Rate',
  tiers: getDefaultSchwabTiers(),
  dayCountBasis: 360 as 360 | 365,
  initialMarginPct: 0.50,
  maintenanceMarginPct: 0.30,
};

interface BrokerState {
  settings: BrokerSettings;
  loading: boolean;
  error: string | null;
}

const initialState: BrokerState = {
  settings: loadBrokerSettings(),
  loading: false,
  error: null,
};

const brokerSlice = createSlice({
  name: 'broker',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<BrokerSettings>>) => {
      try {
        const updatedSettings = { ...state.settings, ...action.payload };
        const validatedSettings = validateBrokerSettings(updatedSettings);
        state.settings = validatedSettings;
        state.error = null;
        // Save to localStorage
        saveBrokerSettings(validatedSettings);
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid broker settings';
      }
    },
    updateRateTiers: (state, action: PayloadAction<RateTier[]>) => {
      try {
        console.log('updateRateTiers called with:', action.payload);
        const updatedSettings = { ...state.settings, tiers: action.payload };
        console.log('Updated settings:', updatedSettings);
        const validatedSettings = validateBrokerSettings(updatedSettings);
        console.log('Validation successful:', validatedSettings);
        state.settings = validatedSettings;
        state.error = null;
        // Save to localStorage
        saveBrokerSettings(validatedSettings);
      } catch (error) {
        console.error('updateRateTiers validation failed:', error);
        state.error = error instanceof Error ? error.message : 'Invalid rate tiers';
      }
    },
    addRateTier: (state, action: PayloadAction<RateTier>) => {
      try {
        const newTiers = [...state.settings.tiers, action.payload];
        const updatedSettings = { ...state.settings, tiers: newTiers };
        const validatedSettings = validateBrokerSettings(updatedSettings);
        state.settings = validatedSettings;
        state.error = null;
        // Save to localStorage
        saveBrokerSettings(validatedSettings);
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid rate tier';
      }
    },
    updateRateTier: (state, action: PayloadAction<{ index: number; tier: RateTier }>) => {
      try {
        const { index, tier } = action.payload;
        const newTiers = [...state.settings.tiers];
        newTiers[index] = tier;
        const updatedSettings = { ...state.settings, tiers: newTiers };
        const validatedSettings = validateBrokerSettings(updatedSettings);
        state.settings = validatedSettings;
        state.error = null;
        // Save to localStorage
        saveBrokerSettings(validatedSettings);
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid rate tier';
      }
    },
    deleteRateTier: (state, action: PayloadAction<number>) => {
      try {
        const newTiers = state.settings.tiers.filter((_, index) => index !== action.payload);
        if (newTiers.length === 0) {
          state.error = 'At least one rate tier is required';
          return;
        }
        const updatedSettings = { ...state.settings, tiers: newTiers };
        const validatedSettings = validateBrokerSettings(updatedSettings);
        state.settings = validatedSettings;
        state.error = null;
        // Save to localStorage
        saveBrokerSettings(validatedSettings);
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Cannot delete last rate tier';
      }
    },
    setSettings: (state, action: PayloadAction<BrokerSettings>) => {
      try {
        const validatedSettings = validateBrokerSettings(action.payload);
        state.settings = validatedSettings;
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid broker settings';
      }
    },
    resetToDefaults: (state) => {
      state.settings = defaultBrokerSettings;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  updateSettings,
  updateRateTiers,
  addRateTier,
  updateRateTier,
  deleteRateTier,
  setSettings,
  resetToDefaults,
  setLoading,
  setError,
} = brokerSlice.actions;

export default brokerSlice.reducer;
