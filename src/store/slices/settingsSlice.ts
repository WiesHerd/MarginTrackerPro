import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  fifo: boolean;
  defaultFeesPerTrade?: number;
  rounding: number;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  fifo: true,
  defaultFeesPerTrade: 0,
  rounding: 2,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setFIFO: (state, action: PayloadAction<boolean>) => {
      state.fifo = action.payload;
    },
    setDefaultFees: (state, action: PayloadAction<number | undefined>) => {
      state.defaultFeesPerTrade = action.payload;
    },
    setRounding: (state, action: PayloadAction<number>) => {
      state.rounding = Math.max(0, Math.min(10, action.payload));
    },
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      const { loading, error, ...settings } = action.payload;
      Object.assign(state, settings);
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
  setFIFO,
  setDefaultFees,
  setRounding,
  updateSettings,
  setLoading,
  setError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
