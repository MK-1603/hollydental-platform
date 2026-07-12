import { get, set } from 'idb-keyval';
import { apiRequest } from './api';

export interface MutationTask {
  id: string; // unique ID for the task
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timestamp: number;
}

const QUEUE_KEY = 'offline_mutation_queue';

/**
 * Get the current mutation queue from IndexedDB
 */
export async function getMutationQueue(): Promise<MutationTask[]> {
  try {
    const queue = await get<MutationTask[]>(QUEUE_KEY);
    return queue || [];
  } catch (error) {
    console.error('[OfflineSync] Failed to get queue:', error);
    return [];
  }
}

/**
 * Save the mutation queue to IndexedDB
 */
export async function setMutationQueue(queue: MutationTask[]): Promise<void> {
  try {
    await set(QUEUE_KEY, queue);
  } catch (error) {
    console.error('[OfflineSync] Failed to set queue:', error);
  }
}

/**
 * Add a mutation to the queue for background synchronization.
 * Uses Last-Write-Wins (LWW) by replacing existing tasks for the same URL and method (like PUT).
 */
export async function queueMutation(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: any): Promise<void> {
  const queue = await getMutationQueue();
  
  // Last-Write-Wins: If there's already a pending PUT for this exact URL, replace it
  const existingIndex = queue.findIndex(t => t.url === url && t.method === method);
  
  const newTask: MutationTask = {
    id: crypto.randomUUID(),
    url,
    method,
    body,
    timestamp: Date.now()
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = newTask;
  } else {
    queue.push(newTask);
  }

  await setMutationQueue(queue);
  
  // Attempt sync immediately if we believe we are online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    syncQueue();
  }
}

let isSyncing = false;

/**
 * Process all tasks in the mutation queue sequentially.
 */
export async function syncQueue(): Promise<void> {
  if (isSyncing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  
  const queue = await getMutationQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  
  // Sort tasks chronologically
  queue.sort((a, b) => a.timestamp - b.timestamp);

  const newQueue = [...queue];

  for (const task of queue) {
    try {
      await apiRequest(task.url, {
        method: task.method,
        body: task.body ? JSON.stringify(task.body) : undefined
      });
      // On success, remove from the pending queue
      const index = newQueue.findIndex(t => t.id === task.id);
      if (index > -1) {
        newQueue.splice(index, 1);
      }
    } catch (error: any) {
      console.error(`[OfflineSync] Task ${task.id} failed:`, error);
      // If it's a 4xx error (e.g. invalid data), we might want to discard it so it doesn't block the queue forever.
      // For now, we only keep it if it's a network error.
      if (error?.status && error.status >= 400 && error.status < 500) {
         const index = newQueue.findIndex(t => t.id === task.id);
         if (index > -1) newQueue.splice(index, 1);
      }
      break; // Stop syncing on first network failure to preserve chronological order
    }
  }

  await setMutationQueue(newQueue);
  isSyncing = false;
}

/**
 * Set up network listeners to trigger background sync.
 */
export function initOfflineSync(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('[OfflineSync] Online. Attempting to sync queue...');
      syncQueue();
    });
    
    // Initial check
    if (navigator.onLine) {
      syncQueue();
    }
  }
}
