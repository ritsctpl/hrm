import { test, expect } from '@playwright/test';
import { FormStore } from 'rc-field-form/lib/useForm';
import { HOOK_MARK } from 'rc-field-form/lib/FieldContext';
import {
  mergeAnnouncementDetail,
  createLatestRequestGuard,
  loadAnnouncementForEdit,
  contentFormatFor,
  editorContentFrom,
  contentHasVisibleText,
} from '../../src/modules/hrmAnnouncement/utils/announcementHelpers';
import { Announcement } from '../../src/modules/hrmAnnouncement/types/domain.types';

/**
 * HRM issue #5: "In the edit mode of the draft announcement, the content to edit is not being
 * displayed. I saved some content and then tried to edit the same."
 *
 * The CT-2026-477 fix (load `/get` before opening the editor) is intact. What was still wrong:
 *
 *  1. The composer never sent `contentFormat`, so hrm-service stored every body as PLAIN and ran
 *     it through `Jsoup.clean(content, Safelist.none())` — every tag stripped, even though the
 *     box says "HTML supported". A body written as markup (`<p>…</p>` survives as bare text,
 *     `<img …>` or `<Draft content>` survive as NOTHING) came back empty. `@NotBlank` is checked
 *     before sanitising, so the empty draft still saved. PLAIN storage also HTML-escapes, so
 *     "Q&A" reopened as "Q&amp;A" and grew another `amp;` on every save.
 *  2. Opening draft A then draft B could show A (the old guard ignored B's click; the new guard
 *     makes the latest click win and drops A's late answer).
 *  3. The drawer only populated once the employee identity was ready — a blank editor for as long
 *     as it was not, and a clobbered edit whenever it changed.
 */

const ROW = {
  handle: 'H-A',
  announcementId: 'ANN-2026-0005',
  title: 'Issue 5 draft',
  category: 'GENERAL',
  priority: 'GENERAL',
  status: 'DRAFT',
  readRate: 0,
} as unknown as Announcement;

const DETAIL_A = {
  ...ROW,
  content: 'SENTINEL-A: the body saved on draft A.',
  contentFormat: 'PLAIN',
} as unknown as Announcement;

const ROW_B = { ...ROW, handle: 'H-B', title: 'Draft B' } as unknown as Announcement;
const DETAIL_B = {
  ...ROW_B,
  content: 'SENTINEL-B: the body saved on draft B.',
  contentFormat: 'PLAIN',
} as unknown as Announcement;

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** The drawer's antd form, driven through the real rc-field-form store it is built on. */
const newComposerForm = () => {
  const store = new FormStore(() => undefined);
  const form = store.getForm();
  // What <Form> does on its first render (Form.js: setInitialValues(initialValues, !mounted)).
  const mount = () => form.getInternalHooks(HOOK_MARK)!.setInitialValues({}, true);
  return { form, mount };
};

// ── detail arrives after the drawer has mounted ──────────────────────────────────────────────

test('detail that arrives after the form mounted still reaches the Content field', async () => {
  const { form, mount } = newComposerForm();
  mount(); // drawer already open and rendered, detail still in flight

  const pending = deferred<Announcement>();
  const guard = createLatestRequestGuard();
  const opening = loadAnnouncementForEdit(ROW, () => pending.promise, guard);
  pending.resolve(DETAIL_A);
  const merged = await opening;

  form.setFieldsValue({ content: editorContentFrom(merged!.content, merged!.contentFormat) });
  expect(form.getFieldValue('content')).toBe('SENTINEL-A: the body saved on draft A.');
});

test('values set before the drawer first mounts its form are not dropped by the mount', () => {
  // The drawer calls setFieldsValue from an effect; on the very first open the <Form> may not
  // have registered yet. The store must keep what was set rather than reset to initialValues.
  const { form, mount } = newComposerForm();
  form.setFieldsValue({ content: DETAIL_A.content });
  mount();
  expect(form.getFieldValue('content')).toBe(DETAIL_A.content);
});

// ── A/B race ─────────────────────────────────────────────────────────────────────────────────

test('open A then B, A answers last — the editor gets B, A is dropped', async () => {
  const guard = createLatestRequestGuard();
  const a = deferred<Announcement>();
  const b = deferred<Announcement>();
  const fetch = (row: Announcement) => (row.handle === 'H-A' ? a.promise : b.promise);

  const openA = loadAnnouncementForEdit(ROW, fetch, guard);
  const openB = loadAnnouncementForEdit(ROW_B, fetch, guard);
  b.resolve(DETAIL_B);
  a.resolve(DETAIL_A);

  expect((await openB)?.content).toBe('SENTINEL-B: the body saved on draft B.');
  expect(await openA).toBeNull();
});

test('a superseded request that fails is swallowed; the current one that fails is reported', async () => {
  const guard = createLatestRequestGuard();
  const a = deferred<Announcement>();
  const openA = loadAnnouncementForEdit(ROW, () => a.promise, guard);
  const openB = loadAnnouncementForEdit(ROW_B, async () => DETAIL_B, guard);
  a.reject(new Error('404'));
  expect(await openA).toBeNull();
  expect((await openB)?.handle).toBe('H-B');

  const c = loadAnnouncementForEdit(ROW, async () => { throw new Error('boom'); }, guard);
  await expect(c).rejects.toThrow('boom');
});

test('starting a new announcement cancels an edit that is still loading', async () => {
  const guard = createLatestRequestGuard();
  const a = deferred<Announcement>();
  const openA = loadAnnouncementForEdit(ROW, () => a.promise, guard);
  guard.invalidate(); // "+ New" clicked while A was loading
  a.resolve(DETAIL_A);
  expect(await openA).toBeNull();
});

// ── the list row never blanks the body ───────────────────────────────────────────────────────

test('list-row merge never blanks content', () => {
  // The row has no body at all; the detail's body wins.
  expect(mergeAnnouncementDetail(ROW, DETAIL_A).content).toBe(DETAIL_A.content);
  // A row that does carry a body is not erased by a detail that omits, nulls or blanks it.
  const rowWithBody = { ...ROW, content: 'kept' } as Announcement;
  for (const content of [undefined, null, '', '   ']) {
    const full = { ...ROW, content } as unknown as Announcement;
    expect(mergeAnnouncementDetail(rowWithBody, full).content).toBe('kept');
  }
  // …but a real body from the detail always replaces the row's.
  expect(mergeAnnouncementDetail(rowWithBody, DETAIL_A).content).toBe(DETAIL_A.content);
  // No detail at all: the row as it was.
  expect(mergeAnnouncementDetail(ROW, null)).toEqual(ROW);
});

// ── the body the server stores is the body the author wrote ──────────────────────────────────

test('markup is sent as HTML so the server keeps it; plain text stays PLAIN', () => {
  expect(contentFormatFor('<p>Office closed on <b>Friday</b></p>')).toBe('HTML');
  expect(contentFormatFor('<img src="https://x/y.png">')).toBe('HTML');
  expect(contentFormatFor('Line one\nLine two')).toBe('PLAIN');
  expect(contentFormatFor('a < b and c > d')).toBe('PLAIN');
  expect(contentFormatFor('Q&A at 3pm')).toBe('PLAIN');
});

test('a PLAIN body reopens as the text that was typed, not its HTML escape', () => {
  // Exactly what Jsoup.clean(…, Safelist.none()) stores for "Q&A: a < b > c" + non-breaking space.
  expect(editorContentFrom('Q&amp;A: a &lt; b &gt; c&nbsp;x', 'PLAIN')).toBe('Q&A: a < b > c x');
  expect(editorContentFrom('&#39;quoted&#x27; &quot;x&quot;', 'PLAIN')).toBe('\'quoted\' "x"');
  expect(editorContentFrom('&amp;lt;', 'PLAIN')).toBe('&lt;'); // decoded once, not twice
  // HTML bodies are shown as their source — that IS what the author edits.
  expect(editorContentFrom('<p>Q&amp;A</p>', 'HTML')).toBe('<p>Q&amp;A</p>');
  expect(editorContentFrom(undefined, 'PLAIN')).toBe('');
  expect(editorContentFrom(null, undefined)).toBe('');
});

test('a body the server would sanitise to nothing is refused before saving', () => {
  // Each of these saved as an EMPTY body before (verified against jsoup 1.18.3 as used by hrm-service).
  expect(contentHasVisibleText('<Draft content>')).toBe(false);
  expect(contentHasVisibleText('<!-- note -->')).toBe(false);
  expect(contentHasVisibleText('<p> </p><br>')).toBe(false);
  expect(contentHasVisibleText('&nbsp;')).toBe(false);
  expect(contentHasVisibleText('<script>alert(1)</script>')).toBe(false);
  // …and these keep something.
  expect(contentHasVisibleText('Hello')).toBe(true);
  expect(contentHasVisibleText('<p>para</p>')).toBe(true);
  expect(contentHasVisibleText('a < b')).toBe(true);
  expect(contentHasVisibleText('<img src="https://x/y.png">')).toBe(true);
});
