"use client";

import { Space, Tag, Typography } from "antd";
import type { EmpAssetRowProps } from "../../types/ui.types";
import { ASSET_CONDITION_COLORS } from "../../utils/constants";

const { Text } = Typography;

export default function EmpAssetRow({
  assetName,
  serialNumber,
  assetType,
  condition,
  issuedDate,
  returnedDate,
}: EmpAssetRowProps) {
  const conditionColor = ASSET_CONDITION_COLORS[condition] || "default";

  return (
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <Space>
        <Text strong style={{ fontSize: 13 }}>
          {assetName}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          SN: {serialNumber}
        </Text>
        <Tag>{assetType}</Tag>
      </Space>
      <Space>
        <Text style={{ fontSize: 12 }}>Issued: {issuedDate}</Text>
        {returnedDate && <Text style={{ fontSize: 12 }}>Returned: {returnedDate}</Text>}
        <Tag color={conditionColor}>{condition}</Tag>
      </Space>
    </Space>
  );
}
