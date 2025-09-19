import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Basic selectors
export const selectTrades = (state: RootState) => state.trades.trades;
export const selectLots = (state: RootState) => state.lots.lots;
export const selectLedger = (state: RootState) => state.ledger.entries;
export const selectBroker = (state: RootState) => state.broker.settings;
export const selectSettings = (state: RootState) => state.settings;
export const selectUI = (state: RootState) => state.ui;

// Memoized selectors
export const selectAccountSummary = createSelector(
  [selectLots, selectLedger, selectBroker],
  (lots, ledger, broker) => ({
    lots,
    ledger,
    broker
  })
);

export const selectPositionsData = createSelector(
  [selectLots],
  (lots) => ({
    lots
  })
);

export const selectHeaderData = createSelector(
  [selectBroker],
  (broker) => ({
    broker
  })
);

export const selectModalStates = createSelector(
  [selectUI],
  (ui) => ({
    showTradeModal: ui.showTradeModal,
    showSettingsModal: ui.showSettingsModal,
    showRateTiersModal: ui.showRateTiersModal,
    showImportModal: ui.showImportModal,
    showExportModal: ui.showExportModal,
    showLotsDrawer: ui.showLotsDrawer,
    selectedTicker: ui.selectedTicker
  })
);
