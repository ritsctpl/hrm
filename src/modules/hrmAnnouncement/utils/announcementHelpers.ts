import { Announcement } from '../types/domain.types';
import { isDeletableStatus } from './constants';

/**
 * Merges the full `/get` record over the list row the user clicked.
 *
 * The admin list is answered by `/search`, which returns `AnnouncementSummaryResponse` — a
 * projection that deliberately omits the `content` body and the whole targeting block. Handing
 * that row straight to the composer is what left the Content box and the recipient list empty
 * when an author reopened their own draft (CT-2026-477).
 *
 * Merge rather than replace: the summary carries list-only fields (`readRate`, `attachmentCount`)
 * that `/get` does not, and dropping them would blank the row behind the drawer. Only keys the
 * detail response actually defines win — an explicit `null` from the server is authoritative and
 * does overwrite, but a key it simply never sends must not erase what the row already knew.
 */
export const mergeAnnouncementDetail = (
  summary: Announcement,
  full?: Announcement | null
): Announcement => {
  if (!full) return summary;
  const defined = Object.fromEntries(
    Object.entries(full).filter(([, value]) => value !== undefined)
  );
  const merged = { ...summary, ...defined } as Announcement;
  // The body is the one field the merge may never blank (HRM issue #5): a detail that answers
  // without one must not erase a body the row already had. A real body from `/get` still wins.
  if (isBlankText(merged.content) && !isBlankText(summary.content)) {
    merged.content = summary.content;
  }
  return merged;
};

const isBlankText = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * "Latest request wins" token (HRM issue #5). Each `begin()` supersedes every earlier token;
 * `invalidate()` supersedes them without starting a new one (e.g. "+ New" clicked mid-load).
 */
export interface LatestRequestGuard {
  begin: () => number;
  isCurrent: (token: number) => boolean;
  invalidate: () => void;
}

export const createLatestRequestGuard = (): LatestRequestGuard => {
  let latest = 0;
  return {
    begin: () => ++latest,
    isCurrent: (token) => token === latest,
    invalidate: () => {
      latest += 1;
    },
  };
};

/**
 * Fetches the full record for a row the author wants to edit and merges it over the row.
 *
 * Resolves `null` when a later request (or `invalidate()`) superseded this one — opening draft A
 * then draft B must end on B even when A's `/get` answers last. A failure is rethrown only while
 * the request is still current; a superseded one fails silently.
 */
export const loadAnnouncementForEdit = async (
  row: Announcement,
  fetchDetail: (row: Announcement) => Promise<Announcement | null | undefined>,
  guard: LatestRequestGuard
): Promise<Announcement | null> => {
  const token = guard.begin();
  let full: Announcement | null | undefined;
  try {
    full = await fetchDetail(row);
  } catch (err) {
    if (!guard.isCurrent(token)) return null;
    throw err;
  }
  if (!guard.isCurrent(token)) return null;
  return mergeAnnouncementDetail(row, full);
};

// ── Content format (HRM issue #5) ─────────────────────────────────────────────────────────────
//
// The Content box is a plain textarea, so what the author types is literal text. hrm-service
// stores a PLAIN body through `Jsoup.clean(content, Safelist.none())`, which strips anything that
// parses as a tag: "<Draft content>" was stored as "" and reopened as a blank editor, "a <b> c"
// lost its middle, and "Q&A" reopened as "Q&amp;A". Escaping the text before it is sent leaves
// nothing that parses as a tag, and jsoup keeps an already-escaped string unchanged (newlines
// included), so the stored value decodes back to exactly what was typed.
//
// A record whose stored format is HTML (created by another client) keeps HTML: its source is
// edited as-is and sent back unchanged. The format of a record is never switched on what was typed.

export type ContentFormat = 'PLAIN' | 'HTML';

const isHtmlFormat = (format?: string | null): boolean => (format ?? '').toUpperCase() === 'HTML';

/** Escapes literal text for a PLAIN body — `&` first, so nothing is escaped twice. */
export const escapePlainText = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // jsoup writes U+00A0 as &nbsp;; sending it that way makes the stored value equal the sent one.
    .replace(/\u00a0/g, '&nbsp;');

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

/** Decodes HTML entities once (a single pass, so "&amp;lt;" becomes "&lt;", not "<"). */
export const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });

/**
 * The text to put in the Content box for a stored body: a non-HTML body is stored escaped, so it
 * is decoded once back to what was typed; an HTML body is shown as its source.
 */
export const editorContentFrom = (content?: string | null, format?: string | null): string => {
  if (!content) return '';
  return isHtmlFormat(format) ? content : decodeEntities(content);
};

/**
 * What the composer sends for the Content box. `storedFormat` is the open record's format (absent
 * for a new record): HTML stays HTML and is sent unchanged; everything else is sent as escaped
 * PLAIN text. Inverse of `editorContentFrom`.
 */
export const contentForSave = (
  text: string,
  storedFormat?: string | null
): { content: string; contentFormat: ContentFormat } =>
  isHtmlFormat(storedFormat)
    ? { content: text, contentFormat: 'HTML' }
    : { content: escapePlainText(text), contentFormat: 'PLAIN' };

/**
 * Formats a byte count for the attachment list (design §14.2.2 — "892 KB").
 * Returns an empty string when the backend omits the size, so callers can
 * render the label conditionally without a null check at every call site.
 */
export const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};

/**
 * Whether the compose drawer offers "Delete draft" for what it has open (HRM issue #1).
 *
 * Only for a record that already exists on the server (a new, never-saved announcement has
 * nothing to delete — Cancel discards it) and only in a status the server lets be deleted.
 * The RBAC half (`announcement_record` → delete) is the drawer's `<Can>`, as on the Admin row.
 */
export const canDeleteFromComposer = (announcement?: Announcement | null): boolean =>
  !!announcement?.handle && isDeletableStatus(announcement.status);

/**
 * Label for the composer's delete button. The server deletes DRAFT, REJECTED and RETURNED
 * announcements (AnnouncementStatus.DELETABLE), so the button is offered for all three, but
 * only a DRAFT is called a draft.
 */
export const composerDeleteLabel = (status?: string): string =>
  status === "DRAFT" ? "Delete draft" : "Delete";
