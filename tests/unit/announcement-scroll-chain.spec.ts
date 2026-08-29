import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The announcements page does not scroll.
 *
 * Layout here is a flex chain, not a document flow. `.hrm-module-root` fixes the page at
 * `calc(100vh - 32px)` with `overflow: hidden`, so nothing below it may grow the page — one
 * descendant has to take the overflow and scroll it. That descendant is `.feedContainer`
 * (`flex: 1; overflow-y: auto`), and for it to have a height to overflow, every ancestor
 * between it and the root must be a bounded flex column.
 *
 * Ant Design's Tabs sit in the middle of that chain, and its `.ant-tabs-content-holder` /
 * `-content` / `-tabpane` are not flex columns by default. Unless the module overrides them —
 * as hrmLeave, hrmExpense and hrmTravel each do — the chain breaks at the tab pane, every
 * `flex: 1` below it resolves against an auto-height parent, and the feed simply runs off the
 * bottom of the clipped root with no scrollbar anywhere.
 *
 * These assertions read the stylesheet as authored, so a later edit that drops a link cannot
 * quietly take the scrollbar away again.
 */

const CSS = readFileSync(
  join(__dirname, '../../src/modules/hrmAnnouncement/styles/HrmAnnouncement.module.css'),
  'utf8'
);

/** The declaration block of the first rule whose selector contains every given fragment. */
const block = (...fragments: string[]): string => {
  // Comments are dropped before anything else: a rule may carry one above it or inside it, and
  // either would otherwise be read as part of a selector or a declaration.
  const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '').split('}');
  const hit = rules.find((rule) => {
    const [selector, declarations] = rule.split('{');
    return declarations !== undefined && fragments.every((f) => selector.includes(f));
  });
  expect(hit, `no rule found for selector containing ${fragments.join(' + ')}`).toBeTruthy();
  return (hit as string).split('{')[1];
};

/** A flex child only shrinks below its content when min-height is cleared. */
const isBoundedFlexColumn = (declarations: string) =>
  /display:\s*flex/.test(declarations) &&
  /flex-direction:\s*column/.test(declarations) &&
  /min-height:\s*0/.test(declarations);

test('the Tabs root is a bounded flex column', () => {
  expect(isBoundedFlexColumn(block('.landing', 'ant-tabs)'))).toBe(true);
});

test('the content holder passes the height on instead of ending it', () => {
  const declarations = block('ant-tabs-content-holder');
  expect(/flex:\s*1/.test(declarations)).toBe(true);
  expect(/min-height:\s*0/.test(declarations)).toBe(true);
});

test('the content wrapper fills the holder', () => {
  const declarations = block('ant-tabs-content)');
  expect(/height:\s*100%/.test(declarations)).toBe(true);
  expect(isBoundedFlexColumn(declarations)).toBe(true);
});

test('the tab pane is the last link — it must be a bounded flex column too', () => {
  const declarations = block('ant-tabs-tabpane');
  expect(/height:\s*100%/.test(declarations)).toBe(true);
  expect(isBoundedFlexColumn(declarations)).toBe(true);
});

test('the feed template can shrink, so its scroller gets a real height', () => {
  const declarations = block('.feedTemplate');
  expect(/flex:\s*1/.test(declarations)).toBe(true);
  expect(/min-height:\s*0/.test(declarations)).toBe(true);
});

test('the feed container is the element that actually scrolls', () => {
  const declarations = block('.feedContainer');
  expect(/overflow-y:\s*auto/.test(declarations)).toBe(true);
  expect(/flex:\s*1/.test(declarations)).toBe(true);
  expect(/min-height:\s*0/.test(declarations)).toBe(true);
});

test('the admin tab scrolls as well — the table is 20 rows and was clipped, not scrolled', () => {
  const declarations = block('.adminTemplate');
  expect(/overflow-y:\s*auto/.test(declarations)).toBe(true);
  expect(/min-height:\s*0/.test(declarations)).toBe(true);
});
