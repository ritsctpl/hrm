"use client";

import React from "react";
import { Space, Tag, Tooltip, Typography } from "antd";
import { formatDateTime, isPast } from "@/utils/dateUtils";
import { useEmployeeNames } from "../../hooks/useEmployeeNames";
import type { Announcement } from "../../types/domain.types";

const { Text } = Typography;

interface ApprovalStatusLineProps {
  announcement: Announcement;
  /**
   * "compact" is a table cell — one line. "detail" adds the escalation origin
   * and the SLA date for the drawer.
   */
  variant?: "compact" | "detail";
  /**
   * The viewer's employee code. When they are the one holding it, say so —
   * an inbox row reading "in approval with <your own name>" is a riddle.
   */
  actorId?: string;
}

/** currentApproverId is the truth; nextApprovers mirrors it in a single slot. */
export const approverOf = (a: Announcement): string | undefined =>
  a.currentApproverId ?? a.nextApprovers?.[0] ?? undefined;

/**
 * Who an announcement is with.
 *
 * There is one approver at a time — the author's reporting manager, then
 * whoever is above them once an unanswered request escalates, then HR. The
 * supervisor it started with is kept as context so they can still see where it
 * went; it is never something they act on from here.
 */
const ApprovalStatusLine: React.FC<ApprovalStatusLineProps> = ({
  announcement,
  variant = "compact",
  actorId,
}) => {
  const { nameOf } = useEmployeeNames();
  const approver = approverOf(announcement);
  const escalated = (announcement.escalationLevel ?? 0) > 0;
  // Set only when the SLA lapsed with nowhere left to escalate — the item is
  // parked, so say so rather than showing a countdown that will never move.
  const stalled = !!announcement.slaBreached;
  const origin = announcement.supervisorId;
  const overdue = !stalled && isPast(announcement.slaDeadline);

  // Decided already: the approver is cleared, so say who decided instead of
  // leaving the panel silent about how it got published.
  if (!approver) {
    const decision =
      announcement.approvedBy
        ? { verb: "Approved", who: announcement.approvedBy, when: announcement.approvedAt }
        : announcement.rejectedBy
          ? { verb: "Rejected", who: announcement.rejectedBy, when: announcement.rejectedAt }
          : announcement.returnedBy
            ? { verb: "Returned", who: announcement.returnedBy, when: announcement.returnedAt }
            : null;

    if (!decision) return <Text type="secondary">—</Text>;
    return (
      <Text type="secondary">
        {decision.verb} by {nameOf(decision.who)}
        {decision.when ? ` on ${formatDateTime(decision.when)}` : ""}
      </Text>
    );
  }

  return (
    <Space direction="vertical" size={2}>
      <Space size={4} wrap>
        <Text>
          {/* The whole state in one phrase — "With: X" alone never says that a
              decision is outstanding. */}
          {actorId && approver === actorId ? (
            <Text strong>In approval — waiting on you</Text>
          ) : (
            <>
              In approval with <Text strong>{nameOf(approver)}</Text>
            </>
          )}
        </Text>
        {escalated && (
          <Tooltip title="Nobody answered in time, so it moved up the reporting chain">
            <Tag color="orange">escalated</Tag>
          </Tooltip>
        )}
        {stalled && (
          <Tooltip title="The approval SLA lapsed and there is nobody further up to escalate to">
            <Tag color="red">stalled</Tag>
          </Tooltip>
        )}
        {overdue && !escalated && <Tag color="gold">overdue</Tag>}
      </Space>
      {variant === "detail" && origin && origin !== approver && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Originally with {nameOf(origin)}
        </Text>
      )}
      {variant === "detail" && announcement.slaDeadline && !stalled && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Due {formatDateTime(announcement.slaDeadline)}
        </Text>
      )}
    </Space>
  );
};

export default ApprovalStatusLine;
