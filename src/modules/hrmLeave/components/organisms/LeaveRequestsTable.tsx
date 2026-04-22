"use client";

import React, { useMemo, useState } from "react";
import { Empty, Select, Spin, Typography } from "antd";
import { getOrganizationId } from '@/utils/cookieUtils';
import LeaveRequestRow from "../molecules/LeaveRequestRow";
import AmendLeavePanel from "./AmendLeavePanel";
import { LeaveRequestsTableProps } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import { buildYearOptions } from "../../utils/transformations";
import { LEAVE_STATUS_LABELS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const statusFilterOptions = Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
}) => {
  const organizationId = getOrganizationId();

  const [amendOpen, setAmendOpen] = useState(false);
  const [amendTarget, setAmendTarget] = useState<LeaveRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  const handleAmend = (request: LeaveRequest) => {
    setAmendTarget(request);
    setAmendOpen(true);
  };

  const handleAmendClose = () => {
    setAmendOpen(false);
    setAmendTarget(null);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter && req.status !== statusFilter) return false;
      const reqYear = new Date(req.startDate).getFullYear();
      if (yearFilter && reqYear !== yearFilter) return false;
      return true;
    });
  }, [requests, statusFilter, yearFilter]);

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading requests..." />
      </div>
    );
  }

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>My Leave Requests ({filteredRequests.length})</Text>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <Select
          placeholder="Status"
          allowClear
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={statusFilterOptions}
          style={{ width: 170 }}
          size="small"
        />
        <Select
          value={yearFilter}
          onChange={(val) => setYearFilter(val)}
          options={buildYearOptions(new Date().getFullYear())}
          style={{ width: 90 }}
          size="small"
        />
      </div>
      {filteredRequests.length === 0 ? (
        <div className={styles.panelEmpty}>
          <Empty description="No leave requests found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        filteredRequests.map((req) => (
          <LeaveRequestRow
            key={req.handle}
            request={req}
            isSelected={req.handle === selectedHandle}
            onClick={onRowClick}
            onAmend={handleAmend}
          />
        ))
      )}
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
