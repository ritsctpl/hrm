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
  return { ...summary, ...defined } as Announcement;
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
