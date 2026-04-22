"use client";

import React from "react";
import { Tabs } from "antd";
import { useHrmExpenseStore } from "../../stores/hrmExpenseStore";
import type { ExpenseInboxTab } from "../../types/ui.types";

interface Props {
  inboxKind: "supervisor" | "finance";
  pendingPanel: React.ReactNode;
  escalatedPanel: React.ReactNode;
  decidedPanel: React.ReactNode;
  pendingCount: number;
  escalatedCount: number;
}

const ExpenseApproverTemplate: React.FC<Props> = ({
  inboxKind,
  pendingPanel,
  escalatedPanel,
  decidedPanel,
  pendingCount,
  escalatedCount,
}) => {
  const {
    activeSupervisorInboxTab,
    activeFinanceInboxTab,
    setActiveSupervisorInboxTab,
    setActiveFinanceInboxTab,
  } = useHrmExpenseStore();

  const activeTab = inboxKind === "supervisor" ? activeSupervisorInboxTab : activeFinanceInboxTab;
  const setActiveTab =
    inboxKind === "supervisor" ? setActiveSupervisorInboxTab : setActiveFinanceInboxTab;

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(k) => setActiveTab(k as ExpenseInboxTab)}
      items={[
        { key: "pending", label: `Pending (${pendingCount})`, children: pendingPanel },
        { key: "escalated", label: `Escalated (${escalatedCount})`, children: escalatedPanel },
        { key: "decided", label: "Decided", children: decidedPanel },
      ]}
    />
  );
};

export default ExpenseApproverTemplate;
