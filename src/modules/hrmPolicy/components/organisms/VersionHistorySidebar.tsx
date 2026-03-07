"use client";

import React from "react";
import { Typography, Spin } from "antd";
import { PolicyVersion } from "../../types/domain.types";
import VersionHistoryItem from "../molecules/VersionHistoryItem";
import styles from "../../styles/PolicyViewer.module.css";

interface VersionHistorySidebarProps {
  versions: PolicyVersion[];
  currentVersion: string;
  loading: boolean;
  onDownload?: (version: PolicyVersion) => void;
}

const VersionHistorySidebar: React.FC<VersionHistorySidebarProps> = ({
  versions,
  currentVersion,
  loading,
  onDownload,
}) => (
  <div className={styles.versionSidebar}>
    <Typography.Text strong className={styles.sidebarTitle}>
      VERSION HISTORY
    </Typography.Text>
    {loading ? (
      <Spin size="small" />
    ) : (
      <div className={styles.versionList}>
        {versions.map((v) => (
          <VersionHistoryItem
            key={v.versionNumber}
            version={v}
            isCurrent={v.versionNumber === currentVersion}
            onDownload={onDownload}
          />
        ))}
      </div>
    )}
  </div>
);

export default VersionHistorySidebar;
