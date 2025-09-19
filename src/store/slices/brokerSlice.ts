import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BrokerSettings, RateTier } from '@/types';
import { validateBrokerSettings } from '@/utils/validation';
import { getDefaultSchwabTiers } from '@/utils/rates';

const defaultBrokerSettings: BrokerSettings = {
  brokerName: 'Charles Schwab',
  baseRateName: 'Schwab Base Rate',
  tiers: getDefaultSchwabTiers(),
  dayCountBasis: 360,
  initialMarginPct: 0.50,
  maintenanceMarginPct: 0.30,
};

interface BrokerState {
  settings: BrokerSettings;
  loading: boolean;
  error: string | null;
}

const initialState: BrokerState = {
  settings: defaultBrokerSettings,
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
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid broker settings';
      }
    },
    updateRateTiers: (state, action: PayloadAction<RateTier[]>) => {
      try {
        const updatedSettings = { ...state.settings, tiers: action.payload };
        const validatedSettings = validateBrokerSettings(updatedSettings);
        state.settings = validatedSettings;
        state.error = null;
      } catch (error) {
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
