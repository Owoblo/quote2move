/**
 * State Persistence Service
 * Saves and restores application state to localStorage
 */

interface PersistedState {
  // Dashboard state
  address?: string;
  detections?: any[];
  estimate?: any;
  mapping?: any;
  
  // Estimate page state
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    moveDate: string;
  };
  originAddress?: string;
  destinationAddress?: string;
  leadSource?: string;
  moveTimeConfirmed?: string;
  priceOverride?: boolean;
  overrideAmount?: number | null;
  overrideReason?: string;
  customFollowUpDate?: string;
  upsells?: any[];
}

const STORAGE_KEY = 'movsense_app_state';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export class StatePersistence {
  static saveState(state: PersistedState): void {
    try {
      const data = {
        state,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  static loadState(): PersistedState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if data is expired
      if (Date.now() - data.timestamp > MAX_AGE) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data.state || null;
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      return null;
    }
  }

  static clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing state from localStorage:', error);
    }
  }

  static saveDashboardState(address: string, detections: any[], estimate: any, mapping: any): void {
    const current = this.loadState() || {};
    this.saveState({
      ...current,
      address,
      detections,
      estimate,
      mapping
    });
  }

  static saveEstimateState(data: {
    customerInfo?: PersistedState['customerInfo'];
    originAddress?: string;
    destinationAddress?: string;
    leadSource?: string;
    moveTimeConfirmed?: string;
    priceOverride?: boolean;
    overrideAmount?: number | null;
    overrideReason?: string;
    customFollowUpDate?: string;
    upsells?: any[];
  }): void {
    const current = this.loadState() || {};
    this.saveState({
      ...current,
      ...data
    });
  }
}

