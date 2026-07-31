"use client";

import React from "react";
import { Card, Switch, Button, Space, Typography, Alert, Spin, InputNumber, Empty, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ApprovalPolicy, ApprovalLevelDefinition } from "../../types/api.types";
import { PRIORITY_LABELS, RESOLVER_WITHOUT_VALUE } from "../../utils/constants";
import ApprovalLevelEditor from "../molecules/ApprovalLevelEditor";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Text, Title } = Typography;

const newLevel = (level: number): ApprovalLevelDefinition => ({
  level,
  levelCode: "",
  resolverType: "PERMISSION",
  resolverValue: "",
  slaHours: 24,
  onBreach: "REMIND",
  onEmpty: "FAIL",
});

/** Levels are positional — renumber after any add/remove/move. */
const renumber = (levels: ApprovalLevelDefinition[]): ApprovalLevelDefinition[] =>
  levels.map((l, i) => ({ ...l, level: i + 1 }));

/**
 * Client-side mirror of the server's validation, so the obvious mistakes are
 * caught before the round trip. The server is still the authority — its 422
 * message is surfaced verbatim when it disagrees.
 */
function validate(policy: ApprovalPolicy): string | null {
  if (!policy.approvalRequired) return null;
  if (!policy.levels.length) return "Approval is required but no levels are defined.";
  for (const l of policy.levels) {
    if (!l.levelCode?.trim()) return `Level ${l.level} needs a level code.`;
    if (l.resolverType !== RESOLVER_WITHOUT_VALUE && !l.resolverValue?.trim()) {
      return `Level ${l.level} needs a resolver value for ${l.resolverType}.`;
    }
  }
  const codes = policy.levels.map((l) => l.level);
  if (new Set(codes).size !== codes.length) return "Duplicate level numbers.";
  return null;
}

interface PolicyCardProps {
  policy: ApprovalPolicy;
  saving: boolean;
  onSave: (policy: ApprovalPolicy) => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, saving, onSave }) => {
  const [draft, setDraft] = React.useState<ApprovalPolicy>(policy);
  const [dirty, setDirty] = React.useState(false);

  // Re-seed when the server hands back a new version of this policy.
  React.useEffect(() => {
    setDraft(policy);
    setDirty(false);
  }, [policy]);

  const patch = (p: Partial<ApprovalPolicy>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDirty(true);
  };

  const patchLevel = (index: number, levelPatch: Partial<ApprovalLevelDefinition>) => {
    setDraft((d) => ({
      ...d,
      levels: d.levels.map((l, i) => (i === index ? { ...l, ...levelPatch } : l)),
    }));
    setDirty(true);
  };

  const moveLevel = (index: number, direction: -1 | 1) => {
    setDraft((d) => {
      const next = [...d.levels];
      const target = index + direction;
      if (target < 0 || target >= next.length) return d;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, levels: renumber(next) };
    });
    setDirty(true);
  };

  const isEmergency = draft.priority === "EMERGENCY";
  const problem = validate(draft);

  const handleSave = () => {
    if (problem) {
      message.error(problem);
      return;
    }
    onSave(draft);
  };

  return (
    <Card
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            {PRIORITY_LABELS[draft.priority as keyof typeof PRIORITY_LABELS] ?? draft.priority}
          </Title>
          {draft.systemDefined && <Tag>shipped default</Tag>}
          {dirty && <Tag color="orange">unsaved</Tag>}
        </Space>
      }
      extra={
        <Button type="primary" size="small" loading={saving} disabled={!dirty} onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space size={24} wrap>
          <Space>
            <Switch
              checked={!!draft.approvalRequired}
              onChange={(v) => patch({ approvalRequired: v })}
            />
            <Text>Approval required</Text>
          </Space>
          <Space>
            <Switch
              checked={!!draft.emailOnPublish}
              onChange={(v) => patch({ emailOnPublish: v })}
            />
            <Text>Email on publish</Text>
          </Space>
          <Space>
            <Switch
              checked={!!draft.acknowledgementRequired}
              onChange={(v) => patch({ acknowledgementRequired: v })}
            />
            <Text>Acknowledgement required</Text>
          </Space>
          {isEmergency && (
            <Space>
              <Text>Ratification window</Text>
              <InputNumber
                size="small"
                min={1}
                max={168}
                value={draft.ratificationHours ?? 24}
                onChange={(v) => patch({ ratificationHours: Number(v ?? 24) })}
                addonAfter="h"
              />
            </Space>
          )}
        </Space>

        {!draft.approvalRequired ? (
          <Alert
            type="info"
            showIcon
            message="Publishes directly — levels below are ignored while approval is off."
          />
        ) : (
          <>
            {draft.levels.map((l, i) => (
              <ApprovalLevelEditor
                key={i}
                level={l}
                index={i}
                total={draft.levels.length}
                onChange={(p) => patchLevel(i, p)}
                onRemove={() => {
                  setDraft((d) => ({ ...d, levels: renumber(d.levels.filter((_, j) => j !== i)) }));
                  setDirty(true);
                }}
                onMove={(dir) => moveLevel(i, dir)}
              />
            ))}
            <Button
              icon={<PlusOutlined />}
              size="small"
              onClick={() => {
                setDraft((d) => ({ ...d, levels: renumber([...d.levels, newLevel(d.levels.length + 1)]) }));
                setDirty(true);
              }}
            >
              Add level
            </Button>
            {problem && <Alert type="warning" showIcon message={problem} />}
          </>
        )}
      </Space>
    </Card>
  );
};

interface ApprovalPolicyAdminProps {
  policies: ApprovalPolicy[];
  loading: boolean;
  savingPriority: string | null;
  onSave: (policy: ApprovalPolicy) => void;
}

/**
 * Approval policy admin (handover §6.5). One card per priority, gated on
 * MANAGE. Makes routing configurable without a direct DB edit.
 */
const ApprovalPolicyAdmin: React.FC<ApprovalPolicyAdminProps> = ({
  policies,
  loading,
  savingPriority,
  onSave,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Spin />
      </div>
    );
  }

  if (!policies.length) {
    return <Empty description="No approval policies configured for this site" />;
  }

  return (
    <div className={styles.adminTemplate}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="These routes decide what each priority needs before it publishes."
        description="Changes apply to announcements submitted from now on — anything already in an approval chain keeps the route it was submitted under."
      />
      {policies.map((p) => (
        <PolicyCard
          key={p.priority}
          policy={p}
          saving={savingPriority === p.priority}
          onSave={onSave}
        />
      ))}
    </div>
  );
};

export default ApprovalPolicyAdmin;
