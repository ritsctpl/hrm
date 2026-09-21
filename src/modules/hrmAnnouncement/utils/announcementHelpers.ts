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
// hrm-service's `AnnouncementContentSanitizer` stores a body without `contentFormat` as PLAIN and
// cleans it with `Jsoup.clean(content, Safelist.none())`: every tag is removed and the text is
// HTML-escaped. The composer never sent a format, so a body written as markup (which the box
// invites: "HTML supported") lost its markup, a body that was ONLY markup — `<img …>`, a comment,
// `<Draft content>` — was stored empty, and "Q&A" reopened as "Q&amp;A".

/** A start/end tag or a comment, as an HTML parser would read it. */
const MARKUP = /<\/?[a-z][^<>]*>|<!--/i;

/** HTML when the body contains markup, so the server keeps it; PLAIN otherwise (as before). */
export const contentFormatFor = (content?: string | null): 'HTML' | 'PLAIN' =>
  content && MARKUP.test(content) ? 'HTML' : 'PLAIN';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const decodeEntities = (text: string): string =>
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
 * The text to put in the Content box for a stored body. A PLAIN body is stored HTML-escaped, so
 * it is decoded once back to what was typed; an HTML body is shown as its source.
 */
export const editorContentFrom = (content?: string | null, format?: string | null): string => {
  if (!content) return '';
  return (format ?? '').toUpperCase() === 'PLAIN' ? decodeEntities(content) : content;
};

/**
 * Whether a body keeps anything once the server has sanitised it: visible text outside tags,
 * comments and script/style blocks, or an http(s) image (the one bare element the HTML allow-list
 * keeps). A body that fails this would be stored empty and reopen as a blank editor.
 */
export const contentHasVisibleText = (content?: string | null): boolean => {
  if (!content) return false;
  if (/<img\b[^<>]*\bsrc\s*=\s*["']?https?:/i.test(content)) return true;
  const text = content
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<(script|style)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, '')
    .replace(/<\/?[a-z][^<>]*>/gi, '');
  return decodeEntities(text).replace(/ /g, ' ').trim() !== '';
};

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
