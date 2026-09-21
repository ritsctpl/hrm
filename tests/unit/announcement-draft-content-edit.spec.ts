import { test, expect } from '@playwright/test';
import { FormStore } from 'rc-field-form/lib/useForm';
import { HOOK_MARK } from 'rc-field-form/lib/FieldContext';
import {
  mergeAnnouncementDetail,
  createLatestRequestGuard,
  loadAnnouncementForEdit,
  editorContentFrom,
  contentForSave,
  escapePlainText,
  decodeEntities,
} from '../../src/modules/hrmAnnouncement/utils/announcementHelpers';
import { Announcement } from '../../src/modules/hrmAnnouncement/types/domain.types';

/**
 * HRM issue #5: "In the edit mode of the draft announcement, the content to edit is not being
 * displayed. I saved some content and then tried to edit the same."
 *
 * The CT-2026-477 fix (load `/get` before opening the editor) is intact. What was still wrong:
 *
 *  1. The textarea's literal text went to hrm-service unescaped, and a PLAIN body is stored as
 *     `Jsoup.clean(content, Safelist.none())`, which strips anything that parses as a tag.
 *     "<Draft content>" was stored as "" (`@NotBlank` is checked before sanitising, so it still
 *     saved) and reopened blank; "a <b> c" lost its middle; "Q&A" reopened as "Q&amp;A". The
 *     composer now sends the text escaped as PLAIN (an HTML record stays HTML) and decodes it
 *     once on reopen, so the text round-trips exactly.
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
//
// The server side of the round trip: hrm-service stores a PLAIN body as
// `Jsoup.clean(content, "", Safelist.none(), prettyPrint(false))`. For text escaped by
// `escapePlainText` that call returns its input unchanged — checked against jsoup 1.18.3 for every
// sample below ("SAME" for each; the only rewrite is U+00A0 -> &nbsp;, which escapePlainText
// already does). So the stored value is exactly what the composer sent.

const saveAndReopen = (typed: string, storedFormat?: string) => {
  const sent = contentForSave(typed, storedFormat);
  const stored = sent.content; // Safelist.none() leaves escaped text untouched (see above)
  return { sent, reopened: editorContentFrom(stored, sent.contentFormat) };
};

const LITERALS = [
  '<Draft content>',
  'Q&A a < b > c',
  '&lt;literal',
  'Line one\n\n  Line two\twith a tab\nLine three',
  '<p>not markup, just text</p> & <!-- neither is this -->',
  '"quoted" \'apos\' non breaking',
];

for (const typed of LITERALS) {
  test(`typed text round-trips exactly: ${JSON.stringify(typed)}`, () => {
    const { sent, reopened } = saveAndReopen(typed);
    expect(sent.contentFormat).toBe('PLAIN');
    // Nothing left that jsoup could read as a tag or comment — nothing for it to strip.
    expect(sent.content).not.toMatch(/[<>]/);
    expect(reopened).toBe(typed);
    // …and saving again without touching it sends the same thing (no &amp;amp; creep).
    expect(contentForSave(reopened).content).toBe(sent.content);
  });
}

test('the exact escapes: & first, so nothing is escaped twice', () => {
  expect(escapePlainText('Q&A a < b > c')).toBe('Q&amp;A a &lt; b &gt; c');
  expect(escapePlainText('&lt;literal')).toBe('&amp;lt;literal');
  expect(escapePlainText('<Draft content>')).toBe('&lt;Draft content&gt;');
  expect(decodeEntities('&amp;lt;')).toBe('&lt;'); // decoded once, not twice
});

test('a new record, or any non-HTML record, is sent as PLAIN — never switched by what was typed', () => {
  expect(contentForSave('<b>bold?</b>').contentFormat).toBe('PLAIN');
  expect(contentForSave('<b>bold?</b>', 'PLAIN').contentFormat).toBe('PLAIN');
  expect(contentForSave('<b>bold?</b>', null).contentFormat).toBe('PLAIN');
});

test('an HTML record stays HTML: its source is edited as-is and sent back unchanged', () => {
  const source = '<p>Office closed <b>Friday</b></p>\n<p>Q&amp;A after</p>';
  expect(editorContentFrom(source, 'HTML')).toBe(source);
  expect(editorContentFrom(source, 'html')).toBe(source);
  expect(contentForSave(source, 'HTML')).toEqual({ content: source, contentFormat: 'HTML' });
});

test('a body stored escaped before this fix reopens decoded; empty stays empty', () => {
  // What the old composer produced for "Q&A: a < b > c" + NBSP (server-escaped PLAIN).
  expect(editorContentFrom('Q&amp;A: a &lt; b &gt; c&nbsp;x', 'PLAIN')).toBe('Q&A: a < b > c x');
  expect(editorContentFrom('&#39;q&#x27; &quot;x&quot;', 'PLAIN')).toBe('\'q\' "x"');
  expect(editorContentFrom(undefined, 'PLAIN')).toBe('');
  expect(editorContentFrom(null, undefined)).toBe('');
});
