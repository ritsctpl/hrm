"use client";

import React from "react";
import { Empty, Spin, Typography } from "antd";
import ApproverRequestRow from "../molecules/ApproverRequestRow";
import { ApproverInboxTableProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const ApproverInboxTable: React.FC<ApproverInboxTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
}) => {
  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading approvals..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.panelEmpty}>
        <Empty description="No pending approvals" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const slaBreachedCount = requests.filter((r) => r.slaBreached).length;

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>
          Pending Approvals ({requests.length})
          {slaBreachedCount > 0 && (
            <span style={{ color: "#ff4d4f", marginLeft: 8, fontSize: 12 }}>
              {slaBreachedCount} SLA breached
            </span>
          )}
        </Text>
      </div>
      {requests.map((req) => (
        <ApproverRequestRow
          key={req.handle}
          request={req}
          isSelected={req.handle === selectedHandle}
          onClick={onRowClick}
        />
      ))}
    </div>
  );
};

export default ApproverInboxTable;
