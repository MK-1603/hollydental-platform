import { get, set, del, keys } from 'idb-keyval';

/**
 * A simple wrapper around idb-keyval for caching API responses.
 * Provides offline support and fast initial loads via Stale-While-Revalidate.
 */
export const offlineCache = {
  /**
   * Save data to the offline cache.
   */
  async setItem<T>(key: string, data: T): Promise<void> {
    try {
      await set(key, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`[OfflineCache] Failed to set ${key}:`, error);
    }
  },

  /**
   * Retrieve data from the offline cache.
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const entry = await get(key);
      if (entry && entry.data) {
        return entry.data as T;
      }
      return null;
    } catch (error) {
      console.error(`[OfflineCache] Failed to get ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove an item from the offline cache.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      console.error(`[OfflineCache] Failed to remove ${key}:`, error);
    }
  },

  /**
   * Clear all items matching a specific prefix (useful for cache invalidation).
   */
  async clearPrefix(prefix: string): Promise<void> {
    try {
      const allKeys = await keys();
      const keysToDelete = allKeys.filter(k => typeof k === 'string' && k.startsWith(prefix));
      await Promise.all(keysToDelete.map(k => del(k)));
    } catch (error) {
      console.error(`[OfflineCache] Failed to clear prefix ${prefix}:`, error);
    }
  }
};
