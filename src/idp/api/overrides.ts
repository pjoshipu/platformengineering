/**
 * Shared overrides engine for the IDP mock API layer.
 *
 * Screens read from hardcoded mock arrays (e.g. CATALOG, PIPELINES). To let the
 * Platform Console plugin do CRUD *without mutating those source arrays*, each
 * opted-in feature keeps a sibling `*-overrides.json` file that the plugin
 * writes. The read functions merge the overrides on top of the built-in data
 * via `applyOverrides`. Because the JSON is imported as a module, editing it
 * triggers a Vite HMR update — changes show up in the running portal live.
 *
 * The overrides for a resource express all three write ops declaratively:
 *   - `added`   → new rows (prepended, so they sort to the top)
 *   - `updated` → partial field patches applied to a row by id
 *   - `removed` → ids tombstoned out of the built-in list
 */

export interface ResourceOverrides<T> {
  /** New rows created by the plugin; prepended ahead of built-in rows. */
  added?: T[];
  /** Partial patches keyed by row id (built-in or added). */
  updated?: Record<string, Partial<T>>;
  /** Ids removed from the effective list. */
  removed?: string[];
}

/**
 * Merge built-in rows with an overrides record: drop removed ids, apply field
 * patches by id, then prepend added rows.
 */
export function applyOverrides<T extends { id: string }>(
  base: T[],
  ov?: ResourceOverrides<T>
): T[] {
  if (!ov) return base;
  const gone = new Set(ov.removed ?? []);
  const kept = base
    .filter((r) => !gone.has(r.id))
    .map((r) => (ov.updated?.[r.id] ? { ...r, ...ov.updated[r.id] } : r));
  return [...(ov.added ?? []), ...kept];
}

/**
 * Accept either the canonical object form or the legacy array form, where a
 * bare `[rows]` is treated as `{ added: [rows] }` (the shape the first version
 * of catalog-overrides.json used).
 */
export function normalizeOverrides<T>(raw: unknown): ResourceOverrides<T> {
  if (Array.isArray(raw)) return { added: raw as T[] };
  return (raw as ResourceOverrides<T>) ?? {};
}
