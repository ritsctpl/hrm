"use client";

import React from "react";
import { Tabs } from "antd";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import styles from "../../styles/HrmLeave.module.css";

interface EmployeeLeaveLayoutProps {
  requestsPanel: React.ReactNode;
  calendarPanel: React.ReactNode;
  ledgerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const EmployeeLeaveLayout: React.FC<EmployeeLeaveLayoutProps> = ({
  requestsPanel,
  calendarPanel,
  ledgerPanel,
  rightPanel,
}) => {
  const { activeTab, setActiveTab } = useHrmLeaveStore();

  const tabItems = [
    { key: "requests", label: "My Requests", children: requestsPanel },
    { key: "calendar", label: "Calendar", children: calendarPanel },
    { key: "ledger", label: "Ledger History", children: ledgerPanel },
  ];

  return (
    <div className={styles.employeeLayout}>
      <div className={styles.employeeLayoutLeft}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
          style={{ height: "100%" }}
        />
      </div>
      <div className={styles.employeeLayoutRight}>{rightPanel}</div>
    </div>
  );
};

export default EmployeeLeaveLayout;
