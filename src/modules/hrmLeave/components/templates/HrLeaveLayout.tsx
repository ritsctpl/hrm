"use client";

import React from "react";
import { Tabs, Result } from "antd";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import styles from "../../styles/HrmLeave.module.css";

interface HrLeaveLayoutProps {
  queuePanel: React.ReactNode;
  ledgerPanel: React.ReactNode;
  accrualPanel: React.ReactNode;
  policyPanel: React.ReactNode;
  yearEndPanel: React.ReactNode;
  payrollPanel: React.ReactNode;
  reportsPanel: React.ReactNode;
  registerPanel: React.ReactNode;
  approvalConfigPanel: React.ReactNode;
  analyticsPanel: React.ReactNode;
}

const HrLeaveLayout: React.FC<HrLeaveLayoutProps> = ({
  queuePanel,
  ledgerPanel,
  accrualPanel,
  policyPanel,
  yearEndPanel,
  payrollPanel,
  reportsPanel,
  registerPanel,
  approvalConfigPanel,
  analyticsPanel,
}) => {
  const { activeHrTab, setActiveHrTab } = useHrmLeaveStore();

  // Filter out tabs where the user doesn't have permission (null panels)
  const availableTabs = [
    queuePanel && { key: "queue", label: "Requests" },
    ledgerPanel && { key: "ledger", label: "Ledger & Balances" },
    accrualPanel && { key: "accruals", label: "Accruals" },
    policyPanel && { key: "policy", label: "Policy" },
    yearEndPanel && { key: "yearEnd", label: "Year-End" },
    payrollPanel && { key: "payroll", label: "Payroll" },
    reportsPanel && { key: "reports", label: "Reports" },
    registerPanel && { key: "register", label: "Leave Register" },
    approvalConfigPanel && { key: "approvalConfig", label: "Approval Config" },
    analyticsPanel && { key: "analytics", label: "Analytics" },
  ].filter(Boolean);

  const contentMap: Record<string, React.ReactNode> = {
    queue: queuePanel,
    ledger: ledgerPanel,
    accruals: accrualPanel,
    policy: policyPanel,
    yearEnd: yearEndPanel,
    payroll: payrollPanel,
    reports: reportsPanel,
    register: registerPanel,
    approvalConfig: approvalConfigPanel,
    analytics: analyticsPanel,
  };

  // If no tabs are available, show access denied
  if (availableTabs.length === 0) {
    return (
      <div className={styles.hrLayout}>
        <Result
          status="403"
          title="Access Denied"
          subTitle="You don't have permission to access any HR Leave Management sections."
        />
      </div>
    );
  }

  // If current active tab is not available, switch to first available tab
  const currentContent = contentMap[activeHrTab];
  if (!currentContent && availableTabs.length > 0) {
    const firstAvailableTab = availableTabs[0].key;
    setActiveHrTab(firstAvailableTab);
  }

  return (
    <div className={styles.hrLayout}>
      <Tabs
        activeKey={activeHrTab}
        onChange={setActiveHrTab}
        items={availableTabs}
        size="small"
        className={styles.hrLayoutTabs}
      />
      <div className={styles.hrLayoutContent}>
        {currentContent || (
          <Result
            status="403"
            title="Access Denied"
            subTitle="You don't have permission to access this section."
          />
        )}
      </div>
    </div>
  );
};

export default HrLeaveLayout;
