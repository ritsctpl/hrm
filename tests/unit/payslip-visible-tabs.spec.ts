import { test, expect } from '@playwright/test';
import { visiblePayslipTabs } from '../../src/modules/hrmPayslip/utils/payslipTabs';

/**
 * Tab visibility for the payslip landing page (task 13 / preflight ruling R6). Tabs are chosen
 * from RBAC grants, not the `role` cookie; "My Payslips" is self-service and always shown.
 */

const none = { canUpload: false, canViewRepository: false, canViewGeneration: false, canViewTemplates: false };

test('an employee with no grants sees only My Payslips', () => {
  expect(visiblePayslipTabs(none)).toEqual(['myPayslips']);
});

test('upload permission alone adds only the Upload tab, first', () => {
  expect(visiblePayslipTabs({ ...none, canUpload: true })).toEqual(['upload', 'myPayslips']);
});

test('repository view adds Repository and Upload History together', () => {
  expect(visiblePayslipTabs({ ...none, canViewRepository: true }))
    .toEqual(['myPayslips', 'repository', 'uploadHistory']);
});

test('generation and templates are gated independently', () => {
  expect(visiblePayslipTabs({ ...none, canViewGeneration: true })).toEqual(['myPayslips', 'generate']);
  expect(visiblePayslipTabs({ ...none, canViewTemplates: true })).toEqual(['myPayslips', 'templates']);
});

test('a full HR user sees every tab in display order', () => {
  expect(visiblePayslipTabs({
    canUpload: true, canViewRepository: true, canViewGeneration: true, canViewTemplates: true,
  })).toEqual(['upload', 'myPayslips', 'repository', 'uploadHistory', 'generate', 'templates']);
});
