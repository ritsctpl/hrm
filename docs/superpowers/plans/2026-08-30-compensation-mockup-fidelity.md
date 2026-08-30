# Compensation Studio — Mockup Layout-Fidelity Pass

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bring the built Pay Components, Salary Structures, Assignment, Approvals and Overview screens up to the approved HTML mockup's table-centric layout, keeping every functional piece already shipped (row actions, 100% tally, CTC-only override, reject guard).

**Architecture:** The redesign reused the existing master-detail/builder panes. This pass replaces the two list-based panes with the mockup's stat-cards + table layouts (form/builder move behind New/Edit in a Drawer), and adds three smaller visual elements (assignment stacked bar, approval old→new delta, overview pipeline counts). No API, store, or domain-type changes — all data is already loaded; new columns are derived client-side.

**Tech Stack:** Next.js 15 / React 19 / AntD 5 / Zustand / TS, CSS Modules, `var(--comp-*)`/`var(--hrm-*)` tokens. Dev server 8687 hot-reloads `/home/rits/hrm`.

**Spec:** the approved mockup (Compensation Studio artifact) + the four user feedback items. No separate spec file; this plan is the authority.

## Global Constraints

- **Reuse, do not rebuild.** Keep `PayComponentForm`, `SalaryStructureBuilder`, `PayComponentListRow` actions, `StructureComponentsTable` (tally), `EmployeeCompensationForm`, `ApprovalInbox` logic. Only the *layout wrapper* changes.
- **No API / store / domain-type changes.** Everything is derived from `payComponents`, `salaryStructures`, `pendingApprovals`, `compensationHistory` already in the store, plus existing service calls (`getCompensationHistory`).
- **Access gating preserved:** `<Can I="add">` / `<Can I="edit">` exactly where they are today.
- **Theme:** both light and dark; colors only via `--comp-*`/`--hrm-*` tokens, never hardcoded hex.
- **Salary-structure calc lives on the pay_component MASTER**, not the structure line — any "Calculation"/formula column MUST resolve via the master (`payComponents` by `componentCode`).
- **Employees-per-structure has no endpoint** — render `—` (em dash), never a fabricated count.
- Each task ends `tsc` clean (bar the 2 pre-existing pdfmake errors) + its `compensation-*.spec` green + browser-verified on 8687 light+dark.

---

### Task 1: Pay Components — stat cards + components table

**Files:**
- Create: `src/modules/hrmCompensation/utils/componentCalcLabel.ts`
- Create: `src/modules/hrmCompensation/components/organisms/PayComponentsTable.tsx`
- Modify: `src/modules/hrmCompensation/components/templates/CompensationTabLayout.tsx` (the `components` case)
- Modify: `src/modules/hrmCompensation/styles/Compensation.module.css` (stat-card + table styles if needed; reuse `--comp-*`)
- Test: `tests/unit/compensation-calc-label.spec.ts`

**Interfaces:**
- Consumes: `PayComponent` (`domain.types`), store `payComponents`, `salaryStructures`, `selectComponent`, `fetchPayComponents`, `deletePayComponent`, `hardDeletePayComponent`; `PayComponentForm`; `<Can>`.
- Produces: `describeCalculation(c: PayComponent): string`; `countStructureUsage(code: string, structures: SalaryStructure[]): number`; `isStatutory(c: PayComponent): boolean`.

**Target (mockup):** three stat cards — **Earnings** (`componentType==='EARNING'`), **Deductions** (`componentType==='DEDUCTION'`), **Statutory** (`isStatutory`) — then ONE "All components" AntD `Table`: columns **Component** (name + code muted subline), **Type** (`CalcMethodBadge`/type chip), **Calculation** (`describeCalculation`), **Used in** (`countStructureUsage` + " structures"), **Actions** (Edit → opens form Drawer; Deactivate Popconfirm; Delete Popconfirm — reuse the exact handlers/guards from `PayComponentListRow`). Search box filters the table. "New" and row "Edit" open `PayComponentForm` in a right AntD `Drawer` (width ~520); on save/close the drawer closes and the table refetches. Keep the `X of Y components` footer.

- [ ] **Step 1: Write the failing test** — `tests/unit/compensation-calc-label.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { describeCalculation, isStatutory, countStructureUsage } from '../../src/modules/hrmCompensation/utils/componentCalcLabel';

const base = { componentCode: 'X', componentName: 'X', componentType: 'EARNING', subType: 'FIXED', statutoryLinkage: 'NONE' } as any;

test('FIXED shows rupee amount', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'FIXED', fixedAmount: 5000 })).toContain('5,000');
});
test('PERCENTAGE of base component', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'PERCENTAGE', percentage: 40, baseComponentCode: 'BASIC' })).toBe('40% of BASIC');
});
test('PERCENT_OF_CTC', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'PERCENT_OF_CTC', percentage: 40 })).toBe('40% of CTC');
});
test('BALANCE', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'BALANCE' })).toBe('Balance');
});
test('FORMULA falls back to the formula text', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'FORMULA', formula: 'BASIC*0.1' })).toBe('BASIC*0.1');
});
test('isStatutory true when subType STATUTORY or linkage set', () => {
  expect(isStatutory({ ...base, subType: 'STATUTORY' })).toBe(true);
  expect(isStatutory({ ...base, statutoryLinkage: 'PF' })).toBe(true);
  expect(isStatutory(base)).toBe(false);
});
test('countStructureUsage counts structures containing the code', () => {
  const structs = [{ components: [{ componentCode: 'BASIC' }] }, { components: [{ componentCode: 'HRA' }] }] as any;
  expect(countStructureUsage('BASIC', structs)).toBe(1);
  expect(countStructureUsage('ZZZ', structs)).toBe(0);
});
```

- [ ] **Step 2: Run it, verify it fails** — `cd /home/rits/hrm && npx playwright test tests/unit/compensation-calc-label.spec.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `componentCalcLabel.ts`**

```ts
import type { PayComponent, SalaryStructure } from '../types/domain.types';

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

export function describeCalculation(c: PayComponent): string {
  switch (c.calculationMethod) {
    case 'FIXED':
      return c.fixedAmount != null ? `₹${inr(c.fixedAmount)}` : 'Fixed';
    case 'PERCENTAGE':
      return c.percentage != null
        ? `${c.percentage}% of ${c.baseComponentCode ?? 'base'}`
        : 'Percentage';
    case 'PERCENT_OF_CTC':
      return c.percentage != null ? `${c.percentage}% of CTC` : '% of CTC';
    case 'BALANCE':
      return 'Balance';
    case 'FORMULA':
      return c.formula && c.formula.trim() ? c.formula : 'Formula';
    default:
      return String(c.calculationMethod ?? '—');
  }
}

export function isStatutory(c: PayComponent): boolean {
  return c.subType === 'STATUTORY' || (c.statutoryLinkage != null && c.statutoryLinkage !== 'NONE');
}

export function countStructureUsage(code: string, structures: SalaryStructure[]): number {
  return structures.filter((s) => (s.components ?? []).some((l) => l.componentCode === code)).length;
}
```

- [ ] **Step 4: Run test, verify PASS.**

- [ ] **Step 5: Build `PayComponentsTable.tsx`** — the mockup layout above. AntD `Table` `rowKey="componentCode"`, `size="small"`, `pagination={{ pageSize: 12, hideOnSinglePage: true }}`. Stat cards reuse `styles.statCard`/tone classes from Overview (or a compact variant). "Actions" column renders the three buttons with the SAME `Popconfirm` copy and handlers as `PayComponentListRow` (Deactivate: "Deactivate this component? …no undo"; Delete: danger). Wrap Add/Edit/Deactivate/Delete in `<Can I="add">`/`<Can I="edit">` as today. Drawer holds `PayComponentForm`; open on New (selectComponent(null)) and row Edit (selectComponent(row)); close after the form's save (subscribe to selectedComponent turning null after a successful create is unreliable — instead give the Drawer its own `open` state, and have Edit/New set it true; wire the form's existing onSaved/onCancel if present, else close on the store's componentsLoading falling edge — check the form's props first).

- [ ] **Step 6: Wire into `CompensationTabLayout`** — replace the `components` case's master-detail grid with `<PayComponentsTable />` (full width). Leave `PayComponentList`/`PayComponentForm` files in place (form reused inside the drawer).

- [ ] **Step 7: `tsc --noEmit`** clean (bar pre-existing pdfmake). Browser-verify on http://192.168.147.129:8687/hrm/rits/hrm_compensation_app → Pay Components step: 3 stat cards with real counts, table with all columns, New opens drawer, Edit opens drawer prefilled, Deactivate/Delete confirm. Screenshot light + dark.

- [ ] **Step 8: Commit** `feat(comp): pay components stat-cards + table (mockup fidelity)`.

---

### Task 2: Salary Structures — by-grade table + detail with formulas & tally

**Files:**
- Create: `src/modules/hrmCompensation/components/organisms/StructuresByGradeTable.tsx`
- Create: `src/modules/hrmCompensation/components/organisms/StructureDetailPanel.tsx`
- Modify: `src/modules/hrmCompensation/components/templates/CompensationTabLayout.tsx` (the `structures` case)
- Modify: `src/modules/hrmCompensation/styles/Compensation.module.css` (detail/table styles if needed)
- Test: `tests/unit/compensation-structure-rows.spec.ts`

**Interfaces:**
- Consumes: `SalaryStructure`/`SalaryStructureComponent` (`domain.types`), store `salaryStructures`, `selectedStructure`, `selectStructure`, `fetchSalaryStructures`, `payComponents`; `SalaryStructureBuilder`; `StructureComponentsTable` (tally bar); `describeCalculation` (Task 1); `<Can>`.
- Produces: `resolveStructureLines(structure, payComponents): { code, name, type, calc }[]` (resolves each line's display via the master).

**Target (mockup):** left = "Structures by grade" AntD `Table` (columns **Structure** name + code subline, **Grade** (`applicableGrade`), **Components** (`components.length`), **Employees** (`—`), **Status** (Active/Inactive tag)), rows sortable/grouped by grade (sort by `applicableGrade` then name); clicking a row `selectStructure(row)`. Right = `StructureDetailPanel`: the selected structure's component rows each showing name + resolved calculation (`describeCalculation` on the master), followed by the existing tally bar (`StructureComponentsTable` or `validateEarningsTally`). "New" and an "Edit structure" button open `SalaryStructureBuilder` in a Drawer (width ~720). When nothing is selected, the detail shows an Empty hint. Keep the `X of Y structures` footer under the table.

- [ ] **Step 1: Write the failing test** — `tests/unit/compensation-structure-rows.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { resolveStructureLines } from '../../src/modules/hrmCompensation/components/organisms/StructureDetailPanel';

const masters = [
  { componentCode: 'BASIC', componentName: 'Basic', componentType: 'EARNING', calculationMethod: 'PERCENT_OF_CTC', percentage: 40, statutoryLinkage: 'NONE', subType: 'FIXED' },
  { componentCode: 'HRA', componentName: 'HRA', componentType: 'EARNING', calculationMethod: 'PERCENTAGE', percentage: 50, baseComponentCode: 'BASIC', statutoryLinkage: 'NONE', subType: 'FIXED' },
] as any;
const structure = { components: [{ componentCode: 'BASIC' }, { componentCode: 'HRA' }, { componentCode: 'GHOST' }] } as any;

test('resolves line name+calc via master', () => {
  const rows = resolveStructureLines(structure, masters);
  expect(rows[0]).toMatchObject({ code: 'BASIC', name: 'Basic', calc: '40% of CTC' });
  expect(rows[1]).toMatchObject({ code: 'HRA', name: 'HRA', calc: '50% of BASIC' });
});
test('unknown code degrades gracefully', () => {
  const rows = resolveStructureLines(structure, masters);
  expect(rows[2]).toMatchObject({ code: 'GHOST', name: 'GHOST', calc: '—' });
});
```

- [ ] **Step 2: Run it, verify it fails.**

- [ ] **Step 3: Implement `StructureDetailPanel.tsx`** exporting `resolveStructureLines` + the panel. `resolveStructureLines` maps each structure line to the master by `componentCode`; when found → `{ code, name: master.componentName, type: master.componentType, calc: describeCalculation(master) }`; when absent → `{ code, name: code, type: 'EARNING', calc: '—' }`. Panel renders the rows + tally (reuse `StructureComponentsTable`/`validateEarningsTally`; if that component needs the builder's draft state, render a read-only tally computed from `resolveStructureLines` earnings via `validateEarningsTally`).

- [ ] **Step 4: Run test, verify PASS.**

- [ ] **Step 5: Build `StructuresByGradeTable.tsx`** — table above; default sort `applicableGrade` asc then `structureName`. Row selected state highlights `selectedStructure`. New button `<Can I="add">`; refresh button.

- [ ] **Step 6: Wire into `CompensationTabLayout`** — the `structures` case becomes a two-column grid: `<StructuresByGradeTable />` left, `<StructureDetailPanel />` right; "Edit structure" in the detail opens `SalaryStructureBuilder` in a Drawer; New opens the empty builder in the Drawer. Keep `SalaryStructureList` file in place.

- [ ] **Step 7: `tsc` clean; browser-verify** structures step: by-grade table with Grade/Components/Employees(—)/Status columns, selecting a row shows formula rows + tally, New/Edit open the builder drawer, save persists. Screenshot light + dark.

- [ ] **Step 8: Commit** `feat(comp): salary structures by-grade table + formula detail (mockup fidelity)`.

---

### Task 3: Three visual completions — assignment bar, approval delta, overview counts

**Files:**
- Create: `src/modules/hrmCompensation/components/molecules/CtcCompositionBar.tsx`
- Modify: `src/modules/hrmCompensation/components/organisms/CompensationPreview.tsx` (add the bar above earnings)
- Modify: `src/modules/hrmCompensation/components/organisms/ApprovalInbox.tsx` (old→new CTC + % delta)
- Modify: `src/modules/hrmCompensation/components/organisms/CompensationOverview.tsx` (pipeline node counts)
- Modify: `src/modules/hrmCompensation/styles/Compensation.module.css`
- Test: `tests/unit/compensation-visuals.spec.ts`

**Interfaces:**
- Consumes: `CompensationComponent`/`EmployeeCompensationResponse` (`domain.types`), store `getCompensationHistory` (service) for prior revision, `payComponents`/`salaryStructures`/`pendingApprovals` counts.
- Produces: `buildCtcSegments(components, grossEarnings): { code, name, pct, amount }[]`; `computeDelta(prevCtc, newCtc): { deltaPct: number | null, direction: 'up'|'down'|'flat' }`.

**Target (mockup):**
1. **Assignment stacked bar** — a horizontal 100%-width bar segmented per EARNING component (width = `derivedAmount/grossEarnings`), each segment a `--comp-*` hue, with a legend (name + amount + %). Placed above the earnings rows in `CompensationPreview`.
2. **Approval delta** — each approval card shows previous CTC → new CTC with a `VariancePill` (%▲/▼). Fetch the employee's history once per card (`getCompensationHistory(employeeId)`), find the highest APPROVED revision below `item.revisionNumber`; if none, show only the new CTC (no pill). Reuse existing `VariancePill` atom.
3. **Overview pipeline counts** — each `PIPELINE` node shows a count badge: components → `payComponents.length`, structures → `salaryStructures.length`, approvals → `pendingApprovals.length`; assignment/revision have no cheap count → no badge.

- [ ] **Step 1: Write the failing test** — `tests/unit/compensation-visuals.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { buildCtcSegments, computeDelta } from '../../src/modules/hrmCompensation/components/molecules/CtcCompositionBar';

test('segments are pct of gross, earnings only', () => {
  const comps = [
    { componentCode: 'BASIC', componentName: 'Basic', componentType: 'EARNING', derivedAmount: 60 },
    { componentCode: 'HRA', componentName: 'HRA', componentType: 'EARNING', derivedAmount: 40 },
    { componentCode: 'PF', componentName: 'PF', componentType: 'DEDUCTION', derivedAmount: 10 },
  ] as any;
  const segs = buildCtcSegments(comps, 100);
  expect(segs.map((s) => s.code)).toEqual(['BASIC', 'HRA']);
  expect(segs[0].pct).toBe(60);
});
test('computeDelta up/down/flat/none', () => {
  expect(computeDelta(100, 120)).toMatchObject({ deltaPct: 20, direction: 'up' });
  expect(computeDelta(120, 90)).toMatchObject({ direction: 'down' });
  expect(computeDelta(100, 100)).toMatchObject({ deltaPct: 0, direction: 'flat' });
  expect(computeDelta(null as any, 100)).toMatchObject({ deltaPct: null });
});
```

- [ ] **Step 2: Run it, verify it fails.**

- [ ] **Step 3: Implement `CtcCompositionBar.tsx`** exporting `buildCtcSegments`, `computeDelta`, and the bar component. `buildCtcSegments`: earnings only, `pct = gross ? round(amount/gross*100) : 0`. `computeDelta`: `prev==null||prev<=0 → {deltaPct:null,direction:'flat'}`; else `deltaPct = round((new-prev)/prev*100, 1)`, direction by sign. Bar: flex row of segments (`flexBasis: pct%`), cycling `--comp-seg-1..6` token colors (add tokens to hrm-tokens.css if absent), + legend list.

- [ ] **Step 4: Run test, verify PASS.**

- [ ] **Step 5: Assignment** — render `<CtcCompositionBar components={data.components} gross={data.grossEarnings} />` above the Earnings section in `CompensationPreview`.

- [ ] **Step 6: Approvals** — in `ApprovalInbox`, on mount/refresh build a `prevCtcByHandle` map: for each pending item call `getCompensationHistory(item.employeeId)` (dedupe by employeeId), pick max APPROVED revision `< item.revisionNumber`, store its `annualCTC`. Render prev→new with `VariancePill` from `computeDelta`. No prior → show only new CTC. Guard all calls (try/catch, tolerant of empty history).

- [ ] **Step 7: Overview** — add a count badge span to each `PIPELINE` node that has one.

- [ ] **Step 8: `tsc` clean; browser-verify** assignment bar renders + sums visually to gross; an approval card shows a % pill when a prior revision exists; overview nodes show counts. Screenshot light + dark.

- [ ] **Step 9: Commit** `feat(comp): assignment CTC bar + approval delta + overview counts (mockup fidelity)`.

---

## Self-Review

- **Coverage:** Pay Components stat-cards+table (T1), Salary Structures by-grade table + formula detail (T2), assignment bar + approval delta + overview counts (T3) — every divergence named to the user is a task.
- **No placeholders:** all utils have full code + tests; layouts describe exact columns.
- **Type consistency:** `describeCalculation` (T1) reused by T2's `resolveStructureLines`; `CalcMethod` union already widened to include PERCENT_OF_CTC/BALANCE. `Employees` column is `—` by constraint (no endpoint). Approval delta uses the existing `VariancePill` + `getCompensationHistory`.
