import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '@/types';

const initialState: UIState = {
  selectedTicker: undefined,
  showLotsDrawer: false,
  showTradeModal: false,
  showSettingsModal: false,
  showRateTiersModal: false,
  showImportModal: false,
  showExportModal: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedTicker: (state, action: PayloadAction<string | undefined>) => {
      state.selectedTicker = action.payload;
    },
    setShowLotsDrawer: (state, action: PayloadAction<boolean>) => {
      state.showLotsDrawer = action.payload;
    },
    setShowTradeModal: (state, action: PayloadAction<boolean>) => {
      state.showTradeModal = action.payload;
    },
    setShowSettingsModal: (state, action: PayloadAction<boolean>) => {
      state.showSettingsModal = action.payload;
    },
    setShowRateTiersModal: (state, action: PayloadAction<boolean>) => {
      state.showRateTiersModal = action.payload;
    },
    setShowImportModal: (state, action: PayloadAction<boolean>) => {
      state.showImportModal = action.payload;
    },
    setShowExportModal: (state, action: PayloadAction<boolean>) => {
      state.showExportModal = action.payload;
    },
    closeAllModals: (state) => {
      state.showLotsDrawer = false;
      state.showTradeModal = false;
      state.showSettingsModal = false;
      state.showRateTiersModal = false;
      state.showImportModal = false;
      state.showExportModal = false;
    },
  },
});

export const {
  setSelectedTicker,
  setShowLotsDrawer,
  setShowTradeModal,
  setShowSettingsModal,
  setShowRateTiersModal,
  setShowImportModal,
  setShowExportModal,
  closeAllModals,
} = uiSlice.actions;

export default uiSlice.reducer;
