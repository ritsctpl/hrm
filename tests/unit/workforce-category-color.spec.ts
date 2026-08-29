import { test, expect } from '@playwright/test';
import { categoryColor } from '../../src/modules/hrmWorkforce/hooks/useHrmWorkforceData';

// The fixed palette the helper indexes into. Kept here (not imported) so the test pins the
// contract independently of the implementation: a reordered or resized palette must break this.
const PALETTE = ['blue', 'green', 'cyan', 'geekblue', 'purple', 'magenta', 'orange', 'gold', 'lime', 'volcano'];

test('deterministic: same category always maps to the same palette colour', () => {
  expect(categoryColor('ops')).toBe(categoryColor('ops'));
  expect(categoryColor('engineering')).toBe(categoryColor('engineering'));
});

test('case-insensitive: casing of the input does not change the colour', () => {
  expect(categoryColor('OPS')).toBe(categoryColor('ops'));
  expect(categoryColor('Engineering')).toBe(categoryColor('engineering'));
  expect(categoryColor('DeSiGn')).toBe(categoryColor('design'));
});

test('every result is a member of the fixed palette', () => {
  for (const c of ['ops', 'engineering', 'design', 'sales', 'hr', 'finance', 'x', 'zzz']) {
    expect(PALETTE).toContain(categoryColor(c));
  }
});

test('empty string returns a valid palette colour, never the empty string', () => {
  const color = categoryColor('');
  expect(color).not.toBe('');
  expect(PALETTE).toContain(color);
});

test('sum-of-char-codes hash indexes the palette', () => {
  // 'ops' -> 111 + 112 + 115 = 338; 338 % 10 = 8 -> 'lime'
  expect(categoryColor('ops')).toBe('lime');
  // '' -> hash 0 -> index 0 -> 'blue'
  expect(categoryColor('')).toBe('blue');
});
