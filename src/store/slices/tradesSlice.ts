import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Trade } from '@/types';
import { validateTrade } from '@/utils/validation';

interface TradesState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
}

const initialState: TradesState = {
  trades: [],
  loading: false,
  error: null,
};

const tradesSlice = createSlice({
  name: 'trades',
  initialState,
  reducers: {
    addTrade: (state, action: PayloadAction<Trade>) => {
      try {
        const validatedTrade = validateTrade(action.payload);
        state.trades.push(validatedTrade);
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid trade data';
      }
    },
    updateTrade: (state, action: PayloadAction<{ id: string; trade: Partial<Trade> }>) => {
      const { id, trade } = action.payload;
      const index = state.trades.findIndex(t => t.id === id);
      if (index !== -1) {
        try {
          const updatedTrade = { ...state.trades[index], ...trade };
          const validatedTrade = validateTrade(updatedTrade);
          state.trades[index] = validatedTrade;
          state.error = null;
        } catch (error) {
          state.error = error instanceof Error ? error.message : 'Invalid trade data';
        }
      }
    },
    deleteTrade: (state, action: PayloadAction<string>) => {
      state.trades = state.trades.filter(t => t.id !== action.payload);
    },
    setTrades: (state, action: PayloadAction<Trade[]>) => {
      try {
        const validatedTrades = action.payload.map(validateTrade);
        state.trades = validatedTrades;
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid trades data';
      }
    },
    clearTrades: (state) => {
      state.trades = [];
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
  addTrade,
  updateTrade,
  deleteTrade,
  setTrades,
  clearTrades,
  setLoading,
  setError,
} = tradesSlice.actions;

export default tradesSlice.reducer;
