'use client';

import { Timeline, Tag, Typography } from 'antd';
import { formatDateTime } from '../../utils/assetHelpers';
import type { AssetApprovalAction } from '../../types/domain.types';

const { Text } = Typography;

// Colour + human label per action verb recorded on the request's approval
// trail. Mirrors the Leave module's ActionHistoryTimeline so the two modules
// read consistently. Unknown verbs fall back to a neutral blue dot.
const ACTION_META: Record<string, { color: string; label: string }> = {
  SUBMIT: { color: 'blue', label: 'Submitted' },
  CREATE: { color: 'blue', label: 'Created' },
  UPDATE: { color: 'geekblue', label: 'Edited' },
  APPROVE_SUPERVISOR: { color: 'green', label: 'Approved (Supervisor)' },
  APPROVE_ADMIN: { color: 'green', label: 'Approved (Admin)' },
  APPROVE: { color: 'green', label: 'Approved' },
  REJECT_SUPERVISOR: { color: 'red', label: 'Rejected (Supervisor)' },
  REJECT_ADMIN: { color: 'red', label: 'Rejected (Admin)' },
  REJECT: { color: 'red', label: 'Rejected' },
  MOVE_NEXT: { color: 'purple', label: 'Moved to Next Supervisor' },
  ESCALATE: { color: 'volcano', label: 'Escalated' },
  ALLOCATE: { color: 'cyan', label: 'Allocated' },
  // Written by the backend when an asset is handed over with no request and no
  // approval chain. Deliberately amber rather than cyan so it reads as
  // distinct from a request-based allocation at a glance.
  DIRECT_ASSIGN: { color: 'orange', label: 'Assigned Directly' },
  PROCUREMENT: { color: 'gold', label: 'Marked for Procurement' },
  CANCEL: { color: 'default', label: 'Cancelled' },
};

interface AssetActionHistoryTimelineProps {
  actions: AssetApprovalAction[];
}

export default function AssetActionHistoryTimeline({ actions }: AssetActionHistoryTimelineProps) {
  if (!actions || actions.length === 0) {
    return <Text type="secondary">No action history available.</Text>;
  }

  return (
    <Timeline
      items={actions.map((action) => {
        const meta = ACTION_META[action.action] ?? { color: 'blue', label: action.action };
        return {
          color: meta.color,
          children: (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Tag color={meta.color} style={{ fontSize: 11 }}>{meta.label}</Tag>
                <Text strong style={{ fontSize: 12 }}>{action.actorName}</Text>
                {action.actorRole && (
                  <Text type="secondary" style={{ fontSize: 11 }}>({action.actorRole})</Text>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {formatDateTime(action.actionAt)}
              </Text>
              {action.remarks && (
                <Text style={{ fontSize: 12, fontStyle: 'italic' }}>&ldquo;{action.remarks}&rdquo;</Text>
              )}
            </div>
          ),
        };
      })}
    />
  );
}
