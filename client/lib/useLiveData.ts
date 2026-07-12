"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { offlineCache } from "@/lib/offlineCache";

interface Options<T> {
  /** Polling interval in ms. Set to 0 to disable polling. Defaults to 30000. */
  intervalMs?: number;
  /** Re-fetch as soon as the tab regains focus. Defaults to true. */
  refetchOnFocus?: boolean;
  /** Skip the request entirely (e.g. while waiting for an ID). */
  enabled?: boolean;
  /** Transform the raw payload before storing. */
  select?: (raw: any) => T;
  /** Initial value before the first response. */
  initialData?: T;
  /** Minimum gap between focus-driven refetches in ms. Defaults to 10s. */
  focusThrottleMs?: number;
  /** Maximum backoff after errors in ms. Defaults to 5 minutes. */
  maxBackoffMs?: number;
}

/**
 * Per-path memory cache of the last successful payload. Lets us paint instantly
 * on navigation back to a page so the user sees prior data, not a skeleton.
 */
const memoryCache = new Map<string, unknown>();

/**
 * Lightweight polling hook for "live-feeling" data without WebSockets.
 *
 * - Polls only while the tab is visible.
 * - Stops polling permanently after an auth error (401).
 * - Respects Retry-After on 429 / network errors with exponential backoff.
 * - Throttles focus-driven refetches.
 * - Cancels in-flight requests via AbortController on unmount or path change.
 */
export function useLiveData<T = unknown>(
  path: string | null,
  options: Options<T> = {}
) {
  const {
    intervalMs = 30000,
    refetchOnFocus = true,
    enabled = true,
    select,
    initialData,
    focusThrottleMs = 10000,
    maxBackoffMs = 5 * 60 * 1000,
  } = options;

  const hasDataRef = useRef(initialData !== undefined);
  const selectRef = useRef(select);
  
  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  const [data, setData] = useState<T | undefined>(() => {
    // Try to seed from the in-memory cache so navigation is instant.
    if (path && memoryCache.has(path)) {
      hasDataRef.current = true;
      return memoryCache.get(path) as T;
    }
    return initialData;
  });
  
  // Asynchronously seed from IndexedDB if not in memory
  useEffect(() => {
    if (path && !memoryCache.has(path) && !hasDataRef.current) {
      offlineCache.getItem<T>(`live:${path}`).then(cached => {
        if (cached && !hasDataRef.current) {
          setData(cached);
          hasDataRef.current = true;
          setLoading(false); // We have offline data, stop showing skeletons
        }
      });
    }
  }, [path]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (!path || !enabled) return false;
    if (path && memoryCache.has(path)) return false;
    if (initialData !== undefined) return false;
    return true;
  });

  // Mutable refs that don't need to drive renders
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false); // hard stop after auth/429 saturation
  const lastFocusFetchRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const clearTimer = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const scheduleNext = useCallback(
    (delay: number) => {
      clearTimer();
      if (!mountedRef.current || stoppedRef.current || intervalMs <= 0) return;
      pollTimerRef.current = setTimeout(() => {
        if (typeof document !== "undefined" && document.hidden) {
          // Defer until the tab is visible again
          scheduleNext(intervalMs);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        runFetch(true);
      }, Math.max(1000, delay));
    },
    [intervalMs]
  );

  const runFetch = useCallback(
    async (silent: boolean) => {
      if (!path || !enabled || stoppedRef.current) return;

      // Cancel any in-flight request only if it hasn't been aborted yet
      if (abortRef.current && !abortRef.current.signal.aborted) {
        abortRef.current.abort();
      }
      abortRef.current = null;
      
      const controller = new AbortController();
      abortRef.current = controller;

      // Only show the loading state when we don't already have data —
      // prevents the page from "blinking" between renders.
      const hasData = hasDataRef.current;
      const showLoading = !silent && !hasData;
      if (showLoading) setLoading(true);

      try {
        const raw = await apiRequest(path, { signal: controller.signal });
        if (!mountedRef.current || controller.signal.aborted) return;

        consecutiveErrorsRef.current = 0;
        const next = selectRef.current ? selectRef.current(raw) : (raw as T);
        memoryCache.set(path, next);
        offlineCache.setItem(`live:${path}`, next);
        setData(next);
        hasDataRef.current = true;
        setError(null);

        scheduleNext(intervalMs);
      } catch (err: any) {
        if (controller.signal.aborted || !mountedRef.current) return;

        const apiErr = err as ApiError;
        setError(apiErr);

        // 401 — session is gone. Stop polling; the api layer will emit a
        // session-expired event so the auth store can sign out cleanly.
        if (apiErr?.status === 401) {
          stoppedRef.current = true;
          clearTimer();
          return;
        }

        // 429 — rate limited. Honour Retry-After if present, otherwise back off.
        if (apiErr?.status === 429) {
          const retry =
            apiErr.retryAfterMs && apiErr.retryAfterMs > 0
              ? apiErr.retryAfterMs
              : Math.min(maxBackoffMs, 30000);
          scheduleNext(retry);
          return;
        }

        // Generic error — exponential backoff capped at maxBackoffMs.
        consecutiveErrorsRef.current += 1;
        const backoff = Math.min(
          maxBackoffMs,
          Math.max(intervalMs, 5000) *
            Math.pow(2, Math.min(consecutiveErrorsRef.current, 6))
        );
        scheduleNext(backoff);
      } finally {
        if (mountedRef.current && showLoading) setLoading(false);
      }
    },
    [path, enabled, intervalMs, maxBackoffMs, scheduleNext]
  );

  // Track mount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      if (abortRef.current && !abortRef.current.signal.aborted) {
        abortRef.current.abort();
      }
      abortRef.current = null;
    };
  }, []);

  // Reset stopped flag when path/enabled changes (new resource = fresh attempt)
  useEffect(() => {
    stoppedRef.current = false;
    consecutiveErrorsRef.current = 0;
    if (!path || !enabled) {
      clearTimer();
      setLoading(false);
      return;
    }
    // First load shows the skeleton; after that the runFetch helper itself
    // decides whether to flip the loading flag based on whether we already
    // have data.
    runFetch(hasDataRef.current);
    return clearTimer;
  }, [path, enabled, runFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visibility & focus handling
  useEffect(() => {
    if (!refetchOnFocus || !path || !enabled) return;

    const onFocus = () => {
      if (stoppedRef.current) return;
      const now = Date.now();
      if (now - lastFocusFetchRef.current < focusThrottleMs) return;
      lastFocusFetchRef.current = now;
      runFetch(true);
    };

    const onVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) onFocus();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetchOnFocus, path, enabled, focusThrottleMs, runFetch]);

  return {
    data,
    error,
    loading,
    refetch: () => {
      stoppedRef.current = false;
      consecutiveErrorsRef.current = 0;
      return runFetch(false);
    },
  };
}
