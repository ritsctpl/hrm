import { test, expect } from '@playwright/test';
import { mergeAnnouncementDetail } from '../../src/modules/hrmAnnouncement/utils/announcementHelpers';
import { isDeletableStatus, DELETABLE_STATUSES } from '../../src/modules/hrmAnnouncement/utils/constants';
import { Announcement } from '../../src/modules/hrmAnnouncement/types/domain.types';

/**
 * CT-2026-477. Two defects on the announcements Admin tab:
 *
 *  (A) Reopening a saved draft showed an empty Content box and no recipients, because the editor
 *      was populated from the `/search` row. That response is an AnnouncementSummaryResponse,
 *      which omits `content` and the entire targeting block by design. Since both are required
 *      to save, the author's own draft became uneditable.
 *
 *  (B) There was no way to delete a draft, although the endpoint, the service method and the
 *      RBAC grant all already existed.
 *
 * The browser evidence lives in the ticket folder; these cover the two pure helpers the fix
 * leans on, so a later refactor cannot quietly reintroduce either defect.
 */

/** A row exactly as `/search` answers it — note what is absent. */
const SEARCH_ROW = {
  handle: 'RITS:ANN-2026-0001',
  announcementId: 'ANN-2026-0001',
  title: 'CT-2026-477 Draft Round Trip',
  category: 'GENERAL',
  priority: 'GENERAL',
  status: 'DRAFT',
  readRate: 0,
  attachmentCount: 0,
  createdBy: 'CT473ADM',
} as unknown as Announcement;

/** The same announcement as `/get` answers it — body and targeting present. */
const DETAIL = {
  handle: 'RITS:ANN-2026-0001',
  announcementId: 'ANN-2026-0001',
  title: 'CT-2026-477 Draft Round Trip',
  content: 'SENTINEL-CT477: this body text must survive a save-and-reopen cycle.',
  category: 'GENERAL',
  priority: 'GENERAL',
  status: 'DRAFT',
  allEmployees: false,
  targetEmployeeIds: ['CT473EMP'],
  targetDepartments: [],
  targetBusinessUnits: [],
  targetRoles: [],
} as unknown as Announcement;

// ── (A) the merge that puts a body back into the editor ────────────────────────

test('the detail body and audience reach the editor', () => {
  const merged = mergeAnnouncementDetail(SEARCH_ROW, DETAIL);
  expect(merged.content).toBe(
    'SENTINEL-CT477: this body text must survive a save-and-reopen cycle.'
  );
  expect(merged.targetEmployeeIds).toEqual(['CT473EMP']);
  expect(merged.allEmployees).toBe(false);
});

test('the search row alone carries neither — this is the defect being fixed', () => {
  // Guards the premise: if /search ever started returning content, the fetch could be dropped.
  expect((SEARCH_ROW as { content?: string }).content).toBeUndefined();
  expect((SEARCH_ROW as { targetEmployeeIds?: string[] }).targetEmployeeIds).toBeUndefined();
});

test('list-only fields survive the merge', () => {
  // /get does not answer readRate or attachmentCount. Replacing instead of merging would blank
  // the row sitting behind the drawer.
  // attachmentCount is a summary-only field — it is not on the domain type at all, which is
  // precisely why it must not be lost on the way into the drawer.
  const merged = mergeAnnouncementDetail(SEARCH_ROW, DETAIL) as Announcement & {
    attachmentCount?: number;
  };
  expect(merged.readRate).toBe(0);
  expect(merged.attachmentCount).toBe(0);
});

test('an explicit null from the server overwrites, an absent key does not', () => {
  const withNull = { ...DETAIL, expiresAt: null } as unknown as Announcement;
  const row = { ...SEARCH_ROW, expiresAt: '2026-09-01T00:00:00' } as unknown as Announcement;
  // null is the server's answer — it wins.
  expect(mergeAnnouncementDetail(row, withNull).expiresAt).toBeNull();
  // undefined means "not part of this response" — the row's value stands.
  const withUndefined = { ...DETAIL, expiresAt: undefined } as unknown as Announcement;
  expect(mergeAnnouncementDetail(row, withUndefined).expiresAt).toBe('2026-09-01T00:00:00');
});

test('a failed fetch leaves the caller holding the summary, never a blank record', () => {
  expect(mergeAnnouncementDetail(SEARCH_ROW, null)).toBe(SEARCH_ROW);
  expect(mergeAnnouncementDetail(SEARCH_ROW, undefined)).toBe(SEARCH_ROW);
});

// ── (B) which statuses may be deleted ──────────────────────────────────────────

test('deletable statuses mirror the server set exactly', () => {
  // AnnouncementStatus.DELETABLE = Set.of(DRAFT, REJECTED, RETURNED)
  expect([...DELETABLE_STATUSES].sort()).toEqual(['DRAFT', 'REJECTED', 'RETURNED']);
});

test('a draft offers delete', () => {
  expect(isDeletableStatus('DRAFT')).toBe(true);
  expect(isDeletableStatus('REJECTED')).toBe(true);
  expect(isDeletableStatus('RETURNED')).toBe(true);
});

test('a published announcement does not — it is withdrawn, not deleted', () => {
  for (const status of ['PUBLISHED', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'WITHDRAWN', 'EXPIRED']) {
    expect(isDeletableStatus(status)).toBe(false);
  }
});

test('an unknown or missing status offers nothing', () => {
  expect(isDeletableStatus(undefined)).toBe(false);
  expect(isDeletableStatus('')).toBe(false);
  expect(isDeletableStatus('SOMETHING_NEW')).toBe(false);
});
