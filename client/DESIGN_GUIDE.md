# FleetFlow Client — Design System & Architecture Guide

> **Single source of truth for all future UI development on FleetFlow.**
> Every developer and AI assistant building new pages or components must read this first.

---

## 1. Design Philosophy & Aesthetic Direction

### Theme: "Industrial Precision"

FleetFlow is a mission-critical fleet management system used by professionals.
The design prioritizes **information density over decoration**, **clarity over style**, and **precision over flair** — without being boring.

**Core aesthetic pillars:**
- **Dark-first, high-contrast**: Deep navy/charcoal base (`#0A0C12`) with electric cyan (`#00D4FF`) as the primary accent
- **Compact density**: Every pixel earns its place. No wasteful padding, no decorative fluff
- **Functional color**: Color is used semantically (green = go, amber = warn, red = stop), never aesthetically
- **Subtle sophistication**: Grid texture backgrounds, faint glows — never loud, always present

**Inspiration**: Industrial HMI dashboards, Bloomberg Terminal, Vercel/Linear interface philosophy.

---

## 2. Color System

All colors defined in `tailwind.config.ts` and accessible as Tailwind classes.

### Background Layers (Dark to Light)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-bg-base` | `#0A0C12` | Page background |
| `bg-bg-surface` | `#10131C` | Sidebar, navbar |
| `bg-bg-card` | `#151A26` | Cards (default elevation) |
| `bg-bg-elevated` | `#1C2132` | Hover states, nested cards |
| `bg-bg-border` | `#232840` | All borders |
| `bg-bg-hover` | `#1E2438` | Table row hover |

### Accent
| Token | Usage |
|-------|-------|
| `text-cyan-400` (`#1ADFFF`) | Active nav, links, highlights |
| `bg-cyan-500` (`#00D4FF`) | Primary CTA backgrounds |
| `text-cyan-500/30` (opacity) | Borders on active states |

### Text Hierarchy
| Token | Hex | Usage |
|-------|-----|-------|
| `text-text-primary` | `#F0F4FF` | Headings, key data |
| `text-text-secondary` | `#8A94B0` | Body text, table cells |
| `text-text-muted` | `#4A5272` | Metadata, timestamps, labels |

### Status Color Map (IMMUTABLE)
| Status Value | Color Token | Hex |
|-------------|-------------|-----|
| `AVAILABLE`, `ON_DUTY`, `VALID` | emerald-400 | `#10B981` |
| `ON_TRIP`, `DISPATCHED` | blue-400 | `#3B82F6` |
| `IN_TRANSIT` | cyan-400 | `#06B6D4` |
| `IN_SHOP`, `EXPIRING_SOON` | amber-400 | `#F59E0B` |
| `RETIRED`, `SUSPENDED`, `CANCELLED`, `EXPIRED` | red-400 | `#EF4444` |
| `DRAFT`, `OFF_DUTY` | slate-400 | `#94A3B8` |
| `COMPLETED` | violet-400 | `#8B5CF6` |

---

## 3. Typography

### Fonts
```
Display: Syne (Google Fonts) — font-display — used for headings, labels, KPI values
Body:    DM Sans (Google Fonts) — font-body — used for all prose, table cells, forms
```

Loaded in `globals.css`. Applied via Tailwind `font-display` and `font-body` utilities.

### Type Scale in Use
| Element | Classes | Notes |
|---------|---------|-------|
| Page title | `text-xl font-display font-bold tracking-tight` | `<PageHeader>` |
| Card header | `text-sm font-display font-semibold` | Inside cards |
| Section label | `.label-base` → `text-xs font-display font-semibold uppercase tracking-widest text-text-muted` | Above table columns |
| Body text | `text-sm font-body` | Descriptions |
| Table cell | `text-xs font-body text-text-secondary` | All data cells |
| Subtext | `text-[10px] font-body text-text-muted` | Metadata |
| KPI value | `text-2xl font-display font-bold` | Dashboard numbers |

---

## 4. Layout Architecture

### App Shell
```
[Sidebar w-56] | [Main flex-1]
                    [Navbar h-12]
                    [<main> p-5 overflow-y-auto]
```

### Sidebar
- `w-56` fixed width (224px), never collapsible in v1
- Logo at top, nav items, user profile + logout at bottom
- Active item: `bg-cyan-500/10 text-cyan-400 border border-cyan-500/20`

### Page Layout
```tsx
<div className="space-y-5 animate-fade-in">
  <PageHeader title subtitle action />
  {/* Optional filter bar */}
  <div className="card p-3 flex items-center gap-3">...</div>
  {/* Main content */}
  <div className="card overflow-hidden">
    <DataTable ... />
    <Pagination ... />
  </div>
</div>
```

### KPI Grid
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
  <KPICard ... />  {/* always 4 cards */}
</div>
```

### Two-column Dashboard
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2 card">...</div>  {/* main content */}
  <div className="card">...</div>                  {/* sidebar panel */}
</div>
```

---

## 5. Component Reference

### Shared Components (`src/components/shared/`)

#### `<StatusPill status size? showDot? />`
- Only component for rendering any status badge
- Never create custom badges; always use this
- `size="sm"` (default) | `size="md"`

#### `<KPICard label value subtext icon accent? trend? />`
- Accent: `cyan | amber | red | emerald | violet | blue`
- Always use an icon from `lucide-react`

#### `<DataTable columns data keyExtractor onRowClick? />`
- Generic, fully reusable table
- `columns[].render` for custom cell rendering
- `onRowClick` makes rows clickable (adds cursor-pointer)

#### `<PageHeader title subtitle? action? breadcrumb? />`
- Required on every page — never use raw `<h1>` in page files

#### `<EmptyState icon? title description? action? />`
- Show when `data.length === 0`
- Always provide an `action` button if the user can create records

#### `<LoadingSpinner size? centered? />`
- `centered={true}` (default) adds `py-12` wrapper
- `centered={false}` for inline use in buttons etc.

#### `<ErrorState message? retry? />`
- Show whenever `error` is truthy from a query

#### `<ConfirmDialog open onClose onConfirm title description variant? isLoading? />`
- `variant="danger"` → red confirm button
- `variant="warning"` → amber icon
- Always used for destructive/irreversible actions

#### `<Pagination meta onPageChange />`
- Renders below tables; hides if `totalPages <= 1`

### Form Components (`src/components/shared/FormComponents.tsx`)

#### `<FormField label required? error? hint? />`
- Wrapper for every form input — handles label, error message, hint text

#### `<Input ref error? prefix? suffix? />`
- All form text/number inputs
- `prefix="₹"` for currency, `suffix="kg"` for units

#### `<Select ref options error? placeholder? />`
- Styled native select (no library dependency)
- Options: `{ value: string; label: string }[]`

#### `<FormRow cols={2|3} />`
- Side-by-side form fields grid

#### `<FormSection title? />`
- Groups related form fields with optional header + divider

---

## 6. Drawer Pattern (for Create/Edit Forms)

All create/edit forms use **right-side drawers**, NOT full-page routes or centered modals.

```tsx
// Pattern structure
<>
  {/* Overlay */}
  {open && <div className="fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm" onClick={onClose} />}

  {/* Drawer */}
  <div className={cn(
    'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-bg-surface border-l border-bg-border shadow-card',
    'transition-transform duration-300 ease-in-out overflow-y-auto',
    open ? 'translate-x-0' : 'translate-x-full',
  )}>
    {/* Sticky header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border sticky top-0 bg-bg-surface z-10">
      <h2 className="text-base font-display font-semibold text-text-primary">{title}</h2>
      <button onClick={onClose} className="btn-ghost p-1.5"><X className="size-4" /></button>
    </div>

    {/* Form content */}
    <form className="p-5 space-y-5">
      <FormSection title="...">
        <FormField label="..." required>
          <Input ... />
        </FormField>
      </FormSection>

      {/* Footer */}
      <div className="flex gap-3 pt-2 border-t border-bg-border">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Save</button>
      </div>
    </form>
  </div>
</>
```

Drawer width: always `max-w-md` (448px).
Close on: X button, overlay click, Escape key (`useEffect` + `window.addEventListener('keydown')`).

---

## 7. Modal Pattern (for Status Updates, Confirmations)

Centered modals for **status updates and confirmations** only.

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
  <div className="relative w-full max-w-sm card p-5 animate-fade-in shadow-card">
    {/* Header with close */}
    {/* Content */}
    {/* Action buttons */}
  </div>
</div>
```

Modal widths: `max-w-sm` (384px) for confirmations/simple forms, `max-w-md` for complex forms.

---

## 8. Button System

| Class | Appearance | Usage |
|-------|-----------|-------|
| `.btn-primary` | Cyan filled | Main CTAs (Add, Create, Save, Dispatch) |
| `.btn-secondary` | Dark outlined | Secondary actions (Cancel, Back, Filter) |
| `.btn-ghost` | Transparent hover | Icon buttons, nav items, subtle actions |
| `.btn-destructive` | Red outlined | Delete, Retire, Suspend |

All buttons support `disabled:opacity-50 disabled:cursor-not-allowed`.

---

## 9. Data Handling Rules

### Decimal Fields (Prisma Decimal → JSON String)
These fields come from the API as strings and MUST be converted before math or display:

```typescript
// Fields: maxCapacityKg, odometerKm, acquisitionCost, cargoWeightKg,
//         safetyScore, liters, costPerLiter, totalCost, cost, revenueGenerated

// ✅ Always use utility functions from src/lib/utils.ts:
import { formatCurrency, formatWeight, formatOdometer, formatNumber } from '@/lib/utils'

formatCurrency(vehicle.acquisitionCost)   // ₹5.0L
formatWeight(vehicle.maxCapacityKg)        // 1,000 kg
formatOdometer(vehicle.odometerKm)         // 45,231 km
Number(vehicle.maxCapacityKg)              // 1000 (for math)
```

### Dates
All dates from API are ISO strings. Use `formatDate()` or `formatDateTime()` from `src/lib/utils.ts`.

```typescript
formatDate('2025-03-15T00:00:00.000Z')     // "15 Mar 2025"
formatDateTime('2025-03-15T14:30:00.000Z') // "15 Mar 2025, 14:30"
```

---

## 10. Hooks Architecture

### Hook Files
```
src/hooks/useAuth.ts      → auth state, login, logout, role checks
src/hooks/useVehicles.ts  → vehicle queries & mutations
src/hooks/useDrivers.ts   → driver queries & mutations
src/hooks/useData.ts      → trips, maintenance, fuel logs, analytics
```

### Hook Naming Convention
```typescript
// Queries → use<Entity>(s)
useVehicles(filters?)       // list
useVehicle(id)              // single
useAvailableVehicles(type?) // filtered list

// Mutations → use<Action><Entity>
useCreateVehicle()
useUpdateVehicle(id)
useRetireVehicle()
```

### Mutation Pattern
```typescript
const createVehicle = useCreateVehicle()

const onSubmit = async (data: FormValues) => {
  try {
    await createVehicle.mutateAsync(data)
    toast.success('Vehicle created!')
    onClose()
  } catch (err) {
    const apiError = err as ApiError
    if (apiError?.error?.details) {
      // Field-level validation errors → set on form fields
      Object.entries(apiError.error.details).forEach(([field, messages]) => {
        setError(field as keyof FormValues, { message: messages[0] })
      })
    } else {
      // Business logic errors → toast
      toast.error(apiError?.error?.message ?? 'Something went wrong')
    }
  }
}
```

---

## 11. Adding a New Page — Checklist

### 1. Routes & Navigation
- [ ] Add to `src/constants/routes.ts`
- [ ] Add nav item in `src/components/shared/Sidebar.tsx` (with role if restricted)
- [ ] Add page title in `src/components/shared/Navbar.tsx` PAGE_TITLES map

### 2. API Layer
- [ ] Add API functions to appropriate `src/lib/xx.api.ts`
- [ ] Add query keys to `src/constants/queryKeys.ts`
- [ ] Add/extend hooks in appropriate `src/hooks/useXx.ts`

### 3. Page Component (`src/app/dashboard/<page>/page.tsx`)
- [ ] `'use client'` directive at top
- [ ] State for pagination (`page`), filters, form open state
- [ ] Fetch data with appropriate hook
- [ ] `if (isLoading) return <LoadingSpinner />`
- [ ] `if (error) return <ErrorState />`
- [ ] `<div className="space-y-5 animate-fade-in">`
- [ ] `<PageHeader title subtitle action={<button className="btn-primary">} />`
- [ ] Optional filter bar: `<div className="card p-3 flex gap-3">`
- [ ] Main content: `<div className="card overflow-hidden">`
- [ ] `<DataTable columns data keyExtractor />`
- [ ] `<Pagination meta onPageChange />`

### 4. Form Drawer (`src/components/<domain>/<Name>FormDrawer.tsx`)
- [ ] Uses Drawer pattern from §6 above
- [ ] React Hook Form + Zod schema
- [ ] `<FormSection>` → `<FormRow>` → `<FormField>` → `<Input>`
- [ ] Cancel + Save buttons in footer
- [ ] Error handling: `setError` for fields, `toast.error` for others
- [ ] Success: `toast.success`, close drawer, reset form

### 5. Mutations
- [ ] `useCreate<Entity>` in hook file
- [ ] Invalidates: own list + related lists (e.g., creating trip → invalidate vehicles, drivers, analytics)
- [ ] `<ConfirmDialog>` for destructive actions

---

## 12. Animation Rules

**Only use animations that serve a UX purpose:**

| Situation | Animation |
|-----------|-----------|
| Page mount | `.page-enter` → `animate-fade-in` (0.3s) |
| Drawer open/close | `transition-transform duration-300` |
| Card hover | `transition-all duration-200 hover:-translate-y-0.5` |
| Row hover | `transition-colors duration-100` |
| Status changes | `transition-colors duration-100` |
| Spinners | `animate-spin` |
| Skeletons | `animate-pulse` |

Do NOT add animations for decorative purposes.

---

## 13. Icons

Use **lucide-react** exclusively. No other icon libraries.

### Icon Size Reference
| Context | Class |
|---------|-------|
| Sidebar nav | `size-4` |
| Button | `size-4` |
| KPI card icon | `size-5` |
| Empty state | `size-7` |
| Modal heading icon | `size-5` |

### Stroke Width
- `strokeWidth={2}` → small, active/interactive icons
- `strokeWidth={1.5}` → large, decorative icons

---

## 14. Responsive Strategy

FleetFlow is **desktop-primary** (1024px+). Tablet support is secondary.

```
Mobile (<640px)    → single column, scrollable, sidebar hides (future)
Tablet (640-1023)  → 2 columns, sidebar still visible
Desktop (1024px+)  → full layout, 3-4 column grids
```

Breakpoint usage:
```tsx
grid-cols-2 lg:grid-cols-4   // KPI cards
grid-cols-1 sm:grid-cols-2   // Form rows
grid-cols-1 lg:grid-cols-3   // Dashboard two-col layout
```

---

## 15. Toast Notification Rules

Use `sonner` for all notifications:

```typescript
import { toast } from 'sonner'

toast.success('Vehicle added to fleet')    // ✅ after successful mutation
toast.error(apiError.error.message)        // ✅ after failed mutation (business logic)
toast.error('Failed to load data')         // ✅ after query failure on action
```

**Never** show toasts for field validation errors (use inline form errors).
Keep messages under 60 characters. Be specific (mention the entity/action).

---

## 16. File Structure Overview

```
src/
├── app/
│   ├── auth/login/page.tsx         ← Login page (no dashboard layout)
│   ├── dashboard/
│   │   ├── layout.tsx              ← Sidebar + Navbar shell
│   │   ├── page.tsx                ← Command Center dashboard
│   │   ├── vehicles/page.tsx
│   │   ├── trips/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── drivers/page.tsx
│   │   ├── maintenance/page.tsx
│   │   ├── expenses/page.tsx
│   │   └── analytics/page.tsx
│   ├── layout.tsx                  ← Root layout (QueryClientProvider, Toaster)
│   ├── globals.css
│   └── page.tsx                    ← Redirects to /dashboard
│
├── components/
│   ├── shared/                     ← Reusable across all pages
│   │   ├── Providers.tsx           ← QueryClient + Auth providers
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── StatusPill.tsx
│   │   ├── KPICard.tsx
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── FormComponents.tsx      ← Input, Select, FormField, FormRow, etc.
│   │   └── UI.tsx                  ← LoadingSpinner, EmptyState, ErrorState, PageHeader
│   ├── vehicles/
│   │   └── VehicleFormDrawer.tsx
│   ├── trips/
│   │   └── TripStatusModal.tsx
│   ├── drivers/
│   │   ├── DriverFormDrawer.tsx
│   │   └── IncidentModal.tsx
│   ├── maintenance/
│   │   └── MaintenanceFormDrawer.tsx
│   └── analytics/
│       └── FleetBreakdownChart.tsx
│
├── hooks/
│   ├── useAuth.ts                  ← Auth context + login/logout hooks
│   ├── useVehicles.ts              ← Vehicle queries/mutations
│   ├── useDrivers.ts               ← Driver queries/mutations
│   └── useData.ts                  ← Trips, maintenance, fuel logs, analytics
│
├── lib/
│   ├── api.ts                      ← Axios instance with interceptors
│   ├── auth.api.ts
│   ├── vehicles.api.ts
│   ├── drivers.api.ts
│   ├── trips.api.ts
│   ├── maintenance.api.ts          ← Also contains fuel log API
│   ├── analytics.api.ts
│   ├── utils.ts                    ← formatCurrency, formatDate, statusConfig, cn()
│   └── queryClient.ts              ← TanStack Query config
│
├── types/
│   ├── models.types.ts             ← All domain types (Vehicle, Driver, Trip...)
│   └── api.types.ts                ← ApiSuccess, ApiError, PaginationMeta
│
└── constants/
    ├── queryKeys.ts                ← All TanStack Query key factories
    └── routes.ts                   ← All frontend route paths
```

---
