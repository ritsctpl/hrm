"use client";

import React from "react";
import { Button, Select, Skeleton, Typography, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import LeaveBalanceCard from "../molecules/LeaveBalanceCard";
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
          <Button type="primary" icon={<PlusOutlined />} onClick={onApplyLeave}>
            Apply for Leave
          </Button>
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
          {balances.map((b) => (
            <LeaveBalanceCard key={b.leaveTypeCode} balance={b} />
          ))}
          {balances.length === 0 && (
            <Typography.Text type="secondary">
              No leave balances found for {year}.
            </Typography.Text>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
