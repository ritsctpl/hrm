# Smart Table Column Filters — Design

**Date:** 2026-06-19
**Status:** Approved (pending spec review)
**Branch:** feature/design-ui-v2-integration

## Goal

Add consistent, per-column header filters ("smart table column filters") to the
main listing tables across the Expense, Leave, Travel, Employee, Organization,
Assets, and Access Control modules. A user clicks the filter icon on a column
header and gets a filter UI appropriate to that column's data type.

## Scope reality (important)

The request assumes every primary listing view in these modules is a table. It
isn't. Across the 7 modules the listing views split in two:

**Genuine Ant Design `<Table>`** — these get column filters in this effort:

| Module | Tables |
|---|---|
| Travel | `TravelListTable`, `ApproverInboxTable` |
| Employee | `EmployeeTable` (server-paginated — see note) |
| Organization | `BusinessUnitTable` |
| Access Control | `RoleTable`, `UserAssignmentTable` |
| Expense | `SupervisorInboxTable` |
| Leave | `BalanceSummaryTable`, `LedgerHistoryTable`, `PolicySettingsTable` |

**Custom card-lists / grouped layouts** — NOT tables, **out of scope** for this
effort (they keep their existing search/filter toolbars):

- Expense → `ExpenseListTable` (card list)
- Leave → `LeaveRequestsTable`, `ApproverInboxTable`, `CompOffInboxTable`, `HrGlobalQueueTable` (custom lists)
- Organization → `LocationTable` (grouped `Collapse` panels)
- Assets → entire module is a master-detail **card list** (`AssetMasterList`); no list table exists

Converting the card-lists into tables is a separate, larger redesign and is
explicitly **not** part of this work. This is the agreed decision ("tables only
for now").

## Decisions (locked)

1. **Filter style:** Auto per column type — the helper picks the UI from the
   column's data type.
2. **Implementation:** One shared reusable helper; tables spread it onto the
   columns they want filterable. No per-column hand-rolled duplication.
3. **Scope:** Main listing tables only, and only those that are real Ant
   `<Table>` components (table above).
4. **Card-lists:** Left as-is for now.
5. **EmployeeTable:** Apply the same client-side filters over the currently
   loaded page, with a short helper text noting filters apply to loaded rows.

## The shared helper

New file: `src/components/tableColumnFilters.tsx`

It exports factory functions that return the Ant Design `ColumnType` filter
props (`filterDropdown` / `filterIcon` / `onFilter`, or `filters` / `onFilter`).
A column opts in by spreading the result:

```ts
// text search dropdown (substring, case-insensitive) on a string field
{ title: 'Purpose', dataIndex: 'purpose', ...textSearchFilter<TravelRequest>('purpose') }

// categorical checkbox list, options derived from the data
{ title: 'Status', dataIndex: 'status',
  ...categoryFilter<TravelRequest>('status', rows, { labelMap: STATUS_LABELS }) }

// date-range filter on a YYYY-MM-DD / ISO field
{ title: 'Submitted', dataIndex: 'submittedOn', ...dateRangeFilter<TravelRequest>('submittedOn') }
```

### Exported functions

- `textSearchFilter<T>(dataIndex, opts?)`
  - Returns a `filterDropdown` with a search `Input`, Search + Reset buttons,
    and a highlighted filter icon when active.
  - `onFilter`: case-insensitive substring match against
    `String(record[dataIndex])`. An optional `getText?: (record) => string`
    handles computed/nested fields (e.g. a name built from parts).

- `categoryFilter<T>(dataIndex, rows, opts?)`
  - Builds the `filters` list from the **distinct values** present in `rows`
    (deduped, sorted). `opts.labelMap` maps raw values to display labels;
    `opts.options` lets a caller pass a fixed list instead of deriving it.
  - `onFilter`: exact equality (`record[dataIndex] === value`), multi-select.
  - `opts.getValue?` supports computed fields.

- `dateRangeFilter<T>(dataIndex, opts?)`
  - Returns a `filterDropdown` with an Ant `DatePicker.RangePicker` + Reset.
  - `onFilter`: inclusive range test using `dayjs` against the row's date value.

All three set a consistent active-state filter icon (highlighted when a filter
is applied) so the "smart" affordance looks identical everywhere.

### Why a factory (not a wrapper component)

Ant Design already renders the per-column filter UI from `ColumnType` props.
The cleanest, lowest-risk integration is to **generate those props**, not wrap
`<Table>`. This keeps each table's existing structure, sorting, row click,
pagination, and `scroll`/`sticky` behavior untouched — we only add filter props
to chosen columns. It also matches the pattern `ProjectTable` already uses
(inline `filters` + `onFilter`), which we are standardizing.

## Per-column type mapping (guidance)

For each table, columns are classified and given a filter:

- **Free text** (name, code, email, purpose, requestId, role name) →
  `textSearchFilter`.
- **Categorical** (status, type, department, designation, scope, business unit) →
  `categoryFilter` with a `labelMap` where one already exists (e.g. status label
  maps already present in each module).
- **Date** (submitted date, start/end, effective date) → `dateRangeFilter`.
- **Action / avatar / progress / non-data columns** → no filter.

Sorting that already exists on a column stays; a column can have both a `sorter`
and a filter.

## EmployeeTable specifics

`EmployeeTable` uses server-side pagination (`totalCount`, `currentPage`,
`onPageChange`). Ant's column filters are client-side, so they filter only the
rows currently loaded. We:

1. Apply the same helper-generated filters.
2. Add a small muted helper line near the table ("Column filters apply to the
   loaded page") so the behavior isn't misleading.

No backend change is made in this effort.

## Components / files touched

- **New:** `src/components/tableColumnFilters.tsx` (the helper + its small
  presentational pieces).
- **Edited (add filter props to columns):**
  - `hrmTravel/.../TravelListTable.tsx`, `ApproverInboxTable.tsx`
  - `hrmEmployee/.../EmployeeTable.tsx` (+ helper text)
  - `hrmOrganization/.../BusinessUnitTable.tsx`
  - `hrmAccess/.../RoleTable.tsx`, `UserAssignmentTable.tsx`
  - `hrmExpense/.../SupervisorInboxTable.tsx`
  - `hrmLeave/.../BalanceSummaryTable.tsx`, `LedgerHistoryTable.tsx`, `PolicySettingsTable.tsx`

## Interaction with existing toolbar filters

Several tables already have a search bar / status dropdown in a toolbar that
filters the `dataSource` before it reaches the table (e.g. Travel, Project).
Column filters compose with these: the toolbar narrows the dataset, column
filters narrow further within the table. No toolbar is removed. Where a column
filter would exactly duplicate a toolbar control, we still add the column filter
(consistency) and leave the toolbar as-is.

## Error handling / edge cases

- Empty data → `categoryFilter` yields an empty options list; the filter icon
  still renders but the dropdown shows no options (Ant default).
- Null/undefined cell values → coerced to `''` for text match; excluded from
  category options; treated as "no date" (filtered out) for range filters.
- Computed/nested columns (no plain `dataIndex`) → use the `getText` / `getValue`
  escape hatch.

## Testing

- Manual verification per table: filter icon appears on intended columns; text
  search narrows rows; category checkboxes narrow rows; date range narrows rows;
  Reset clears; combining two column filters AND-composes; sorting still works;
  row click still works.
- TypeScript build passes (`npm run build` / `next lint`).
- No unit-test harness for these components currently exists; verification is
  manual + typecheck, consistent with the rest of the codebase.

## Out of scope

- Converting any card-list view into a table.
- Server-side filtering for `EmployeeTable` (or any table).
- Persisting filter state across navigation.
- Global "filter all columns" search box (column-level only).
