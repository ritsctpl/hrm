"use client";

import React, { useState } from "react";
import { Empty, Spin, Typography } from "antd";
import { getOrganizationId } from '@/utils/cookieUtils';
import LeaveRequestRow from "../molecules/LeaveRequestRow";
import AmendLeavePanel from "./AmendLeavePanel";
import { LeaveRequestsTableProps } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
}) => {
  const organizationId = getOrganizationId();

  const [amendOpen, setAmendOpen] = useState(false);
  const [amendTarget, setAmendTarget] = useState<LeaveRequest | null>(null);

  const handleAmend = (request: LeaveRequest) => {
    setAmendTarget(request);
    setAmendOpen(true);
  };

  const handleAmendClose = () => {
    setAmendOpen(false);
    setAmendTarget(null);
  };

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading requests..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.panelEmpty}>
        <Empty description="No leave requests found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>My Leave Requests ({requests.length})</Text>
      </div>
      {requests.map((req) => (
        <LeaveRequestRow
          key={req.handle}
          request={req}
          isSelected={req.handle === selectedHandle}
          onClick={onRowClick}
          onAmend={handleAmend}
        />
      ))}
      <AmendLeavePanel
        open={amendOpen}
        organizationId={organizationId}
        request={amendTarget}
        onClose={handleAmendClose}
        onAmended={handleAmendClose}
      />
    </div>
  );
};

export default LeaveRequestsTable;
