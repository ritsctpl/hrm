'use client';

import { Tag, Tooltip, Typography } from 'antd';
import { formatDate } from '../../utils/assetHelpers';
import { assignmentReasonLabel } from '../../utils/assetConstants';
import type { CustodyHistoryRowProps } from '../../types/ui.types';

export default function CustodyHistoryRow({ custody }: CustodyHistoryRowProps) {
  // Prefer the persisted assignmentType; fall back to inferring from a null
  // allocationRequestId for responses from a service build that predates the
  // field (request-based custody can only exist as the terminal step of an
  // approved request, so nothing else produces one).
  const isDirect = custody.assignmentType
    ? custody.assignmentType === 'DIRECT'
    : !custody.allocationRequestId;

  // Only DIRECT custody carries a reason — the service drops it on the
  // request-driven path, where the approved request is the justification.
  const reasonLabel = assignmentReasonLabel(custody.assignmentReason);
  const text = custody.remarks?.trim();
  const assigner = custody.assignedByName || custody.assignedBy;

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Typography.Text style={{ minWidth: 140 }}>{custody.employeeName}</Typography.Text>
      <Typography.Text type="secondary" style={{ minWidth: 100 }}>{formatDate(custody.fromDate)}</Typography.Text>
      <Typography.Text type="secondary" style={{ minWidth: 100 }}>
        {custody.toDate ? formatDate(custody.toDate) : <Tag color="green">Active</Tag>}
      </Typography.Text>

      {/* Origin. Colour is never the only signal — both variants carry text. */}
      {isDirect ? (
        <Tag color="orange" style={{ fontSize: 11, marginInlineEnd: 0 }}>Direct</Tag>
      ) : (
        <Tag color="blue" style={{ fontSize: 11, marginInlineEnd: 0 }}>
          {custody.allocationRequestId ?? 'Request'}
        </Tag>
      )}

      {/* A direct hand-out has no approval trail, so the reason and the person
          who authorised it are the only accountability the row carries — they
          belong on the row itself, not buried in a detail view. */}
      {isDirect && reasonLabel && (
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{reasonLabel}</Typography.Text>
      )}
      {isDirect && assigner && (
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>by {assigner}</Typography.Text>
      )}
      {text && (
        <Tooltip title={text}>
          <Typography.Text
            type="secondary"
            italic
            ellipsis
            style={{ fontSize: 11, maxWidth: 220 }}
          >
            &ldquo;{text}&rdquo;
          </Typography.Text>
        </Tooltip>
      )}
    </div>
  );
}
