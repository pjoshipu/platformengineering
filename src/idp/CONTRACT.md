# IDP Persona Build Contract

Read this before building a persona. The App / Platform Engineer persona
(`src/idp/personas/app-engineer/`) is the **reference implementation** — mirror
its structure, import style, and interaction patterns.

## File layout for a persona `<id>`

```
src/idp/personas/<id>/
  api.ts          # mock API: typed dummy data + async functions (GET/POST/etc)
  <Screen>.tsx    # one file per screen
  index.tsx       # default-exports a PersonaModule (nav + routes)
```

`index.tsx` must default-export a `PersonaModule` (see `src/idp/types.ts`). The
persona is already registered in `src/idp/personas/registry.ts` and its nav /
placeholder routes already exist — replace the placeholder routes with real
screens. **Every route `path` must be prefixed with the persona id**, e.g.
`{ path: "<id>/dashboard", element: <Dashboard/> }`. For detail screens with an
id param, add extra routes like `{ path: "<id>/prompts/:appId", element: … }`
and have the list screen `navigate()` to them.

Keep the `nav` items already defined in the placeholder `index.tsx` (labels +
paths) unless the spec needs more.

## Mock API (`src/idp/api/client.ts`)

- `delay(ms?)` — await this at the top of every mock fn to simulate latency.
- `uid(prefix?)`, `minutesAgo(n)`, `hoursAgo(n)`, `daysAgo(n)`, `timeAgo(iso)`.
- `useMockQuery(fetcher, deps)` → `{ data, loading, error, refetch }`. Use this
  in screens to load data. `fetcher` must be a stable arrow that calls your api.
  For param-dependent fetches, guard: `() => id ? getThing(id) : Promise.resolve(undefined)`
  and pass `[id]` as deps.

Build all GET endpoints from the spec with realistic dummy data. Write
endpoints (POST/PUT/PATCH/DELETE) should `await delay()` and return a plausible
id/status object; wire them to `toast` on success. Use `sonner`'s `toast`.

## Shared component library — import from `@/idp/components`

- `PageHeader({ title, description?, actions?, backTo?, backLabel? })`
- `MetricsRow` + `MetricCard({ label, value, icon?, tone?, delta?, deltaPositive?, footer?, onClick?, actionLabel? })`
  tone: `"default" | "good" | "warning" | "poor" | "highlight"`.
- `StatusBadge({ children, tone? })` — pass a raw status string; tone is inferred
  (healthy/synced/pass=green, warning/pending=yellow, fail/critical=red, etc).
  Override with `tone` for env chips (`tone="neutral"`).
- `DataTable({ columns, rows, rowKey, onRowClick?, toolbar?, loading?, defaultSort? })`
  `Column<T>` = `{ key, header, render?(row), accessor?(row), sortable?, align?, className? }`.
  Put filter selects/search in `toolbar`. Stop row-click propagation on action
  buttons with `onClick={(e)=>e.stopPropagation()}`.
- `SideDrawer({ open, onOpenChange, title, description?, wide?, children })` — right detail drawer.
- `Wizard({ steps, onSubmit, submitLabel?, submitting? })`, `WizardStep = { title, content, validate?() }`.
  `validate` returns `true` to allow, `false` or an error string to block.
- `KeyValueEditor({ pairs, onChange, ... })`, `KeyValuePair = { key, value }` — env vars / hyperparams.
- `DiffViewer({ before, after, beforeLabel?, afterLabel? })` — line diff (added green / removed red).
- `Field({ label, htmlFor?, hint?, required?, children })` — wrap every form control.
- `InfoList({ items: {label, value}[] })` — read-only detail lists / review steps.
- `SectionCard({ title?, description?, actions?, children })`, `SidePanel({ title, children })` — right dashboard panels.
- Charts (recharts wrappers): `LineChartCard`, `AreaChartCard`, `StackedBarChartCard`,
  `HorizontalBarChartCard`, and generic `ChartCard`. Line/Area/StackedBar take
  `{ title, data, series: {key,label?,color?}[], xKey? (default "ts"), height?, threshold? }`.
  Horizontal takes `{ title, data: {name,value}[] }`.
- States: `Loading`, `RowSkeleton`, `EmptyState({ icon?, title, description?, action? })`.

## Base UI (shadcn) — import from `@/components/ui/*`

`button`, `input`, `textarea`, `select`, `switch`, `checkbox`, `slider`,
`radio-group`, `dialog`, `tabs`, `card`, `label`, `badge`, `progress`,
`scroll-area`, `separator`. Use these for form controls inside `Field`.

## Conventions

- Dashboards: `PageHeader` → `MetricsRow` (4 `MetricCard`s) → main grid
  `lg:grid-cols-[1fr_320px]` with a `DataTable` and a right `SidePanel`.
- Multi-step forms (deploy / new request): use `Wizard`. Single forms with a
  live preview: two-column grid (form left, preview right) like NewServiceRequest.
- Highlight "above zero" metrics with `tone="poor"`/`"warning"`.
- Every screen is a default export; keep components self-contained.
- Match Tailwind styling used in the reference (spacing, `text-muted-foreground`,
  `font-mono text-xs` for ids/versions/yaml).

## Build check

The whole app must still `npm run build` cleanly. Don't edit files outside your
persona folder (the registry and shared components are already done). Verify
your TypeScript types line up with `useMockQuery` (it returns `data` possibly
`undefined` — default with `?? []` / guard before use).
