"use client";

import React from "react";
import { Typography } from "antd";
import DirectionTag from "../atoms/DirectionTag";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import { LedgerEntryRowProps } from "../../types/ui.types";
import { LEDGER_REF_TYPE_LABELS } from "../../utils/constants";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const LedgerEntryRow: React.FC<LedgerEntryRowProps> = ({ entry }) => {
  const date = new Date(entry.transactionDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className={styles.ledgerRow}>
      <div className={styles.ledgerRowLeft}>
        <Text style={{ fontSize: 12 }}>{date}</Text>
        <LeaveTypeTag code={entry.leaveTypeCode} />
        <Text type="secondary" style={{ fontSize: 11 }}>
          {LEDGER_REF_TYPE_LABELS[entry.refType] ?? entry.refType}
        </Text>
      </div>
      <div className={styles.ledgerRowRight}>
        <DirectionTag direction={entry.direction} />
        <Text strong style={{ fontSize: 13 }}>{entry.quantity.toFixed(1)}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Bal: {entry.balanceAfter.toFixed(1)}
        </Text>
      </div>
    </div>
  );
};

export default LedgerEntryRow;
