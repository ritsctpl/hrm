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
  return (
    <div className={styles.masterDetail}>
      <div className={styles.listPanel} style={{ width: listWidth }}>
        {listPanel}
      </div>
      <div className={styles.detailPanel}>{detailPanel}</div>
    </div>
  );
};

export default TravelMasterDetailTemplate;
