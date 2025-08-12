import { encryptedStorage } from './encryptedStorage';
import { Case, CapturedImage } from '../types';

/**
 * Auto-save service for form data with encrypted local storage
 */
export interface AutoSaveData {
  caseId: string;
  formType: string;
  formData: any;
  images: CapturedImage[];
  lastSaved: string;
  version: number;
  isComplete: boolean;
  metadata: {
    userAgent: string;
    timestamp: string;
    formVersion: string;
  };
}

export interface AutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  enableCompression?: boolean;
}

class AutoSaveService {
  private readonly AUTOSAVE_PREFIX = 'autosave_';
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_AUTOSAVE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CURRENT_VERSION = 1;
  
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private saveQueue: Map<string, AutoSaveData> = new Map();
  private isProcessing = false;
  private listeners: Map<string, ((data: AutoSaveData | null) => void)[]> = new Map();

  constructor() {
    this.startCleanupInterval();
    this.handleVisibilityChange();
    this.handleBeforeUnload();
  }

  /**
   * Save form data with auto-save
   */
  async saveFormData(
    caseId: string,
    formType: string,
    formData: any,
    images: CapturedImage[] = [],
    options: AutoSaveOptions = {}
  ): Promise<void> {
    const { debounceMs = 1000 } = options;
    const key = this.getAutoSaveKeyInternal(caseId, formType);

    // Create auto-save data
    const autoSaveData: AutoSaveData = {
      caseId,
      formType,
      formData: this.sanitizeFormData(formData),
      images,
      lastSaved: new Date().toISOString(),
      version: this.CURRENT_VERSION,
      isComplete: false,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        formVersion: '1.0.0'
      }
    };

    // Add to save queue
    this.saveQueue.set(key, autoSaveData);

    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      await this.processSaveQueue(key);
      this.debounceTimers.delete(key);
    }, debounceMs);

    this.debounceTimers.set(key, timer);

    // Notify listeners
    this.notifyListeners(key, autoSaveData);
  }

  /**
   * Process the save queue
   */
  private async processSaveQueue(key: string): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      const data = this.saveQueue.get(key);
      if (data) {
        await encryptedStorage.setItem(key, data);
        this.saveQueue.delete(key);
        console.log(`Auto-saved form data for ${data.caseId} (${data.formType})`);
      }
    } catch (error) {
      console.error('Error processing save queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retrieve saved form data
   */
  async getFormData(caseId: string, formType: string): Promise<AutoSaveData | null> {
    try {
      const key = this.getAutoSaveKeyInternal(caseId, formType);
      const data = await encryptedStorage.getItem<AutoSaveData>(key);
      
      if (data && this.isValidAutoSaveData(data)) {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving auto-save data:', error);
      return null;
    }
  }

  /**
   * Check if auto-saved data exists for a form
   */
  async hasAutoSaveData(caseId: string, formType: string): Promise<boolean> {
    try {
      const data = await this.getFormData(caseId, formType);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark form as completed and clean up auto-save data
   */
  async markFormCompleted(caseId: string, formType: string): Promise<void> {
    try {
      const key = this.getAutoSaveKeyInternal(caseId, formType);
      const data = await this.getFormData(caseId, formType);
      
      if (data) {
        data.isComplete = true;
        data.lastSaved = new Date().toISOString();
        await encryptedStorage.setItem(key, data);
      }
      
      // Schedule cleanup after a delay
      setTimeout(() => {
        this.removeAutoSaveData(caseId, formType);
      }, 5000); // 5 seconds delay
      
    } catch (error) {
      console.error('Error marking form as completed:', error);
    }
  }

  /**
   * Remove auto-save data
   */
  async removeAutoSaveData(caseId: string, formType: string): Promise<void> {
    try {
      const key = this.getAutoSaveKeyInternal(caseId, formType);
      await encryptedStorage.removeItem(key);
      
      // Clear any pending saves
      this.saveQueue.delete(key);
      const timer = this.debounceTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
      
      // Notify listeners
      this.notifyListeners(key, null);
      
      console.log(`Removed auto-save data for ${caseId} (${formType})`);
    } catch (error) {
      console.error('Error removing auto-save data:', error);
    }
  }

  /**
   * Get all auto-saved forms
   */
  async getAllAutoSavedForms(): Promise<AutoSaveData[]> {
    try {
      const keys = await encryptedStorage.getAllKeys();
      const autoSaveKeys = keys.filter(key => key.startsWith(this.AUTOSAVE_PREFIX));
      
      const autoSaveData: AutoSaveData[] = [];
      
      for (const key of autoSaveKeys) {
        const data = await encryptedStorage.getItem<AutoSaveData>(key);
        if (data && this.isValidAutoSaveData(data) && !data.isComplete) {
          autoSaveData.push(data);
        }
      }
      
      // Sort by last saved (most recent first)
      return autoSaveData.sort((a, b) => 
        new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
      );
    } catch (error) {
      console.error('Error getting all auto-saved forms:', error);
      return [];
    }
  }

  /**
   * Force save all pending data
   */
  async forceSaveAll(): Promise<void> {
    try {
      // Clear all debounce timers and process immediately
      for (const [key, timer] of this.debounceTimers.entries()) {
        clearTimeout(timer);
        await this.processSaveQueue(key);
      }
      this.debounceTimers.clear();
    } catch (error) {
      console.error('Error force saving all data:', error);
    }
  }

  /**
   * Clean up old auto-save data
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await encryptedStorage.getAllKeys();
      const autoSaveKeys = keys.filter(key => key.startsWith(this.AUTOSAVE_PREFIX));
      const now = Date.now();
      
      for (const key of autoSaveKeys) {
        const data = await encryptedStorage.getItem<AutoSaveData>(key);
        if (data) {
          const lastSavedTime = new Date(data.lastSaved).getTime();
          const age = now - lastSavedTime;
          
          // Remove old or completed auto-save data
          if (age > this.MAX_AUTOSAVE_AGE || data.isComplete) {
            await encryptedStorage.removeItem(key);
            console.log(`Cleaned up old auto-save data: ${key}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Add listener for auto-save events
   */
  addListener(key: string, callback: (data: AutoSaveData | null) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(key: string, callback: (data: AutoSaveData | null) => void): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get auto-save key for external use
   */
  getAutoSaveKey(caseId: string, formType: string): string {
    return this.getAutoSaveKeyInternal(caseId, formType);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalAutoSaves: number;
    totalSize: string;
    oldestSave: string | null;
    newestSave: string | null;
  }> {
    try {
      const autoSaves = await this.getAllAutoSavedForms();
      const storageInfo = await encryptedStorage.getStorageInfo();
      
      const timestamps = autoSaves.map(save => new Date(save.lastSaved).getTime());
      
      return {
        totalAutoSaves: autoSaves.length,
        totalSize: storageInfo.estimatedSize,
        oldestSave: timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null,
        newestSave: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalAutoSaves: 0,
        totalSize: '0 KB',
        oldestSave: null,
        newestSave: null
      };
    }
  }

  // Private helper methods
  private getAutoSaveKeyInternal(caseId: string, formType: string): string {
    return `${this.AUTOSAVE_PREFIX}${caseId}_${formType}`;
  }

  private sanitizeFormData(formData: any): any {
    // Remove any functions or non-serializable data
    return JSON.parse(JSON.stringify(formData));
  }

  private isValidAutoSaveData(data: any): data is AutoSaveData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.caseId === 'string' &&
      typeof data.formType === 'string' &&
      typeof data.lastSaved === 'string' &&
      typeof data.version === 'number' &&
      Array.isArray(data.images)
    );
  }

  private notifyListeners(key: string, data: AutoSaveData | null): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in auto-save listener:', error);
        }
      });
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private handleVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is being hidden, force save all pending data
        this.forceSaveAll();
      }
    });
  }

  private handleBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      // Force save all pending data before page unload
      this.forceSaveAll();
    });
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();
