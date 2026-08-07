'use client';

import React from 'react';
import { Tooltip } from 'antd';
import Can from '../../../hrmAccess/components/Can';

const DENIED_HINT =
  'You do not have the timesheet approval right. Ask an administrator for Timesheet › Approval Queue (Edit).';

/**
 * Gate for approve / reject controls.
 *
 * hrm-service enforces the *object-level* grant `HRM_TIMESHEET / timesheet_approval / EDIT`
 * (`TimesheetAccessService.canApproveDirect`). A bare `<Can I="edit">` resolves the module
 * root object instead (`timesheet_module`), so a user with module edit but without the
 * approval right was offered a button the server would always refuse — one half of why
 * CT-2026-473 read as "Failed to process approval".
 *
 * The fallback shows the control greyed and unclickable rather than removing it: a button
 * that vanishes leaves the user with no idea why approving is impossible, which is the same
 * dead end in a quieter form.
 *
 * The object name is the BACKEND one (`timesheet_approval`), not the module's section alias
 * (`approvalQueue` in `utils/sectionMap.ts`). The section cache is keyed by
 * `permission.objectName` exactly as RBAC returns it, so an alias matches no key and
 * `useCan` denies a user who actually holds the grant — caught live: HRM_SUPER_ADMIN holds
 * `timesheet_approval/EDIT` and was still refused while this read `approvalQueue`. Every
 * other module passes the backend name too (`object="leave_request"`, `"leave_approval"`).
 */
const ApprovalGate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Can
    I="edit"
    object="timesheet_approval"
    fallback={
      <Tooltip title={DENIED_HINT}>
        {/* The outer span stays hoverable so the tooltip can explain the denial; the inner
            one swallows clicks. */}
        <span aria-disabled="true" style={{ display: 'inline-flex', cursor: 'not-allowed' }}>
          <span style={{ opacity: 0.35, pointerEvents: 'none', display: 'inline-flex' }}>
            {children}
          </span>
        </span>
      </Tooltip>
    }
  >
    {children}
  </Can>
);

export default ApprovalGate;
