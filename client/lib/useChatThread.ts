"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

export interface ChatMessage {
  id: string;
  patientId: string;
  senderRole: "admin" | "patient";
  senderId?: string | null;
  body: string;
  isRead?: boolean;
  readAt?: string | null;
  deleted?: boolean;
  createdAt: string;
}

interface OptimisticMessage extends ChatMessage {
  pending?: boolean;
  failed?: boolean;
}

interface Options {
  /** Patient thread to load. When null, the hook is idle. */
  patientId: string | null;
  /** Identifier for the current user's role — used to render bubbles correctly. */
  selfRole: "admin" | "patient";
  /** Polling cadence while the tab is focused. Defaults to 5s. */
  intervalMs?: number;
  /** Maximum time between polls when the tab is hidden. Defaults to 60s. */
  hiddenIntervalMs?: number;
}

function normalize(raw: any): ChatMessage[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.messages)
    ? raw.messages
    : Array.isArray(raw?.data)
    ? raw.data
    : [];
  return list as ChatMessage[];
}

/**
 * Per-patient cache so navigating away and back paints instantly with the
 * last known thread instead of a skeleton.
 */
const threadCache = new Map<string, ChatMessage[]>();

/**
 * Conversation hook backed by polling.
 * - Stable callbacks (no dep churn from `serverMessages.length`).
 * - Only resets state when the patient actually changes to a different non-null id.
 * - Optimistic send + soft-delete with rollback.
 * - Read-receipt support (markRead).
 */
export function useChatThread({
  patientId,
  selfRole,
  intervalMs = 5000,
  hiddenIntervalMs = 60000,
}: Options) {
  const [serverMessages, setServerMessages] = useState<ChatMessage[]>(() =>
    patientId ? threadCache.get(patientId) || [] : []
  );
  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    if (!patientId) return false;
    return !threadCache.has(patientId);
  });
  const [error, setError] = useState<string | null>(null);

  // Mutable refs for stable callbacks
  const patientIdRef = useRef(patientId);
  const serverLengthRef = useRef(serverMessages.length);
  const stoppedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPollAtRef = useRef<number>(0);

  // Keep refs in sync without triggering callback recreation
  useEffect(() => {
    serverLengthRef.current = serverMessages.length;
  }, [serverMessages.length]);

  useEffect(() => {
    patientIdRef.current = patientId;
  }, [patientId]);

  // When the patient ACTUALLY changes (to a different non-null id), reset state
  // and abort any in-flight request. Switching away to null does NOT clear the
  // cached thread so we don't flash empty during auth bootstraps.
  useEffect(() => {
    if (!patientId) return;
    abortRef.current?.abort();
    abortRef.current = null;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    stoppedRef.current = false;
    setError(null);
    setOptimistic([]);
    const cached = threadCache.get(patientId);
    setServerMessages(cached || []);
    setLoading(!cached);
  }, [patientId]);

  /** Stable fetcher — reads patientId/length from refs so it never reruns the
   * polling effect just because the message count changed. */
  const fetchThread = useCallback(async (silent = false) => {
    const pid = patientIdRef.current;
    if (!pid || stoppedRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent && serverLengthRef.current === 0) {
      setLoading(true);
    }

    try {
      const data = await apiRequest(`/messages/${pid}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      // Drop the response if the conversation switched mid-flight.
      if (patientIdRef.current !== pid) return;
      const next = normalize(data);
      threadCache.set(pid, next);
      setServerMessages(next);
      setError(null);
      lastPollAtRef.current = Date.now();
    } catch (err: any) {
      if (controller.signal.aborted) return;
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to load messages.");
      if (err?.status === 401) {
        stoppedRef.current = true;
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Polling — only depends on patient + intervals so it doesn't reset on every render.
  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled || stoppedRef.current) return;
      const hidden =
        typeof document !== "undefined" && document.hidden ? true : false;
      if (!hidden) {
        await fetchThread(true);
      }
      if (cancelled || stoppedRef.current) return;
      const next = hidden ? hiddenIntervalMs : intervalMs;
      pollTimerRef.current = setTimeout(tick, Math.max(2000, next));
    };

    fetchThread(false);
    pollTimerRef.current = setTimeout(tick, intervalMs);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, [patientId, intervalMs, hiddenIntervalMs, fetchThread]);

  // Refetch on focus
  useEffect(() => {
    if (!patientId) return;
    const onFocus = () => {
      const since = Date.now() - lastPollAtRef.current;
      if (since > 2000) fetchThread(true);
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
  }, [patientId, fetchThread]);

  // Combined view — server thread plus any pending optimistic outbound messages.
  const messages = useMemo(() => {
    const ids = new Set(serverMessages.map((m) => m.id));
    const stillPending = optimistic
      .filter((m) => m.patientId === patientId)
      .filter((m) => !ids.has(m.id));
    const merged = [...serverMessages, ...stillPending];
    return merged.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [serverMessages, optimistic, patientId]);

  const sendMessage = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      const pid = patientIdRef.current;
      if (!trimmed || !pid) return;

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const tempMsg: OptimisticMessage = {
        id: tempId,
        patientId: pid,
        senderRole: selfRole,
        body: trimmed,
        isRead: false,
        deleted: false,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setOptimistic((prev) => [...prev, tempMsg]);

      try {
        const saved = await apiRequest("/messages", {
          method: "POST",
          body: JSON.stringify({ patientId: pid, body: trimmed }),
        });
        const realMessage: ChatMessage = saved?.message || saved;

        if (realMessage?.id) {
          // Insert the real message into serverMessages immediately so it
          // never disappears between the optimistic remove and the next poll.
          setServerMessages((prev) => {
            if (prev.some((m) => m.id === realMessage.id)) return prev;
            const next = [...prev, realMessage].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
            threadCache.set(pid, next);
            return next;
          });
          // Drop the optimistic placeholder; the server copy is now authoritative.
          setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
        }

        // Fire a silent refetch to capture anything else (e.g. the other side
        // typed a reply at the same moment).
        fetchThread(true);
        return realMessage;
      } catch (err: any) {
        setOptimistic((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m
          )
        );
        throw err;
      }
    },
    [selfRole, fetchThread]
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      const pid = patientIdRef.current;
      if (!pid) return;

      // Optimistic — flip the message to "deleted" while we await the server.
      setServerMessages((prev) => {
        const next = prev.map((m) =>
          m.id === id ? { ...m, deleted: true, body: "" } : m
        );
        threadCache.set(pid, next);
        return next;
      });
      setOptimistic((prev) => prev.filter((m) => m.id !== id));

      try {
        await apiRequest(`/messages/${id}`, { method: "DELETE" });
      } catch (err) {
        await fetchThread(true);
        throw err;
      }
    },
    [fetchThread]
  );

  const clearChat = useCallback(async () => {
    const pid = patientIdRef.current;
    if (!pid) return;

    // Optimistic clear
    setServerMessages([]);
    threadCache.set(pid, []);
    setOptimistic([]);

    try {
      await apiRequest(`/messages/patient/${pid}`, { method: "DELETE" });
    } catch (err) {
      await fetchThread(true);
      throw err;
    }
  }, [fetchThread]);

  const markRead = useCallback(async () => {
    const pid = patientIdRef.current;
    if (!pid) return;
    try {
      await apiRequest(`/messages/${pid}/read`, { method: "PATCH" });
    } catch {
      /* non-fatal */
    }
  }, []);

  return {
    messages,
    loading,
    error,
    refetch: () => fetchThread(false),
    sendMessage,
    deleteMessage,
    clearChat,
    markRead,
  };
}
