import { useEffect, useState, useCallback } from "react";

/**
 * Shared helpers for the IDP mock API layer. Every persona builds its own
 * `api.ts` on top of these so all screens share one loading/data pattern and
 * feel like they talk to a real backend (latency + async).
 */

/** Simulated network latency. */
export const delay = (ms = 420) => new Promise((r) => setTimeout(r, ms));

/** Small unique id generator for mock records. */
export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Deterministic-ish pick so mock data is stable within a render. */
export const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length];

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  refetch: () => void;
}

/**
 * useMockQuery — runs an async mock fetcher and tracks loading/error/data.
 * Re-runs when any value in `deps` changes. Mirrors the shape of a real data
 * hook so screens read naturally.
 */
export function useMockQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): QueryState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    fetcher()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, refetch };
}

/** now-minus helpers for realistic timestamps. */
export const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();
export const hoursAgo = (h: number) => minutesAgo(h * 60);
export const daysAgo = (d: number) => hoursAgo(d * 24);

/** Human "time ago" formatter. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
