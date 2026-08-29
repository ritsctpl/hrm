import { test, expect } from '@playwright/test';

// The store reads the site from a cookie and antd's `message` needs a DOM, so give
// the module the two globals it looks for before it runs. Both must exist before
// the store is imported by any test body.
(globalThis as any).window = (globalThis as any).window ?? {};
(globalThis as any).document = (globalThis as any).document ?? { cookie: 'site=RITS' };

import { useHrmEmployeeStore } from '../../src/modules/hrmEmployee/stores/hrmEmployeeStore';
import { HrmEmployeeService } from '../../src/modules/hrmEmployee/services/hrmEmployeeService';

/**
 * The employee directory emptied itself when you searched, scrolled the tile view and
 * then pressed Refresh.
 *
 * Refresh calls `fetchDirectory()` with no `append`, which replaces the list — but it
 * replaced it with whatever slice `currentPage` happened to point at, and the tile
 * view's infinite scroll had been walking `currentPage` forward. So Refresh threw away
 * every page but one; the grid was then short enough for the scroll sentinel to fire
 * again, and because `loadMoreEmployees` only stopped once `employees.length` reached
 * `totalCount`, it kept incrementing `currentPage` over pages the server no longer had.
 * The next Refresh asked for a page past the end and the directory came back empty.
 *
 * These two tests pin the halves of that: a fresh load starts at page one, and
 * load-more gives up once the server stops handing back new rows.
 */

test.describe.configure({ mode: 'serial' });

const PAGE_SIZE = 20;

/** Records the page each request asked for, so the tests can assert on the slice. */
let requestedPages: number[] = [];

/**
 * Stands in for `/employee/directory`: 0-based `page`, and it reports `totalCount`
 * separately from what it serves so a test can make the two disagree.
 */
function stubDirectory(rows: number, reportedTotal = rows) {
  const all = Array.from({ length: rows }, (_, i) => ({
    handle: `H${i + 1}`,
    employeeCode: `EMP${i + 1}`,
    fullName: `Emp ${i + 1}`,
    isActive: true,
  }));

  (HrmEmployeeService as any).fetchDirectory = async (req: { page?: number; size?: number }) => {
    const page = req.page ?? 0;
    const size = req.size ?? PAGE_SIZE;
    requestedPages.push(page);
    const from = page * size;
    return {
      employees: from < all.length ? all.slice(from, Math.min(from + size, all.length)) : [],
      totalCount: reportedTotal,
    };
  };
}

const directory = () => useHrmEmployeeStore.getState().directory;
const names = () => directory().employees.map((e) => e.fullName);

test.beforeEach(() => {
  useHrmEmployeeStore.getState().reset();
  requestedPages = [];
});

test('Refresh reloads the directory from the first page', async () => {
  stubDirectory(45);
  const store = () => useHrmEmployeeStore.getState();

  await store().fetchDirectory();
  await store().loadMoreEmployees();
  await store().loadMoreEmployees();
  expect(directory().employees).toHaveLength(45);
  expect(directory().currentPage).toBe(3);

  requestedPages = [];
  await store().refreshDirectory(); // the Refresh button

  expect(requestedPages).toEqual([0]);
  expect(directory().currentPage).toBe(1);
  expect(names().slice(0, 2)).toEqual(['Emp 1', 'Emp 2']);
  expect(directory().employees).toHaveLength(PAGE_SIZE);
});

test('load-more stops once a page brings back nothing new', async () => {
  // The server serves 45 rows but claims 100, so `employees.length >= totalCount`
  // — the only brake load-more had — is never satisfied.
  stubDirectory(45, 100);
  const store = () => useHrmEmployeeStore.getState();

  await store().fetchDirectory();
  await store().loadMoreEmployees(); // 40
  await store().loadMoreEmployees(); // 45
  await store().loadMoreEmployees(); // server has nothing left

  const pageAtExhaustion = directory().currentPage;
  const requestsAtExhaustion = requestedPages.length;

  await store().loadMoreEmployees();
  await store().loadMoreEmployees();

  expect(directory().currentPage).toBe(pageAtExhaustion);
  expect(requestedPages).toHaveLength(requestsAtExhaustion);
  expect(directory().employees).toHaveLength(45);
});

test('paging to a table page still fetches that page, not the first', async () => {
  stubDirectory(45);
  const store = () => useHrmEmployeeStore.getState();

  await store().fetchDirectory();
  requestedPages = [];
  store().setPage(3);
  await new Promise((r) => setTimeout(r, 0));

  expect(requestedPages).toEqual([2]);
  expect(names()).toEqual(['Emp 41', 'Emp 42', 'Emp 43', 'Emp 44', 'Emp 45']);
});
