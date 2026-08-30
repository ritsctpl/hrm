import { test, expect } from '@playwright/test';
import {
  buildCtcSegments,
  computeDelta,
} from '../../src/modules/hrmCompensation/components/molecules/CtcCompositionBar';

test('segments are pct of gross, earnings only', () => {
  const comps = [
    { componentCode: 'BASIC', componentName: 'Basic', componentType: 'EARNING', derivedAmount: 60 },
    { componentCode: 'HRA', componentName: 'HRA', componentType: 'EARNING', derivedAmount: 40 },
    { componentCode: 'PF', componentName: 'PF', componentType: 'DEDUCTION', derivedAmount: 10 },
  ] as any;
  const segs = buildCtcSegments(comps, 100);
  expect(segs.map((s) => s.code)).toEqual(['BASIC', 'HRA']);
  expect(segs[0].pct).toBe(60);
});
test('computeDelta up/down/flat/none', () => {
  expect(computeDelta(100, 120)).toMatchObject({ deltaPct: 20, direction: 'up' });
  expect(computeDelta(120, 90)).toMatchObject({ direction: 'down' });
  expect(computeDelta(100, 100)).toMatchObject({ deltaPct: 0, direction: 'flat' });
  expect(computeDelta(null as any, 100)).toMatchObject({ deltaPct: null });
});
