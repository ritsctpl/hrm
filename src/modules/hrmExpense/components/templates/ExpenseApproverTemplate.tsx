"use client";

import React from "react";
import { Tabs } from "antd";
import { useHrmExpenseStore } from "../../stores/hrmExpenseStore";
import type { ExpenseInboxTab } from "../../types/ui.types";

interface Props {
  pendingPanel: React.ReactNode;
  escalatedPanel: React.ReactNode;
  decidedPanel: React.ReactNode;
  pendingCount: number;
  escalatedCount: number;
}

const ExpenseApproverTemplate: React.FC<Props> = ({
  pendingPanel,
  escalatedPanel,
  decidedPanel,
  pendingCount,
  escalatedCount,
}) => {
  const { activeInboxTab, setActiveInboxTab } = useHrmExpenseStore();

  return (
    <Tabs
      activeKey={activeInboxTab}
      onChange={(k) => setActiveInboxTab(k as ExpenseInboxTab)}
      items={[
        { key: "pending", label: `Pending (${pendingCount})`, children: pendingPanel },
        { key: "escalated", label: `Escalated (${escalatedCount})`, children: escalatedPanel },
        { key: "decided", label: "Decided", children: decidedPanel },
      ]}
    />
  );
};

export default ExpenseApproverTemplate;
