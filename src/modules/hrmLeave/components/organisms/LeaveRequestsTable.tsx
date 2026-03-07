"use client";

import React from "react";
import { Empty, Spin, Typography } from "antd";
import LeaveRequestRow from "../molecules/LeaveRequestRow";
import { LeaveRequestsTableProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
}) => {
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
        />
      ))}
    </div>
  );
};

export default LeaveRequestsTable;
