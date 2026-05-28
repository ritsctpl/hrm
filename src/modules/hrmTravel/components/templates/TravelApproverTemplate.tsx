"use client";

import React from "react";
import styles from "../../styles/Travel.module.css";

interface Props {
  pendingPanel: React.ReactNode;
  pendingCount: number;
}

const TravelApproverTemplate: React.FC<Props> = ({
  pendingPanel,
  pendingCount,
}) => {
  return (
    <div className={styles.landing}>
      {pendingPanel}
    </div>
  );
};

export default TravelApproverTemplate;
