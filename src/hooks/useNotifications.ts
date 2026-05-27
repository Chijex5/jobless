// hooks/useNotifications.ts  —  v2
// ─────────────────────────────────────────────────────────────────────────────
// Replaces every piece of local state in SignalsScreen.tsx:
//   • importantIds  (was: useState<string[]>)
//   • dismissedIds  (was: useState<string[]>)
//   • totalActive   (was: NOTIFICATIONS.length - dismissedIds.length)
//   • toggleImportant / dismiss / restoreDismissed  (were: local setters)
//
// All interactions optimistically update local state then sync to the DB.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'High Match Opportunity'
  | 'Trending Opportunity'
  | 'Deadline Alert'
  | 'AI Insight Alert'
  | 'System Activity'
  | 'Queue Reminder';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationSection =
  | 'Today'
  | 'Earlier This Week'
  | 'Intelligence Updates'
  | 'Opportunity Alerts'
  | 'System Activity';

export type NotificationItem = {
  id: string;
  section: NotificationSection;
  title: string;
  context: string;
  time: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  matchScore?: number;
  urgency?: string;
  actions: string[];
  signalId?: string;
  generatedAt: string;
  // ── persisted user state ─────────────────────
  isImportant: boolean;   // PATCH /notifications/{id}/important
  isDismissed: boolean;   // PATCH /notifications/{id}/dismiss
};

export const SECTION_ORDER: NotificationSection[] = [
  'Today',
  'Earlier This Week',
  'Intelligence Updates',
  'Opportunity Alerts',
  'System Activity',
];

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://ai-scraper-tb7n.onrender.com';
const POLL_MS  = 5 * 60 * 1000; // re-fetch every 5 min

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  // allItems holds both active AND dismissed — we need dismissed in memory
  // so the "restore N dismissed" count is always accurate without a second
  // API call, and so restoreDismissed() can flip them back immediately.
  const [allItems,    setAllItems]    = useState<NotificationItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── fetch (always fetches everything including dismissed) ─────────────────
  const fetchAll = useCallback(async () => {
    try {
      // include_dismissed=true so we can restore them later
      const res = await fetch(`${API_BASE}/notifications?include_dismissed=true`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NotificationItem[] = await res.json();
      setAllItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  // ── derived values the screen needs directly ──────────────────────────────

  // Active feed: what the screen renders
  const items        = allItems.filter(n => !n.isDismissed);

  // These replace the screen's useState<string[]> calls entirely
  const importantIds = allItems.filter(n => n.isImportant).map(n => n.id);
  const dismissedIds = allItems.filter(n => n.isDismissed).map(n => n.id);

  // Mirrors the original: NOTIFICATIONS.length - dismissedIds.length
  const totalActive  = items.length;

  // Grouped map — same shape as the screen's useMemo, now derived from live data
  const grouped = (() => {
    const map = new Map<NotificationSection, NotificationItem[]>();
    for (const section of SECTION_ORDER) map.set(section, []);
    for (const item of items) map.get(item.section)?.push(item);
    return map;
  })();

  // ── toggleImportant ───────────────────────────────────────────────────────
  // Replaces:  setImportantIds(prev => prev.includes(id) ? prev.filter(...) : [...prev, id])
  const toggleImportant = useCallback(async (id: string) => {
    // 1. Optimistic update — flips isImportant locally so the star changes instantly
    setAllItems(prev =>
      prev.map(n => n.id === id ? { ...n, isImportant: !n.isImportant } : n)
    );
    // 2. Persist to DB — fire and forget; if it fails the next poll will re-sync
    try {
      await fetch(`${API_BASE}/notifications/${id}/important`, { method: 'PATCH' });
    } catch {
      // re-sync on network failure
      await fetchAll();
    }
  }, [fetchAll]);

  // ── dismiss ───────────────────────────────────────────────────────────────
  // Replaces:  setDismissedIds(prev => [...prev, id])
  // Uses SOFT delete (PATCH isDismissed=true) so restore is possible.
  const dismiss = useCallback(async (id: string) => {
    // 1. Optimistic: mark dismissed locally — item disappears from active feed immediately
    setAllItems(prev =>
      prev.map(n => n.id === id ? { ...n, isDismissed: true } : n)
    );
    // 2. Persist
    try {
      await fetch(`${API_BASE}/notifications/${id}/dismiss`, { method: 'PATCH' });
    } catch {
      await fetchAll();
    }
  }, [fetchAll]);

  // ── restoreDismissed ──────────────────────────────────────────────────────
  // Replaces:  setDismissedIds([])
  const restoreDismissed = useCallback(async () => {
    // 1. Optimistic: flip all isDismissed back to false locally
    setAllItems(prev => prev.map(n => ({ ...n, isDismissed: false })));
    // 2. Persist
    try {
      await fetch(`${API_BASE}/notifications/restore-dismissed`, { method: 'POST' });
    } catch {
      await fetchAll();
    }
  }, [fetchAll]);

  // ── forceGenerate ─────────────────────────────────────────────────────────
  const forceGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await fetch(`${API_BASE}/notifications/generate`, { method: 'POST' });
      await fetchAll();
    } finally {
      setGenerating(false);
    }
  }, [fetchAll]);

  return {
    // ── data the screen renders ──
    items,          // active (non-dismissed) notifications
    grouped,        // pre-grouped Map<section, items[]> — drop into JSX directly
    importantIds,   // string[] — replaces useState<string[]>
    dismissedIds,   // string[] — replaces useState<string[]>
    totalActive,    // number   — replaces NOTIFICATIONS.length - dismissedIds.length

    // ── status ──
    loading,
    error,
    generating,

    // ── actions  (all optimistic + DB-backed) ──
    toggleImportant,    // (id: string) => void
    dismiss,            // (id: string) => void
    restoreDismissed,   // () => void  — replaces setDismissedIds([])
    forceGenerate,      // () => void
    refetch: fetchAll,
  };
}