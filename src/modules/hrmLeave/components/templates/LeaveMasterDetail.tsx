"use client";

import React from "react";
import { LeaveMasterDetailProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const LeaveMasterDetail: React.FC<LeaveMasterDetailProps> = ({
  children,
  leftWidth = "40%",
}) => {
  const childArray = React.Children.toArray(children);
  const leftPanel = childArray[0];
  const rightPanel = childArray[1];

  return (
    <div className={styles.masterDetail}>
      <div className={styles.masterDetailLeft} style={{ width: leftWidth }}>
        {leftPanel}
      </div>
      <div className={styles.masterDetailDivider} />
      <div
        className={styles.masterDetailRight}
        style={{ width: `calc(100% - ${leftWidth} - 1px)` }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export default LeaveMasterDetail;
