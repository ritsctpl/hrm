"use client";

import React from "react";
import { Typography, Space, Button, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { PolicyVersion } from "../../types/domain.types";
import { VersionHistoryItemProps } from "../../types/ui.types";
import styles from "../../styles/PolicyViewer.module.css";

const { Text } = Typography;

const VersionHistoryItem: React.FC<VersionHistoryItemProps> = ({
  version,
  isCurrent,
  onDownload,
}) => (
  <div className={styles.versionItem}>
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      <Space>
        <Text strong>v{version.versionNumber}</Text>
        {isCurrent && <Tag color="blue">Current</Tag>}
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {new Date(version.publishedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </Text>
      <Text style={{ fontSize: 12 }}>{version.changesDescription}</Text>
      {onDownload && version.fileUrl && (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => onDownload(version)}
          style={{ padding: 0 }}
        >
          Download
        </Button>
      )}
    </Space>
  </div>
);

export default VersionHistoryItem;
