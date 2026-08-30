import { test, expect } from '@playwright/test';
import { resolveStructureLines } from '../../src/modules/hrmCompensation/components/organisms/StructureDetailPanel';

const masters = [
  {
    componentCode: 'BASIC',
    componentName: 'Basic',
    componentType: 'EARNING',
    calculationMethod: 'PERCENT_OF_CTC',
    percentage: 40,
    statutoryLinkage: 'NONE',
    subType: 'FIXED',
  },
  {
    componentCode: 'HRA',
    componentName: 'HRA',
    componentType: 'EARNING',
    calculationMethod: 'PERCENTAGE',
    percentage: 50,
    baseComponentCode: 'BASIC',
    statutoryLinkage: 'NONE',
    subType: 'FIXED',
  },
] as any;
const structure = { components: [{ componentCode: 'BASIC' }, { componentCode: 'HRA' }, { componentCode: 'GHOST' }] } as any;

test('resolves line name+calc via master', () => {
  const rows = resolveStructureLines(structure, masters);
  expect(rows[0]).toMatchObject({ code: 'BASIC', name: 'Basic', calc: '40% of CTC' });
  expect(rows[1]).toMatchObject({ code: 'HRA', name: 'HRA', calc: '50% of BASIC' });
});
test('unknown code degrades gracefully', () => {
  const rows = resolveStructureLines(structure, masters);
  expect(rows[2]).toMatchObject({ code: 'GHOST', name: 'GHOST', calc: '—' });
});
