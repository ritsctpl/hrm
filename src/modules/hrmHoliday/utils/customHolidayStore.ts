/**
 * Custom holiday "library" — augments the read-only `date-holidays` package.
 *
 * When a user adds a holiday that isn't a built-in default for the selected
 * country/date, we remember it here so it surfaces as a suggestion next time
 * (keyed by country + MM-DD). Persisted in localStorage.
 *
 * NOTE: this is per-browser. For an org-wide shared catalog, a backend
 * endpoint would be needed — see holiday-approval-authority-contract.md style.
 */

const KEY = 'hrm:holidayCustomCatalog';

export interface CustomHoliday {
  /** Month-day "MM-DD" so it applies across years. */
  md: string;
  name: string;
  category: string;
  optional: boolean;
}

function readAll(): Record<string, CustomHoliday[]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}') as Record<string, CustomHoliday[]>;
  } catch {
    return {};
  }
}

/** Custom holidays saved for a country. */
export function getCustomHolidays(country: string): CustomHoliday[] {
  return readAll()[country] ?? [];
}

/** Persist a custom holiday for a country (deduped by md + name). */
export function addCustomHoliday(country: string, entry: CustomHoliday): void {
  if (typeof window === 'undefined') return;
  const all = readAll();
  const list = all[country] ?? [];
  const exists = list.some(
    (e) => e.md === entry.md && e.name.trim().toLowerCase() === entry.name.trim().toLowerCase()
  );
  if (!exists) {
    all[country] = [...list, entry];
    window.localStorage.setItem(KEY, JSON.stringify(all));
  }
}
