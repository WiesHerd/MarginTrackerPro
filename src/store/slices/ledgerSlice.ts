import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InterestLedgerEntry } from '@/types';
import { validateInterestLedgerCSVRow } from '@/utils/validation';

interface LedgerState {
  entries: InterestLedgerEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: LedgerState = {
  entries: [],
  loading: false,
  error: null,
};

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    addEntry: (state, action: PayloadAction<InterestLedgerEntry>) => {
      try {
        const validatedEntry = validateInterestLedgerCSVRow(action.payload);
        state.entries.push(validatedEntry);
        // Sort entries by date
        state.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid ledger entry data';
      }
    },
    updateEntry: (state, action: PayloadAction<{ date: string; entry: Partial<InterestLedgerEntry> }>) => {
      const { date, entry } = action.payload;
      const index = state.entries.findIndex(e => e.date === date);
      if (index !== -1) {
        try {
          const updatedEntry = { ...state.entries[index], ...entry };
          const validatedEntry = validateInterestLedgerCSVRow(updatedEntry);
          state.entries[index] = validatedEntry;
          state.error = null;
        } catch (error) {
          state.error = error instanceof Error ? error.message : 'Invalid ledger entry data';
        }
      }
    },
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(e => e.date !== action.payload);
    },
    setEntries: (state, action: PayloadAction<InterestLedgerEntry[]>) => {
      try {
        const validatedEntries = action.payload.map(validateInterestLedgerCSVRow);
        state.entries = validatedEntries;
        // Sort entries by date
        state.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        state.error = null;
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Invalid ledger entries data';
      }
    },
    clearEntries: (state) => {
      state.entries = [];
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
  addEntry,
  updateEntry,
  deleteEntry,
  setEntries,
  clearEntries,
  setLoading,
  setError,
} = ledgerSlice.actions;

export default ledgerSlice.reducer;
