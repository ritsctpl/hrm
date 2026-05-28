"use client";

import React from "react";
import styles from "../../styles/Travel.module.css";

interface Props {
  listPanel: React.ReactNode;
  detailPanel: React.ReactNode;
  listWidth?: string;
}

const TravelMasterDetailTemplate: React.FC<Props> = ({
  listPanel,
  detailPanel,
  listWidth = "55%",
}) => {
  // Check if detailPanel is showing actual content (not the empty state)
  // Empty state is a div with emptyState class
  const isEmptyState =
    React.isValidElement(detailPanel) &&
    detailPanel.type === "div" &&
    (detailPanel.props as Record<string, unknown>)?.className?.toString().includes("emptyState");

  const hasDetail = detailPanel && !isEmptyState;
  const finalListWidth = hasDetail ? listWidth : "100%";

  return (
    <div className={styles.masterDetail}>
      <div className={styles.listPanel} style={{ width: finalListWidth }}>
        {listPanel}
      </div>
      {hasDetail && <div className={styles.detailPanel}>{detailPanel}</div>}
    </div>
  );
};

export default TravelMasterDetailTemplate;
