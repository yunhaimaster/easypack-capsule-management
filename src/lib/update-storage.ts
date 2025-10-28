/**
 * Update Storage Module - localStorage Abstraction with Fallback
 * 
 * Provides safe localStorage access with automatic fallback to in-memory storage
 * for browsers in privacy mode or with localStorage disabled.
 * 
 * This is a black-box module: external code doesn't need to know whether we're
 * using localStorage or memory storage - the interface is the same.
 */

interface StorageInterface {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * In-memory storage fallback for when localStorage is unavailable
 * Data is lost on page refresh, but prevents crashes in privacy mode
 */
class MemoryStorage implements StorageInterface {
  private store = new Map<string, string>()
  
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
  
  removeItem(key: string): void {
    this.store.delete(key)
  }
}

/**
 * Detect if localStorage is available and functional
 * 
 * Returns false in:
 * - Private/incognito browsing mode
 * - Browsers with storage disabled
 * - Quota exceeded scenarios
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Singleton storage instance - automatically selects best available option
const storage: StorageInterface = typeof window !== 'undefined' && isLocalStorageAvailable()
  ? localStorage
  : new MemoryStorage()

/**
 * Update Storage API - Black Box Interface
 * 
 * All update notification state is managed through these methods.
 * External code doesn't need to know about storage keys or implementation.
 */
export const updateStorage = {
  /**
   * Check if user has dismissed this version's update
   */
  isDismissed: (version: string): boolean => {
    return storage.getItem(`update-${version}-dismissed`) === 'true'
  },
  
  /**
   * Mark this version's update as dismissed
   */
  dismiss: (version: string): void => {
    storage.setItem(`update-${version}-dismissed`, 'true')
  },
  
  /**
   * Check if user has seen the toast notification for this version
   */
  hasSeenToast: (version: string): boolean => {
    return storage.getItem(`toast-${version}-shown`) === 'true'
  },
  
  /**
   * Mark toast notification as seen for this version
   */
  markToastSeen: (version: string): void => {
    storage.setItem(`toast-${version}-shown`, 'true')
  },
  
  /**
   * Get the last version the user saw
   * Used to detect if current version is new
   */
  getLastSeenVersion: (): string | null => {
    return storage.getItem('last-seen-version')
  },
  
  /**
   * Store the current version as last seen
   */
  setLastSeenVersion: (version: string): void => {
    storage.setItem('last-seen-version', version)
  },
  
  /**
   * Admin utility: Force-show update for this version
   * Clears all dismissal and toast flags
   * 
   * Use case: Critical security update needs to be seen by everyone
   */
  clearDismissal: (version: string): void => {
    storage.removeItem(`update-${version}-dismissed`)
    storage.removeItem(`toast-${version}-shown`)
  },
  
  /**
   * Admin utility: Clear all update-related storage
   * Use for debugging or reset scenarios
   */
  clearAll: (): void => {
    const keys = []
    
    // Collect all update-related keys
    if (storage === localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('update-') || key.startsWith('toast-') || key === 'last-seen-version')) {
          keys.push(key)
        }
      }
    } else {
      // Memory storage - just clear the map
      ;(storage as MemoryStorage)['store'].clear()
      return
    }
    
    // Remove collected keys
    keys.forEach(key => storage.removeItem(key))
  }
}

/**
 * Type guard for testing - check if using memory storage
 * @internal
 */
export function isUsingMemoryStorage(): boolean {
  return storage instanceof MemoryStorage
}

