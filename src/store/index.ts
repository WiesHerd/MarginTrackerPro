import { configureStore } from '@reduxjs/toolkit';
import tradesSlice from './slices/tradesSlice';
import lotsSlice from './slices/lotsSlice';
import ledgerSlice from './slices/ledgerSlice';
import brokerSlice from './slices/brokerSlice';
import uiSlice from './slices/uiSlice';
import settingsSlice from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    trades: tradesSlice,
    lots: lotsSlice,
    ledger: ledgerSlice,
    broker: brokerSlice,
    ui: uiSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
