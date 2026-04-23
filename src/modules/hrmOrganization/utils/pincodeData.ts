/**
 * Lazy-loaded pincode lookup utility for India.
 *
 * The dataset is imported dynamically on first use so the ~1-2 MB JSON does
 * not inflate the initial bundle — only the address section pays the cost,
 * and only once per session. A prefix index built on first load keeps the
 * typeahead path O(1) for lookups.
 *
 * NOTE: The committed data file is currently a fixture covering major
 * metros. Replace with the full India Post dataset before merging to main.
 */

export interface PincodeEntry {
  pincode: string;
  city: string;
  state: string;
}

let cache: PincodeEntry[] | null = null;
let prefixIndex: Map<string, PincodeEntry[]> | null = null;
let loadPromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (cache) return;
  if (loadPromise) return loadPromise;
  loadPromise = import('../data/pincodes-india.json')
    .then((mod) => {
      const rows = ((mod as { default: PincodeEntry[] }).default || []) as PincodeEntry[];
      cache = rows;
      const idx = new Map<string, PincodeEntry[]>();
      for (const row of rows) {
        // Index every prefix from length 3 to full pincode length.
        for (let i = 3; i <= row.pincode.length; i++) {
          const pfx = row.pincode.slice(0, i);
          const list = idx.get(pfx) || [];
          list.push(row);
          idx.set(pfx, list);
        }
      }
      prefixIndex = idx;
    })
    .catch((err) => {
      // Swallow — caller will simply get empty lookup results and fall back
      // to manual entry + the existing India Post API verification.
      // eslint-disable-next-line no-console
      console.warn('pincodeData: failed to load dataset', err);
      cache = [];
      prefixIndex = new Map();
    });
  return loadPromise;
}

export async function searchPincodesByPrefix(prefix: string, limit = 20): Promise<PincodeEntry[]> {
  if (!/^\d+$/.test(prefix) || prefix.length < 3) return [];
  await ensureLoaded();
  const list = prefixIndex?.get(prefix) || [];
  return list.slice(0, limit);
}

export async function getPincodesForCity(cityName: string): Promise<PincodeEntry[]> {
  if (!cityName) return [];
  await ensureLoaded();
  const needle = cityName.trim().toLowerCase();
  return (cache || []).filter((e) => e.city.toLowerCase() === needle);
}
