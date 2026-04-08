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
    gutter={16}
    onClick={() => onClick(policy)}
    style={{ width: '100%' }}
  >
    <Col flex="0 0 150px">
      <Text type="secondary" style={{ fontSize: 13 }}>{policy.policyCode}</Text>
    </Col>
    <Col flex="1 1 250px">
      <Text strong style={{ fontSize: 14 }}>{policy.title}</Text>
    </Col>
    <Col flex="0 0 100px">
      <PolicyTypeBadge docType={policy.documentType} />
    </Col>
    <Col flex="0 0 80px">
      <Text type="secondary" style={{ fontSize: 13 }}>v{policy.currentVersion}</Text>
    </Col>
    <Col flex="0 0 180px">
      <Text type="secondary">{policy.categoryName}</Text>
    </Col>
    <Col flex="0 0 100px">
      <PolicyStatusTag status={policy.status} />
    </Col>
    {onEdit && (
      <Col flex="0 0 50px">
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
