/**
 * HRM Asset Module - Validation Rules
 */

import dayjs, { Dayjs } from 'dayjs';
import {
  ASSIGNMENT_BACKDATE_LIMIT_DAYS,
  ASSIGNMENT_MAX_RETURN_YEARS,
  ASSIGNMENT_ATTACHMENT_MAX_FILES,
  ASSIGNMENT_ATTACHMENT_MAX_MB,
  ASSIGNMENT_OTHER_MIN_REMARKS,
} from './assetConstants';

export const assetFormRules = {
  categoryCode: [{ required: true, message: 'Category is required' }],
  assetName: [
    { required: true, message: 'Asset name is required' },
    { max: 120, message: 'Max 120 characters' },
  ],
  purchaseValueINR: [
    { required: true, message: 'Purchase value is required' },
    { type: 'number' as const, min: 0, message: 'Must be positive' },
  ],
  purchaseDate: [{ required: true, message: 'Purchase date is required' }],
  vendor: [{ required: true, message: 'Vendor is required' }],
  invoiceNo: [{ required: true, message: 'Invoice number is required' }],
  invoiceDate: [{ required: true, message: 'Invoice date is required' }],
};

export const requestFormRules = {
  categoryCode: [{ required: true, message: 'Category is required' }],
  quantity: [
    { required: true, message: 'Quantity is required' },
    { type: 'number' as const, min: 1, message: 'Min quantity is 1' },
  ],
  purpose: [
    { required: true, message: 'Purpose is required' },
    { max: 500, message: 'Max 500 characters' },
  ],
};

export const categoryFormRules = {
  categoryCode: [
    { required: true, message: 'Category code is required' },
    // { pattern: /^[A-Z0-9_]+$/, message: 'Uppercase letters, digits and underscores only' },
    { max: 20, message: 'Max 20 characters' },
  ],
  categoryName: [
    { required: true, message: 'Category name is required' },
    { max: 60, message: 'Max 60 characters' },
  ],
  wdvRatePct: [
    { required: true, message: 'WDV rate is required' },
    { type: 'number' as const, min: 0, max: 100, message: 'Must be 0–100' },
  ],
};

/**
 * Direct assignment form rules.
 *
 * These give fast feedback only. The backend re-checks asset availability and
 * employee existence; it does NOT currently enforce the backdating window or
 * the reason/remarks pairing, so those two are advisory until tickets BE-9 and
 * BE-2 land. Do not describe them to the user as if they were guarantees.
 */
export function buildDirectAssignRules(
  ctx: { purchaseDate?: string; joiningDate?: string } = {},
) {
  const purchase = ctx.purchaseDate ? dayjs(ctx.purchaseDate).startOf('day') : null;
  const joining = ctx.joiningDate ? dayjs(ctx.joiningDate).startOf('day') : null;

  return {
    // R-01 / R-03
    assetId: [{ required: true, message: 'Select an asset to assign.' }],
    employeeId: [{ required: true, message: 'Select an employee.' }],

    // R-04, R-05, R-06, R-14, R-15
    allocationDate: [
      { required: true, message: 'Assignment date is required.' },
      {
        validator(_: unknown, value: Dayjs) {
          if (!value) return Promise.resolve();
          const day = value.startOf('day');
          if (day.isAfter(dayjs().startOf('day'))) {
            return Promise.reject(new Error('Assignment date cannot be in the future.'));
          }
          if (day.isBefore(dayjs().startOf('day').subtract(ASSIGNMENT_BACKDATE_LIMIT_DAYS, 'day'))) {
            return Promise.reject(
              new Error(
                `Backdating beyond ${ASSIGNMENT_BACKDATE_LIMIT_DAYS} days is not allowed. Contact the HRM administrator.`,
              ),
            );
          }
          if (purchase && purchase.isValid() && day.isBefore(purchase)) {
            return Promise.reject(
              new Error("Assignment date is before the asset's purchase date."),
            );
          }
          if (joining && joining.isValid() && day.isBefore(joining)) {
            return Promise.reject(
              new Error("Assignment date is before the employee's joining date."),
            );
          }
          return Promise.resolve();
        },
      },
    ],

    // R-07, R-08 — cross-field, so this is the rule-factory form
    expectedReturnDate: [
      ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
        validator(_: unknown, value: Dayjs) {
          if (!value) return Promise.resolve();
          const from = getFieldValue('allocationDate');
          if (from && !value.startOf('day').isAfter(dayjs(from).startOf('day'))) {
            return Promise.reject(
              new Error('Expected return date must be after the assignment date.'),
            );
          }
          if (value.isAfter(dayjs().add(ASSIGNMENT_MAX_RETURN_YEARS, 'year'))) {
            return Promise.reject(
              new Error('Expected return date is unrealistically far in the future.'),
            );
          }
          return Promise.resolve();
        },
      }),
    ],

    // R-09
    assignmentReason: [{ required: true, message: 'Select a reason for this assignment.' }],

    // R-10, R-11. The OTHER minimum is the service's own (ASSET_012), so a form
    // that passes here cannot be rejected on this rule at submit time.
    remarks: [
      { max: 500, message: 'Remarks cannot exceed 500 characters.' },
      ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
        validator(_: unknown, value: string) {
          if (getFieldValue('assignmentReason') !== 'OTHER') return Promise.resolve();
          if (!value || value.trim().length < ASSIGNMENT_OTHER_MIN_REMARKS) {
            return Promise.reject(
              new Error(
                `Please describe the reason (minimum ${ASSIGNMENT_OTHER_MIN_REMARKS} characters).`,
              ),
            );
          }
          return Promise.resolve();
        },
      }),
    ],
  };
}

/**
 * R-12 — handover-slip attachments. Returns the reason a file is unacceptable,
 * or null when it is fine. Checked before the file is queued, so nothing is
 * uploaded and then rejected.
 */
export function validateAssignmentAttachment(
  file: { name: string; size: number },
  alreadyQueued: number,
): string | null {
  const limit = `Only PDF/PNG/JPG up to ${ASSIGNMENT_ATTACHMENT_MAX_MB} MB are allowed (max ${ASSIGNMENT_ATTACHMENT_MAX_FILES} files).`;
  if (alreadyQueued >= ASSIGNMENT_ATTACHMENT_MAX_FILES) return limit;
  if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) return limit;
  if (file.size > ASSIGNMENT_ATTACHMENT_MAX_MB * 1024 * 1024) return limit;
  return null;
}

export const maintenanceFormRules = {
  maintenanceDate: [{ required: true, message: 'Date is required' }],
  issue: [
    { required: true, message: 'Issue description is required' },
    { max: 256, message: 'Max 256 characters' },
  ],
};
