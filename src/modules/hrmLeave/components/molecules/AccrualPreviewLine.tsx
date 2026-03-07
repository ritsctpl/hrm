"use client";

import React from "react";
import { Typography, Tag, Tooltip } from "antd";
import { AccrualPreviewLineProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const AccrualPreviewLine: React.FC<AccrualPreviewLineProps> = ({ line }) => {
  return (
    <div className={`${styles.accrualLine} ${line.excluded ? styles.accrualLineExcluded : ""}`}>
      <div className={styles.accrualLineLeft}>
        <Text strong={!line.excluded} type={line.excluded ? "secondary" : undefined}>
          {line.employeeName}
        </Text>
        <Tag style={{ marginLeft: 8 }}>{line.leaveTypeCode}</Tag>
        {line.prorated && (
          <Tooltip title={line.prorateReason ?? "Prorated"}>
            <Tag color="orange" style={{ fontSize: 10 }}>Prorated</Tag>
          </Tooltip>
        )}
        {line.excluded && <Tag color="default" style={{ fontSize: 10 }}>Excluded</Tag>}
      </div>
      <Text style={{ fontWeight: 600 }}>
        {line.excluded ? "–" : `+${line.daysToCredit.toFixed(1)}d`}
      </Text>
    </div>
  );
};

export default AccrualPreviewLine;
