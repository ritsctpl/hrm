"use client";

import React from "react";
import { Card, Input, InputNumber, Select, Button, Space, Row, Col, Alert, Typography, Tooltip } from "antd";
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { ApprovalLevelDefinition } from "../../types/api.types";
import {
  RESOLVER_TYPES,
  RESOLVER_WITHOUT_VALUE,
  ON_BREACH_OPTIONS,
  ON_EMPTY_OPTIONS,
} from "../../utils/constants";

const { Text } = Typography;

interface ApprovalLevelEditorProps {
  level: ApprovalLevelDefinition;
  index: number;
  total: number;
  disabled?: boolean;
  onChange: (patch: Partial<ApprovalLevelDefinition>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

/** One rung of a route (handover §6.5). `level` is positional, never typed by hand. */
const ApprovalLevelEditor: React.FC<ApprovalLevelEditorProps> = ({
  level,
  index,
  total,
  disabled,
  onChange,
  onRemove,
  onMove,
}) => {
  const needsValue = level.resolverType !== RESOLVER_WITHOUT_VALUE;
  const resolverHint = RESOLVER_TYPES.find((r) => r.value === level.resolverType)?.hint;

  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      title={<Text strong style={{ fontSize: 13 }}>Level {level.level}</Text>}
      extra={
        <Space size={4}>
          <Tooltip title="Move up">
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={disabled || index === 0}
              onClick={() => onMove(-1)}
            />
          </Tooltip>
          <Tooltip title="Move down">
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={disabled || index === total - 1}
              onClick={() => onMove(1)}
            />
          </Tooltip>
          <Tooltip title="Remove level">
            <Button size="small" danger icon={<DeleteOutlined />} disabled={disabled} onClick={onRemove} />
          </Tooltip>
        </Space>
      }
    >
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Text type="secondary" style={{ fontSize: 12 }}>Level code</Text>
          <Input
            size="small"
            placeholder="e.g. HR_HEAD"
            value={level.levelCode}
            disabled={disabled}
            onChange={(e) => onChange({ levelCode: e.target.value })}
          />
        </Col>
        <Col span={12}>
          <Text type="secondary" style={{ fontSize: 12 }}>SLA (hours)</Text>
          <InputNumber
            size="small"
            min={1}
            style={{ width: "100%" }}
            value={level.slaHours}
            disabled={disabled}
            onChange={(v) => onChange({ slaHours: Number(v ?? 24) })}
          />
        </Col>

        <Col span={12}>
          <Text type="secondary" style={{ fontSize: 12 }}>Resolver type</Text>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={level.resolverType}
            disabled={disabled}
            options={RESOLVER_TYPES.map((r) => ({ value: r.value, label: r.label }))}
            onChange={(v) =>
              onChange({
                resolverType: v,
                // Clear a stale value when switching to the one type that has none.
                resolverValue: v === RESOLVER_WITHOUT_VALUE ? undefined : level.resolverValue,
              })
            }
          />
        </Col>
        <Col span={12}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Resolver value {needsValue && <Text type="danger">*</Text>}
          </Text>
          <Input
            size="small"
            placeholder={needsValue ? resolverHint : "Not required"}
            value={level.resolverValue ?? ""}
            disabled={disabled || !needsValue}
            onChange={(e) => onChange({ resolverValue: e.target.value })}
          />
        </Col>

        <Col span={12}>
          <Text type="secondary" style={{ fontSize: 12 }}>On SLA breach</Text>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={level.onBreach}
            disabled={disabled}
            options={ON_BREACH_OPTIONS}
            onChange={(v) => onChange({ onBreach: v })}
          />
        </Col>
        <Col span={12}>
          <Text type="secondary" style={{ fontSize: 12 }}>If no approver found</Text>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={level.onEmpty}
            disabled={disabled}
            options={ON_EMPTY_OPTIONS}
            onChange={(v) => onChange({ onEmpty: v })}
          />
        </Col>
      </Row>

      {/* AUTO_APPROVE is off by default for a reason — make the cost explicit. */}
      {level.onBreach === "AUTO_APPROVE" && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
          message="Auto-approve advances the chain unreviewed"
          description="If this level misses its SLA the announcement moves on with nobody having read it. Use sparingly."
        />
      )}
    </Card>
  );
};

export default ApprovalLevelEditor;
