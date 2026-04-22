"use client";

import React, { useEffect, useState } from "react";
import { getOrganizationId } from "@/utils/cookieUtils";
import { Tabs, Form, Checkbox, InputNumber, Input, Button, message } from "antd";
import { HrmTravelService } from "../../services/hrmTravelService";
import Can from "../../../hrmAccess/components/Can";
import type { TravelPolicy, TravelType, TravelMode } from "../../types/domain.types";

const ALL_MODES: TravelMode[] = ["CAB", "AUTO", "BUS", "TRAIN", "FLIGHT", "AIR"];

interface Props {
  policies: TravelPolicy[];
  onSaved?: () => void;
}

interface PolicyFormValues {
  allowedModes: TravelMode[];
  escalationDays: number;
  fileTypes: string;
  maxSize: number;
  maxCount: number;
}

const policyToValues = (policy: TravelPolicy): PolicyFormValues => ({
  allowedModes: policy.allowedModes,
  escalationDays: policy.escalationWindowDays,
  fileTypes: policy.allowedFileTypes.join(", "),
  maxSize: policy.maxFileSizeMb,
  maxCount: policy.maxFileCount,
});

const PolicyTypeForm: React.FC<{
  policy: TravelPolicy;
  onSave: (type: TravelType, values: PolicyFormValues) => Promise<void>;
  saving: boolean;
}> = ({ policy, onSave, saving }) => {
  const [form] = Form.useForm<PolicyFormValues>();

  useEffect(() => {
    form.setFieldsValue(policyToValues(policy));
  }, [policy, form]);

  return (
    <Form form={form} layout="vertical" initialValues={policyToValues(policy)}>
      <Form.Item label="Allowed Travel Modes" name="allowedModes">
        <Checkbox.Group options={ALL_MODES.map((m) => ({ label: m, value: m }))} />
      </Form.Item>
      <Form.Item label="Escalation Window (days)" name="escalationDays">
        <InputNumber min={1} max={30} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item label="Allowed File Types" name="fileTypes">
        <Input placeholder="pdf, jpg, png" style={{ width: 300 }} />
      </Form.Item>
      <Form.Item label="Max File Size (MB)" name="maxSize">
        <InputNumber min={1} max={50} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item label="Max File Count" name="maxCount">
        <InputNumber min={1} max={20} style={{ width: 120 }} />
      </Form.Item>
      <div style={{ textAlign: "right" }}>
        <Can I="edit">
          <Button
            type="primary"
            loading={saving}
            onClick={async () => {
              const values = await form.validateFields();
              await onSave(policy.travelType, values);
            }}
          >
            Save {policy.travelType.charAt(0) + policy.travelType.slice(1).toLowerCase()} Policy
          </Button>
        </Can>
      </div>
    </Form>
  );
};

const TravelPolicyConfig: React.FC<Props> = ({ policies, onSaved }) => {
  const organizationId = getOrganizationId();
  const [saving, setSaving] = useState(false);

  const handleSave = async (type: TravelType, values: PolicyFormValues) => {
    setSaving(true);
    try {
      await HrmTravelService.updatePolicy({
        organizationId,
        travelType: type,
        allowedModes: values.allowedModes,
        escalationWindowDays: values.escalationDays,
        allowedFileTypes: values.fileTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        maxFileSizeMb: values.maxSize,
        maxFileCount: values.maxCount,
      });
      message.success(`${type} policy saved.`);
      onSaved?.();
    } catch {
      message.error(`Failed to save ${type} policy.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Tabs
        items={policies.map((p) => ({
          key: p.travelType,
          label: p.travelType.charAt(0) + p.travelType.slice(1).toLowerCase(),
          children: <PolicyTypeForm policy={p} onSave={handleSave} saving={saving} />,
        }))}
      />
    </div>
  );
};

export default TravelPolicyConfig;
