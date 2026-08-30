import { test, expect } from '@playwright/test';
import {
  WORKFLOW_STEPS,
  type WorkflowStep,
} from '../../src/modules/hrmCompensation/components/templates/WorkflowRail';

test('WORKFLOW_STEPS lists the 7 guided steps in the mockup order', () => {
  const keys = WORKFLOW_STEPS.map((s: WorkflowStep) => s.key);
  expect(keys).toEqual([
    'overview',
    'components',
    'structures',
    'assignment',
    'revision',
    'approvals',
    'history',
  ]);
});

test('WORKFLOW_STEPS labels match the Compensation Studio mockup', () => {
  const labels = WORKFLOW_STEPS.map((s: WorkflowStep) => s.label);
  expect(labels).toEqual([
    'Overview',
    'Pay Components',
    'Salary Structures',
    'Assign CTC',
    'Revisions',
    'Approvals',
    'History',
  ]);
});

test('Overview is index 0 and the pipeline steps are numbered 1..6 in order', () => {
  expect(WORKFLOW_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(WORKFLOW_STEPS[0].key).toBe('overview');
});

test('only components, structures and approvals bind a live count', () => {
  const bound = WORKFLOW_STEPS.filter((s) => s.countKey).map((s) => [s.key, s.countKey]);
  expect(bound).toEqual([
    ['components', 'payComponents'],
    ['structures', 'salaryStructures'],
    ['approvals', 'pendingApprovals'],
  ]);
});
