"use client";

import React from "react";
import { Tabs } from "antd";
import { useHrmTravelStore } from "../../stores/hrmTravelStore";
import type { InboxTab } from "../../types/ui.types";
import styles from "../../styles/Travel.module.css";

interface Props {
  pendingPanel: React.ReactNode;
  escalatedPanel: React.ReactNode;
  decidedPanel: React.ReactNode;
  pendingCount: number;
  escalatedCount: number;
}

const TravelApproverTemplate: React.FC<Props> = ({
  pendingPanel,
  escalatedPanel,
  decidedPanel,
  pendingCount,
  escalatedCount,
}) => {
  const { activeInboxTab, setActiveInboxTab } = useHrmTravelStore();

  return (
    <div className={styles.landing}>
      <Tabs
        activeKey={activeInboxTab}
        onChange={(k) => setActiveInboxTab(k as InboxTab)}
        style={{ flex: 1, overflow: "hidden" }}
        items={[
          { key: "pending", label: `Pending (${pendingCount})`, children: pendingPanel },
          { key: "escalated", label: `Escalated (${escalatedCount})`, children: escalatedPanel },
          { key: "decided", label: "Decided", children: decidedPanel },
        ]}
      />
    </div>
  );
};

export default TravelApproverTemplate;
