"use client";

import React from "react";
import { Empty, Spin, Typography, Button } from "antd";
import ApproverRequestRow from "../molecules/ApproverRequestRow";
import Can from "../../../hrmAccess/components/Can";
import { HrGlobalQueueTableProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const HrGlobalQueueTable: React.FC<HrGlobalQueueTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
}) => {
  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading queue..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.panelEmpty}>
        <Empty description="No requests in queue" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const wfhCount = requests.filter((r) => r.leaveTypeCode === "WFH").length;

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>Global Queue ({requests.length})</Text>
        {wfhCount > 0 && (
          <Can I="edit" object="leave_hr_queue" passIf={true}>
            <Button size="small" type="link">
              Batch Approve WFH ({wfhCount})
            </Button>
          </Can>
        )}
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

export default HrGlobalQueueTable;
