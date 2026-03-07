"use client";

import React from "react";
import { Button, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  title: string;
  extra?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
}

const TravelScreenHeader: React.FC<Props> = ({ title, extra, actions, onBack }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        gap: 12,
        flexShrink: 0,
      }}
    >
      {onBack && (
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ padding: "4px 8px" }}
        />
      )}
      <Text strong style={{ fontSize: 15, flex: 1 }}>
        {title}
      </Text>
      {extra && <span>{extra}</span>}
      {actions && <Space>{actions}</Space>}
    </div>
  );
};

export default TravelScreenHeader;
