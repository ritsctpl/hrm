"use client";

import React from "react";
import { Row, Col, Typography, Space, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { PolicyListRowProps } from "../../types/ui.types";
import PolicyTypeBadge from "../atoms/PolicyTypeBadge";
import PolicyStatusTag from "../atoms/PolicyStatusTag";
import styles from "../../styles/PolicyLanding.module.css";

const { Text } = Typography;

const PolicyListRow: React.FC<PolicyListRowProps> = ({
  policy,
  onClick,
  onEdit,
}) => (
  <Row
    className={styles.policyListRow}
    align="middle"
    gutter={8}
    onClick={() => onClick(policy)}
  >
    <Col flex="auto">
      <Space>
        <PolicyTypeBadge docType={policy.documentType} />
        <Text strong>{policy.title}</Text>
        <Text type="secondary">v{policy.currentVersion}</Text>
        <PolicyStatusTag status={policy.status} />
      </Space>
    </Col>
    <Col>
      <Text type="secondary">{policy.categoryName}</Text>
    </Col>
    {onEdit && (
      <Col>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(policy);
          }}
        />
      </Col>
    )}
  </Row>
);

export default PolicyListRow;
