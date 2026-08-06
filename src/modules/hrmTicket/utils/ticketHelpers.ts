import type { AttachmentPayload } from '../types/api.types';
import type { TicketCategory, TicketSummary } from '../types/domain.types';
import { MAX_ATTACHMENT_BYTES, TERMINAL_STATUSES } from './ticketConstants';

/** Strips the `data:` URI prefix — the backend expects raw base64. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function filesToPayload(files: File[]): Promise<AttachmentPayload[]> {
  const usable = files.filter((f) => f.size <= MAX_ATTACHMENT_BYTES);
  return Promise.all(
    usable.map(async (file) => ({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSizeBytes: file.size,
      contentBase64: await fileToBase64(file),
    })),
  );
}

export function base64ToBlob(base64: string, type = 'application/octet-stream'): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Human-readable SLA remaining.
 *
 * Returns null when there is no target or the ticket is finished, so the caller renders nothing
 * rather than a countdown that keeps growing on work that closed last month.
 */
export function formatSlaRemaining(minutes?: number | null): string | null {
  if (minutes === null || minutes === undefined) return null;
  const overdue = minutes < 0;
  const abs = Math.abs(minutes);
  const days = Math.floor(abs / 1440);
  const hours = Math.floor((abs % 1440) / 60);
  const mins = Math.floor(abs % 60);

  let text: string;
  if (days > 0) text = `${days}d ${hours}h`;
  else if (hours > 0) text = `${hours}h ${mins}m`;
  else text = `${mins}m`;

  return overdue ? `${text} overdue` : `${text} left`;
}

/** Under four hours left, or already past — the threshold the queue highlights on. */
export function isSlaUrgent(minutes?: number | null): boolean {
  return minutes !== null && minutes !== undefined && minutes < 240;
}

export function isTerminal(status?: string): boolean {
  return !!status && TERMINAL_STATUSES.includes(status as never);
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "3h ago" for list rows, where the exact instant matters less than the recency. */
export function formatRelative(value?: string): string {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return value;
  const diffMinutes = Math.floor((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(value);
}

export function formatBytes(bytes?: number): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `"R10138 - Shanmathi M M"` → `"Shanmathi M M"`, falling back to the whole string. */
export function displayNameOnly(composite?: string): string {
  if (!composite) return '—';
  const separator = composite.indexOf(' - ');
  return separator < 0 ? composite : composite.slice(separator + 3);
}

/**
 * Flattens the category tree the picker uses into `{ value, label }` options with children
 * indented under their parent. Restricted categories are dropped — the caller has already asked
 * the backend whether it may see them, and one that arrives anyway is not selectable.
 */
export function flattenCategoryOptions(
  categories: TicketCategory[],
): { value: string; label: string; disabled?: boolean }[] {
  const options: { value: string; label: string; disabled?: boolean }[] = [];
  categories.forEach((category) => {
    options.push({ value: category.categoryCode, label: category.name });
    (category.children ?? []).forEach((child) => {
      options.push({ value: child.categoryCode, label: `— ${child.name}` });
    });
  });
  return options;
}

/** Client-side narrowing for a page already fetched, so typing in the box stays responsive. */
export function filterRows(rows: TicketSummary[], text: string): TicketSummary[] {
  const needle = text.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    [row.ticketNumber, row.subject, row.categoryName, row.raisedByName, row.assignedToName]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(needle)),
  );
}

/**
 * Opens a not-yet-uploaded file in a new tab.
 *
 * These files exist only in the browser — they have no attachmentId to fetch, so the preview the
 * ticket detail uses cannot reach them. An object URL is the only handle available; it is revoked
 * on a timer rather than immediately because revoking before the new tab has read it shows a blank
 * page, and revoking never leaks the file for the life of the tab.
 */
export function previewLocalFile(file?: File): void {
  if (!file) return;
  const url = URL.createObjectURL(file);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
