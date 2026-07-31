"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Drawer, Form, Input, Select, DatePicker, Switch, Button, Space, Tooltip, message } from "antd";
import dayjs from "dayjs";
import { AnnouncementComposeDrawerProps } from "../../types/ui.types";
import type { ApprovalRoutePreview } from "../../types/api.types";
import { HrmAnnouncementService } from "../../services/hrmAnnouncementService";
import { CATEGORY_LABELS, PRIORITY_LABELS, normalizePriority } from "../../utils/constants";
import { useHrmAnnouncementStore } from "../../stores/hrmAnnouncementStore";
import { useAnnouncementPermissions } from "../../hooks/useAnnouncementPermissions";
import { useEmployeeIdentity } from "@/modules/hrmAccess/hooks/useEmployeeIdentity";
import ApprovalRoutePanel from "../molecules/ApprovalRoutePanel";
import EmergencyPublishModal from "./EmergencyPublishModal";
import Can from "../../../hrmAccess/components/Can";

const { Option } = Select;
const { TextArea } = Input;

const AnnouncementComposeDrawer: React.FC<AnnouncementComposeDrawerProps> = ({
  open,
  editAnnouncement,
  organizationId,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const { saving, setSaving } = useHrmAnnouncementStore();
  const can = useAnnouncementPermissions();
  // Employee CODE, not the login email — the server resolves the actor by code
  // and 403s on anything else. Gate calls on isReady so we never send the
  // cookie fallback (which is typically the email).
  const { employeeCode: actorId, isReady: identityReady } = useEmployeeIdentity();

  const [priority, setPriority] = useState<string>("GENERAL");
  const [route, setRoute] = useState<ApprovalRoutePreview | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [acting, setActing] = useState(false);

  // The server decides the route; the composer only renders it (handover §0 rule 1).
  const loadRoute = useCallback(
    async (p: string) => {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const preview = await HrmAnnouncementService.previewRoute({
          organizationId,
          priority: p,
          actorId,
        });
        setRoute(preview);
        // Acknowledgement is forced on for CRITICAL/EMERGENCY — reflect the lock.
        if (preview.acknowledgementForced) {
          form.setFieldValue("acknowledgmentRequired", true);
        }
      } catch (e: unknown) {
        setRoute(null);
        setRouteError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setRouteLoading(false);
      }
    },
    [organizationId, actorId, form]
  );

  useEffect(() => {
    if (!open || !identityReady) return;
    if (editAnnouncement) {
      const p = normalizePriority(editAnnouncement.priority);
      form.setFieldsValue({
        title: editAnnouncement.title,
        content: editAnnouncement.content,
        priority: p,
        category: editAnnouncement.category,
        pinToTop: editAnnouncement.pinToTop,
        scheduledPublishAt: editAnnouncement.scheduledPublishAt
          ? dayjs(editAnnouncement.scheduledPublishAt)
          : undefined,
        expiresAt: editAnnouncement.expiresAt ? dayjs(editAnnouncement.expiresAt) : undefined,
      });
      setPriority(p);
      loadRoute(p);
    } else {
      form.resetFields();
      form.setFieldsValue({ priority: "GENERAL", category: "GENERAL", pinToTop: false });
      setPriority("GENERAL");
      loadRoute("GENERAL");
    }
  }, [open, identityReady, editAnnouncement, form, loadRoute]);

  const handlePriorityChange = (p: string) => {
    setPriority(p);
    loadRoute(p);
  };

  /** Saves and returns the handle, so an action can chain onto a new record. */
  const persist = async (): Promise<string | null> => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      organizationId,
      scheduledPublishAt: values.scheduledPublishAt?.toISOString(),
      expiresAt: values.expiresAt?.toISOString(),
    };
    if (editAnnouncement) {
      await HrmAnnouncementService.updateAnnouncement({
        ...payload,
        announcementHandle: editAnnouncement.handle,
      });
      return editAnnouncement.handle;
    }
    const created = await HrmAnnouncementService.createAnnouncement(payload);
    return created?.handle ?? null;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await persist();
      message.success(editAnnouncement ? "Announcement updated" : "Draft saved");
      onSaved();
    } catch {
      message.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setActing(true);
    try {
      const handle = await persist();
      if (!handle) throw new Error("no handle");
      await HrmAnnouncementService.submitForApproval({
        organizationId,
        announcementHandle: handle,
        actorId,
      });
      message.success("Submitted for approval");
      onSaved();
    } catch {
      message.error("Failed to submit for approval");
    } finally {
      setActing(false);
    }
  };

  const handlePublishDirect = async () => {
    setActing(true);
    try {
      const handle = await persist();
      if (!handle) throw new Error("no handle");
      await HrmAnnouncementService.publishAnnouncement({
        organizationId,
        announcementHandle: handle,
      });
      message.success("Announcement published");
      onSaved();
    } catch {
      message.error("Failed to publish announcement");
    } finally {
      setActing(false);
    }
  };

  const handleEmergencyPublish = async (justification: string) => {
    setActing(true);
    try {
      const handle = await persist();
      if (!handle) throw new Error("no handle");
      await HrmAnnouncementService.publishEmergency({
        organizationId,
        announcementHandle: handle,
        actorId,
        emergencyJustification: justification,
      });
      setEmergencyOpen(false);
      message.success("Emergency announcement published — awaiting ratification");
      onSaved();
    } catch {
      message.error("Failed to publish emergency announcement");
    } finally {
      setActing(false);
    }
  };

  const handlePreviewEmail = async () => {
    if (!editAnnouncement) {
      message.info("Save the announcement first — the preview mails the saved content.");
      return;
    }
    try {
      await HrmAnnouncementService.previewEmailToSelf({
        organizationId,
        announcementHandle: editAnnouncement.handle,
        actorId,
      });
      message.success("A preview has been emailed to you");
    } catch {
      message.error("Failed to send preview email");
    }
  };

  const ackForced = !!route?.acknowledgementForced;
  const blocked = !!route?.levels?.some((l) => !l.resolvable);
  const isEmergency = priority === "EMERGENCY";
  const canPublishDirect = route ? !route.approvalRequired && can.publishGeneral : false;

  // One primary action, chosen by the policy — never both.
  const primaryAction = (() => {
    if (isEmergency && can.emergency) {
      return (
        <Button danger type="primary" loading={acting} onClick={() => setEmergencyOpen(true)}>
          Publish Emergency
        </Button>
      );
    }
    if (canPublishDirect) {
      return (
        <Button type="primary" loading={acting} onClick={handlePublishDirect}>
          Publish
        </Button>
      );
    }
    if (route?.approvalRequired) {
      return (
        <Tooltip title={blocked ? "An approval level has no one assigned — ask an administrator" : ""}>
          <Button type="primary" loading={acting} disabled={blocked} onClick={handleSubmitForApproval}>
            Submit for approval
          </Button>
        </Tooltip>
      );
    }
    // No route loaded, or no publish grant — saving a draft is all that's offered.
    return null;
  })();

  return (
    <Drawer
      title={editAnnouncement ? "Edit Announcement" : "New Announcement"}
      open={open}
      onClose={onClose}
      width={640}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          {editAnnouncement && (
            <Button onClick={handlePreviewEmail}>Email me a preview</Button>
          )}
          <Can I={editAnnouncement ? "edit" : "add"}>
            <Button onClick={handleSaveDraft} loading={saving}>
              {editAnnouncement ? "Save" : "Save draft"}
            </Button>
          </Can>
          <Can I={editAnnouncement ? "edit" : "add"}>{primaryAction}</Can>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        {/* Priority first — it decides routing, forced ack and the emergency path. */}
        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true }]}
          extra="Priority decides how many approvals this needs and whether acknowledgement is mandatory."
        >
          <Select onChange={handlePriorityChange}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
        </Form.Item>

        <ApprovalRoutePanel preview={route} loading={routeLoading} error={routeError} />

        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Announcement title" />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="content" label="Content" rules={[{ required: true }]}>
          <TextArea rows={8} placeholder="Announcement content (HTML supported)" />
        </Form.Item>

        <Form.Item
          name="acknowledgmentRequired"
          label="Require acknowledgement"
          valuePropName="checked"
          extra={ackForced ? `Forced on for ${PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]} announcements.` : undefined}
        >
          <Switch disabled={ackForced} />
        </Form.Item>

        <Form.Item name="pinToTop" label="Pin Announcement" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="scheduledPublishAt" label="Schedule Publish At">
          <DatePicker showTime style={{ width: "100%" }} format="DD-MMM-YYYY HH:mm" />
        </Form.Item>
        <Form.Item name="expiresAt" label="Expires At">
          <DatePicker showTime style={{ width: "100%" }} format="DD-MMM-YYYY HH:mm" />
        </Form.Item>
      </Form>

      <EmergencyPublishModal
        open={emergencyOpen}
        title={form.getFieldValue("title") || "this announcement"}
        publishing={acting}
        onCancel={() => setEmergencyOpen(false)}
        onConfirm={handleEmergencyPublish}
      />
    </Drawer>
  );
};

export default AnnouncementComposeDrawer;
