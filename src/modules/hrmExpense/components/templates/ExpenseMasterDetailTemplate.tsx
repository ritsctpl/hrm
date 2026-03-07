"use client";

import React from "react";
import styles from "../../styles/Expense.module.css";

interface Props {
  listPanel: React.ReactNode;
  detailPanel: React.ReactNode;
  listWidth?: string;
}

const ExpenseMasterDetailTemplate: React.FC<Props> = ({
  listPanel,
  detailPanel,
  listWidth = "50%",
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

export default ExpenseMasterDetailTemplate;
