import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Lot } from '@/types';
import { validateLot } from '@/utils/validation';

interface LotsState {
  lots: Lot[];
  loading: boolean;
  error: string | null;
}

const initialState: LotsState = {
  lots: [],
  loading: false,
  error: null,
};

const lotsSlice = createSlice({
  name: 'lots',
  initialState,
  reducers: {
    addLot: (state, action: PayloadAction<Lot>) => {
      try {
        const validatedLot = validateLot(action.payload);
        state.lots.push(validatedLot);
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid lot data';
      }
    },
    updateLot: (state, action: PayloadAction<{ id: string; lot: Partial<Lot> }>) => {
      const { id, lot } = action.payload;
      const index = state.lots.findIndex(l => l.id === id);
      if (index !== -1) {
        try {
          const updatedLot = { ...state.lots[index], ...lot };
          const validatedLot = validateLot(updatedLot);
          state.lots[index] = validatedLot;
          state.error = null;
        } catch (error) {
          state.error = error instanceof Error ? error.message : 'Invalid lot data';
        }
      }
    },
    deleteLot: (state, action: PayloadAction<string>) => {
      state.lots = state.lots.filter(l => l.id !== action.payload);
    },
    setLots: (state, action: PayloadAction<Lot[]>) => {
      try {
        const validatedLots = action.payload.map(validateLot);
        state.lots = validatedLots;
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid lots data';
      }
    },
    clearLots: (state) => {
      state.lots = [];
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
  addLot,
  updateLot,
  deleteLot,
  setLots,
  clearLots,
  setLoading,
  setError,
} = lotsSlice.actions;

export default lotsSlice.reducer;
