import localforage from 'localforage';
import { AppState } from '@/types';

// Configure localforage
localforage.config({
  name: 'MarginCalculator',
  storeName: 'margin_calculator_data',
  description: 'Margin Cost Calculator data storage'
});

const STORAGE_KEYS = {
  APP_STATE: 'app_state',
  TRADES: 'trades',
  LOTS: 'lots',
  LEDGER: 'ledger',
  BROKER: 'broker',
  SETTINGS: 'settings',
  UI: 'ui'
} as const;

export class StorageService {
  // Save entire app state
  static async saveAppState(state: AppState): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEYS.APP_STATE, state);
    } catch (error) {
      console.error('Failed to save app state:', error);
      throw new Error('Failed to save app state');
    }
  }

  // Load entire app state
  static async loadAppState(): Promise<AppState | null> {
    try {
      return await localforage.getItem<AppState>(STORAGE_KEYS.APP_STATE);
    } catch (error) {
      console.error('Failed to load app state:', error);
      return null;
    }
  }

  // Save individual slices
  static async saveTrades(trades: any[]): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEYS.TRADES, trades);
    } catch (error) {
      console.error('Failed to save trades:', error);
      throw new Error('Failed to save trades');
    }
  }

  static async loadTrades(): Promise<any[] | null> {
    try {
      return await localforage.getItem<any[]>(STORAGE_KEYS.TRADES);
    } catch (error) {
      console.error('Failed to load trades:', error);
      return null;
    }
  }

  static async saveLots(lots: any[]): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEYS.LOTS, lots);
    } catch (error) {
      console.error('Failed to save lots:', error);
      throw new Error('Failed to save lots');
    }
  }

  static async loadLots(): Promise<any[] | null> {
    try {
      return await localforage.getItem<any[]>(STORAGE_KEYS.LOTS);
    } catch (error) {
      console.error('Failed to load lots:', error);
      return null;
    }
  }

  static async saveLedger(ledger: any[]): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEYS.LEDGER, ledger);
    } catch (error) {
      console.error('Failed to save ledger:', error);
      throw new Error('Failed to save ledger');
    }
  }

  static async loadLedger(): Promise<any[] | null> {
    try {
      return await localforage.getItem<any[]>(STORAGE_KEYS.LEDGER);
    } catch (error) {
      console.error('Failed to load ledger:', error);
      return null;
    }
  }

  static async saveBroker(broker: any): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEYS.BROKER, broker);
    } catch (error) {
      console.error('Failed to save broker:', error);
      throw new Error('Failed to save broker');
    }
  }

  static async loadBroker(): Promise<any | null> {
    try {
      return await localforage.getItem<any>(STORAGE_KEYS.BROKER);
    } catch (error) {
      console.error('Failed to load broker:', error);
      return null;
    }
  }

  static async saveSettings(settings: any): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEYS.SETTINGS, settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  static async loadSettings(): Promise<any | null> {
    try {
      return await localforage.getItem<any>(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    try {
      await localforage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  // Export data as JSON
  static async exportData(): Promise<string> {
    try {
      const data = {
        trades: await this.loadTrades() || [],
        lots: await this.loadLots() || [],
        ledger: await this.loadLedger() || [],
        broker: await this.loadBroker() || null,
        settings: await this.loadSettings() || null,
        exportDate: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Import data from JSON
  static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.trades) await this.saveTrades(data.trades);
      if (data.lots) await this.saveLots(data.lots);
      if (data.ledger) await this.saveLedger(data.ledger);
      if (data.broker) await this.saveBroker(data.broker);
      if (data.settings) await this.saveSettings(data.settings);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  }

  // Get storage usage info
  static async getStorageInfo(): Promise<{
    used: number;
    available: number;
    percentage: number;
  }> {
    try {
      const keys = await localforage.keys();
      let used = 0;
      
      for (const key of keys) {
        const item = await localforage.getItem(key);
        if (item) {
          used += JSON.stringify(item).length;
        }
      }
      
      // Estimate available space (this is approximate)
      const available = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}
