"use client";

import React, { useState } from "react";
import { Tabs, Form, Checkbox, InputNumber, Input, Button, message } from "antd";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../../services/hrmTravelService";
import type { TravelPolicy, TravelType, TravelMode } from "../../types/domain.types";

const ALL_MODES: TravelMode[] = ["CAB", "AUTO", "BUS", "TRAIN", "FLIGHT", "AIR"];

interface Props {
  policies: TravelPolicy[];
  onSaved?: () => void;
}

const TravelPolicyConfig: React.FC<Props> = ({ policies, onSaved }) => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const renderTab = (policy: TravelPolicy) => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        [`allowedModes_${policy.travelType}`]: policy.allowedModes,
        [`escalationDays_${policy.travelType}`]: policy.escalationWindowDays,
        [`fileTypes_${policy.travelType}`]: policy.allowedFileTypes.join(", "),
        [`maxSize_${policy.travelType}`]: policy.maxFileSizeMb,
        [`maxCount_${policy.travelType}`]: policy.maxFileCount,
      }}
    >
      <Form.Item label="Allowed Travel Modes" name={`allowedModes_${policy.travelType}`}>
        <Checkbox.Group options={ALL_MODES.map((m) => ({ label: m, value: m }))} />
      </Form.Item>
      <Form.Item label="Escalation Window (days)" name={`escalationDays_${policy.travelType}`}>
        <InputNumber min={1} max={30} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item label="Allowed File Types" name={`fileTypes_${policy.travelType}`}>
        <Input placeholder="pdf, jpg, png" style={{ width: 300 }} />
      </Form.Item>
      <Form.Item label="Max File Size (MB)" name={`maxSize_${policy.travelType}`}>
        <InputNumber min={1} max={50} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item label="Max File Count" name={`maxCount_${policy.travelType}`}>
        <InputNumber min={1} max={20} style={{ width: 120 }} />
      </Form.Item>
    </Form>
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const types: TravelType[] = ["LOCAL", "DOMESTIC", "INTERNATIONAL"];
      for (const t of types) {
        await HrmTravelService.updatePolicy({
          site,
          travelType: t,
          allowedModes: values[`allowedModes_${t}`],
          escalationWindowDays: values[`escalationDays_${t}`],
          allowedFileTypes: (values[`fileTypes_${t}`] as string).split(",").map((s: string) => s.trim()),
          maxFileSizeMb: values[`maxSize_${t}`],
          maxFileCount: values[`maxCount_${t}`],
        });
      }
      message.success("Policies saved.");
      onSaved?.();
    } catch {
      message.error("Failed to save policies.");
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
          children: renderTab(p),
        }))}
      />
      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button type="primary" loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default TravelPolicyConfig;
