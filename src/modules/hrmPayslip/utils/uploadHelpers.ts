import type {
  PayslipParseStatus,
  PayslipUploadBatch,
} from "../types/domain.types";

/**
 * Files per upload request. max-request-size is 50MB and a full month is ~200 payslips, so the
 * browser posts in slices rather than betting the whole batch on one request that may be refused.
 */
export const UPLOAD_CHUNK_SIZE = 25;

/**
 * Files one upload batch may hold. The server refuses a chunk that would take a batch past this
 * with a 400 (PAYSLIP_013); the browser refuses the selection first so HR hears it up front.
 */
export const MAX_FILES_PER_BATCH = 200;

/** True when adding `adding` files to a selection of `current` would pass MAX_FILES_PER_BATCH. */
export function exceedsBatchLimit(
  current: number,
  adding: number,
  max: number = MAX_FILES_PER_BATCH
): boolean {
  return current + adding > max;
}

/**
 * Default byte ceiling per chunk. A 25-file chunk of legal (up to 10MB) files can reach 250MB, well
 * past max-request-size (50MB), so chunking by count alone is not enough — a chunk must also close
 * when the running byte total would tip it over this limit.
 */
const DEFAULT_MAX_CHUNK_BYTES = 45 * 1024 * 1024;

/** Statuses that produced a payslip row. Mirrors PayslipParseStatus.stored() on the backend. */
const STORED: ReadonlySet<PayslipParseStatus> = new Set<PayslipParseStatus>([
  "OK",
  "REPLACED_EXISTING",
  "EMPLOYEE_NO_EMAIL",
]);

/** Statuses Phase B may send. EMPLOYEE_NO_EMAIL is stored but has no recipient. */
const MAILABLE: ReadonlySet<PayslipParseStatus> = new Set<PayslipParseStatus>([
  "OK",
  "REPLACED_EXISTING",
]);

export function isStoredStatus(status: PayslipParseStatus): boolean {
  return STORED.has(status);
}

/**
 * Splits a file selection into upload requests. A new chunk starts whenever adding the next file
 * would push the current chunk over `size` files or `maxBytes` bytes — whichever limit is hit
 * first. Every chunk holds at least one file, even one that alone exceeds `maxBytes`, so a single
 * oversized file is never silently dropped here (Task 10 rejects it before it reaches chunking).
 */
export function chunkFiles(
  files: File[],
  size: number = UPLOAD_CHUNK_SIZE,
  maxBytes: number = DEFAULT_MAX_CHUNK_BYTES
): File[][] {
  const chunks: File[][] = [];
  let current: File[] = [];
  let currentBytes = 0;

  for (const f of files) {
    const wouldExceedCount = current.length + 1 > size;
    const wouldExceedBytes = current.length > 0 && currentBytes + f.size > maxBytes;
    if (current.length > 0 && (wouldExceedCount || wouldExceedBytes)) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(f);
    currentBytes += f.size;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Which files reached the server when the chunk at `failedIndex` failed. Chunks are sent in order,
 * so everything before it was sent and everything from it on was not. `null` means no chunk failed.
 * The unsent part is what the upload panel keeps selected for the retry — dropping it would lose
 * files HR believes were uploaded.
 */
export function splitAtFailedChunk<T>(
  chunks: T[][],
  failedIndex: number | null
): { sent: T[]; unsent: T[] } {
  const cut = failedIndex === null ? chunks.length : Math.max(0, failedIndex);
  return { sent: chunks.slice(0, cut).flat(), unsent: chunks.slice(cut).flat() };
}

export interface UploadSummary {
  total: number;
  stored: number;
  skipped: number;
  mailable: number;
  byStatus: Record<PayslipParseStatus, number>;
}

export function summarise(batch: PayslipUploadBatch): UploadSummary {
  const items = batch.items ?? [];
  const byStatus: Record<PayslipParseStatus, number> = {
    OK: 0,
    REPLACED_EXISTING: 0,
    EMPLOYEE_NO_EMAIL: 0,
    BAD_FILENAME: 0,
    EMPLOYEE_NOT_FOUND: 0,
    NOT_A_PDF: 0,
    STORAGE_FAILED: 0,
  };

  items.forEach((i) => {
    byStatus[i.parseStatus] = (byStatus[i.parseStatus] ?? 0) + 1;
  });

  const stored = items.filter((i) => STORED.has(i.parseStatus)).length;

  return {
    total: items.length,
    stored,
    skipped: items.length - stored,
    mailable: items.filter((i) => MAILABLE.has(i.parseStatus)).length,
    byStatus,
  };
}

const CSV_HEADER = "File name,Problem,Details,Employee code,Period";

/**
 * One CSV cell. A leading = + - @ is prefixed with a single quote so a spreadsheet shows the value
 * as text instead of running it as a formula (file names are chosen by whoever made the files).
 * A comma, double quote, CR or LF forces quoting.
 */
function cell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The rows HR has to act on — nothing else. A correction list padded with successes is a list
 * nobody reads.
 */
export function errorRowsToCsv(batch: PayslipUploadBatch): string {
  const rows = (batch.items ?? [])
    .filter((i) => !STORED.has(i.parseStatus))
    .map((i) =>
      [
        cell(i.fileName),
        cell(i.parseStatus),
        cell(i.reason),
        cell(i.employeeCode),
        cell(
          i.payrollYear && i.payrollMonth ? `${i.payrollMonth}/${i.payrollYear}` : ""
        ),
      ].join(",")
    );

  return [CSV_HEADER, ...rows].join("\n");
}
