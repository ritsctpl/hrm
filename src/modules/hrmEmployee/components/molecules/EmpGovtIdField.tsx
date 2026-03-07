"use client";

import { Button, Input, Space, Tag, Typography } from "antd";
import { CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import type { EmpGovtIdFieldProps } from "../../types/ui.types";
import { maskGovtId } from "../../utils/empRoleFilter";

const { Text } = Typography;

export default function EmpGovtIdField({
  idType,
  idNumber,
  verified,
  isEditing,
  onRemove,
}: EmpGovtIdFieldProps) {
  const displayValue = !isEditing ? maskGovtId(idNumber, idType) : idNumber;

  return (
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <Space>
        <Tag color="blue" style={{ minWidth: 72, textAlign: "center", fontWeight: 600 }}>
          {idType}
        </Tag>
        {isEditing ? (
          <Input value={idNumber} style={{ width: 200 }} readOnly />
        ) : (
          <Text code style={{ fontSize: 13 }}>
            {displayValue}
          </Text>
        )}
        {verified && (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Verified
          </Tag>
        )}
      </Space>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </Space>
  );
}
