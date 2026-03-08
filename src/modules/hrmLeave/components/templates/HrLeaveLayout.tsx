"use client";

import React from "react";
import { Tabs } from "antd";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import styles from "../../styles/HrmLeave.module.css";

interface HrLeaveLayoutProps {
  queuePanel: React.ReactNode;
  ledgerPanel: React.ReactNode;
  accrualPanel: React.ReactNode;
  policyPanel: React.ReactNode;
}

const HrLeaveLayout: React.FC<HrLeaveLayoutProps> = ({
  queuePanel,
  ledgerPanel,
  accrualPanel,
  policyPanel,
}) => {
  const { activeHrTab, setActiveHrTab } = useHrmLeaveStore();

  const items = [
    { key: "queue", label: "Requests" },
    { key: "ledger", label: "Ledger & Balances" },
    { key: "accruals", label: "Accruals" },
    { key: "policy", label: "Policy" },
  ];

  const contentMap: Record<string, React.ReactNode> = {
    queue: queuePanel,
    ledger: ledgerPanel,
    accruals: accrualPanel,
    policy: policyPanel,
  };

  return (
    <div className={styles.hrLayout}>
      <Tabs
        activeKey={activeHrTab}
        onChange={setActiveHrTab}
        items={items}
        size="small"
        className={styles.hrLayoutTabs}
      />
      <div className={styles.hrLayoutContent}>{contentMap[activeHrTab]}</div>
    </div>
  );
};

export default HrLeaveLayout;
