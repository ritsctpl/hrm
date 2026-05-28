"use client";

import React from "react";
import { Button, Select, Skeleton, Typography, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import LeaveBalanceCard from "../molecules/LeaveBalanceCard";
import Can from "../../../hrmAccess/components/Can";
import { EmployeeDashboardProps } from "../../types/ui.types";
import { buildYearOptions } from "../../utils/transformations";
import styles from "../../styles/HrmLeave.module.css";

const { Title } = Typography;

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  balances,
  year,
  onYearChange,
  onApplyLeave,
  loading,
}) => {
  const yearOptions = buildYearOptions(new Date().getFullYear());

  // Hide tiles where both the available balance and the pending count are
  // zero — empty cards just waste space on the dashboard. Coerce defensively
  // in case the backend returns the numbers as strings.
  const visibleBalances = React.useMemo(
    () =>
      balances.filter((b) => {
        const available = Number(b.availableBalance) || 0;
        const pending = Number(b.pendingApproval) || 0;
        return available > 0 || pending > 0;
      }),
    [balances],
  );

  return (
    <div className={styles.dashboardSection}>
      <div className={styles.dashboardHeader}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Leave Year:
          </Title>
          <Select
            value={year}
            options={yearOptions}
            onChange={onYearChange}
            style={{ width: 100 }}
          />
        </Space>
        {onApplyLeave && (
          <Can I="add" object="leave_request" passIf={true}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onApplyLeave}>
              Apply for Leave
            </Button>
          </Can>
        )}
      </div>

      {loading ? (
        <div className={styles.balanceGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton.Button key={i} active style={{ height: 120, width: "100%" }} />
          ))}
        </div>
      ) : (
        <div className={styles.balanceGrid}>
          {visibleBalances.map((b) => (
            <LeaveBalanceCard key={b.leaveTypeCode} balance={b} />
          ))}
          {visibleBalances.length === 0 && (
            <Typography.Text type="secondary">
              {balances.length === 0
                ? `No leave balances found for ${year}.`
                : `All leave types are exhausted with no pending requests for ${year}.`}
            </Typography.Text>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
