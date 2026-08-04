"use client";

import React, { useEffect, useState } from "react";
import { Alert, Drawer, Form, Input, Select, DatePicker, Switch, Button, Space, message } from "antd";
import { toLocalDateTime } from "@/utils/dateUtils";
import { AnnouncementComposeDrawerProps } from "../../types/ui.types";
import { HrmAnnouncementService } from "../../services/hrmAnnouncementService";
import {
  FORCED_ACK_PRIORITIES,
  PRIORITY_LABELS,
  normalizePriority,
} from "../../utils/constants";
import { useHrmAnnouncementStore } from "../../stores/hrmAnnouncementStore";
import { useAnnouncementPermissions } from "../../hooks/useAnnouncementPermissions";
import { useEmployeeIdentity } from "@/modules/hrmAccess/hooks/useEmployeeIdentity";
import { useAnnouncementCategories } from "../../hooks/useAnnouncementCategories";
import { parseAnnouncementError } from "../../utils/announcementErrors";
import AudienceSelector, { EMPTY_AUDIENCE, isAudienceEmpty, type AudienceValue } from "./AudienceSelector";
import EmergencyPublishModal from "./EmergencyPublishModal";
import Can from "../../../hrmAccess/components/Can";

const EMPTY_AUDIENCE_ERROR = "EMPTY_AUDIENCE";

/** Shows the recipient error when that was the cause, the generic one otherwise. */
const reportSaveError = (e: unknown, fallback: string) =>
  message.error(
    e instanceof Error && e.message === EMPTY_AUDIENCE_ERROR
      ? "Select at least one recipient"
      : fallback
  );

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
  const [categoryCode, setCategoryCode] = useState<string>("");
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [acting, setActing] = useState(false);
  // Audience lives outside the antd Form — it's a composite value, not a field.
  const [audience, setAudience] = useState<AudienceValue>(EMPTY_AUDIENCE);
  // Categories are per-site records, not an enum — never hardcode them.
  const { sorted: categories, byCode: categoryByCode } = useAnnouncementCategories();

  /**
   * Whether this announcement needs a review before it goes out.
   *
   * The category decides — the author may opt in to review but never out of
   * it, which is what the server enforces on create. There is no route to
   * preview any more: approval goes to the author's reporting manager, and
   * neither the composer nor the author gets a say in who that is.
   */
  const approvalRequired =
    !!categoryByCode(categoryCode)?.approvalRequired ||
    !!editAnnouncement?.approvalRequired;

  /** Forced on by the server for CRITICAL/EMERGENCY — reflect the lock. */
  const ackForced = FORCED_ACK_PRIORITIES.includes(normalizePriority(priority));

  useEffect(() => {
    if (ackForced) form.setFieldValue("acknowledgmentRequired", true);
  }, [ackForced, form]);

  /**
   * Picking a category applies its server-side defaults. These are the
   * author's expectation-setters: choosing "Policy Update" should immediately
   * show that it needs approval and forces acknowledgement, not leave them to
   * discover it at submit.
   */
  const handleCategoryChange = (code: string) => {
    setCategoryCode(code);
    const record = categoryByCode(code);
    if (!record) return;
    if (record.defaultPriority) {
      // Seeded defaults still carry legacy values (NORMAL/HIGH/URGENT/LOW).
      const p = normalizePriority(record.defaultPriority);
      form.setFieldValue("priority", p);
      setPriority(p);
    }
    // A category default never unsets a priority that forces acknowledgement —
    // the server would force it back on and the switch would look like it lied.
    if (record.acknowledgmentRequiredDefault !== undefined && !ackForced) {
      form.setFieldValue("acknowledgmentRequired", record.acknowledgmentRequiredDefault);
    }
  };

  useEffect(() => {
    // A blank actorId can never succeed — treat it as not-ready.
    if (!open || !identityReady || !actorId) return;
    if (editAnnouncement) {
      const p = normalizePriority(editAnnouncement.priority);
      form.setFieldsValue({
        title: editAnnouncement.title,
        content: editAnnouncement.content,
        priority: p,
        category: editAnnouncement.category,
        pinToTop: editAnnouncement.pinToTop,
        // The picker works in local time; the server's value is zoneless UTC.
        // Saving sends `.toISOString()` back, so the round trip stays honest.
        scheduledPublishAt: toLocalDateTime(editAnnouncement.scheduledPublishAt) ?? undefined,
        expiresAt: toLocalDateTime(editAnnouncement.expiresAt) ?? undefined,
      });
      setPriority(p);
      setCategoryCode(editAnnouncement.category ?? "");
      setAudience({
        allEmployees: editAnnouncement.allEmployees ?? false,
        targetBusinessUnits: editAnnouncement.targetBusinessUnits ?? [],
        targetDepartments: editAnnouncement.targetDepartments ?? [],
        targetRoles: editAnnouncement.targetRoles ?? [],
        targetEmployeeIds: editAnnouncement.targetEmployeeIds ?? [],
      });
    } else {
      form.resetFields();
      // Category is seeded from the server list once it arrives — see below.
      form.setFieldsValue({ priority: "GENERAL", pinToTop: false });
      setPriority("GENERAL");
      setCategoryCode("");
      setAudience(EMPTY_AUDIENCE);
    }
  }, [open, identityReady, actorId, editAnnouncement, form]);

  /**
   * Preselect the first category once the server list arrives. Deliberately
   * not hardcoded to "GENERAL" — a site may rename or remove it, and picking
   * a code that doesn't exist would fail on save with an unhelpful error.
   */
  useEffect(() => {
    if (!open || editAnnouncement || !categories.length) return;
    if (form.getFieldValue("category")) return;
    const first = categories[0];
    form.setFieldValue("category", first.categoryCode);
    handleCategoryChange(first.categoryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editAnnouncement, categories]);

  const handlePriorityChange = (p: string) => {
    setPriority(p);
  };

  /** Saves and returns the handle, so an action can chain onto a new record. */
  const persist = async (): Promise<string | null> => {
    const values = await form.validateFields();
    // Callers show this one themselves so it isn't followed by a generic
    // "Failed to save" that hides the real reason.
    if (isAudienceEmpty(audience)) throw new Error(EMPTY_AUDIENCE_ERROR);
    const payload = {
      ...values,
      organizationId,
      scheduledPublishAt: values.scheduledPublishAt?.toISOString(),
      expiresAt: values.expiresAt?.toISOString(),
      // Targeting is additive server-side; allEmployees overrides the rest.
      allEmployees: audience.allEmployees,
      targetBusinessUnits: audience.targetBusinessUnits,
      targetDepartments: audience.targetDepartments,
      targetRoles: audience.targetRoles,
      targetEmployeeIds: audience.targetEmployeeIds,
    };
    // The actor for the permission check comes from createdBy / modifiedBy on
    // these two endpoints — not actorId, and not a header.
    if (editAnnouncement) {
      await HrmAnnouncementService.updateAnnouncement({
        ...payload,
        announcementHandle: editAnnouncement.handle,
        modifiedBy: actorId,
      });
      return editAnnouncement.handle;
    }
    const created = await HrmAnnouncementService.createAnnouncement({
      ...payload,
      createdBy: actorId,
    });
    return created?.handle ?? null;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await persist();
      message.success(editAnnouncement ? "Announcement updated" : "Draft saved");
      onSaved();
    } catch (e) {
      reportSaveError(e, "Failed to save announcement");
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
    } catch (e) {
      // HRM_ANN_NO_APPROVER is the one the author can act on — it names the
      // missing reporting manager — so let the parser surface the server text
      // rather than flattening it into "Failed to submit".
      if (e instanceof Error && e.message === EMPTY_AUDIENCE_ERROR) {
        reportSaveError(e, "Failed to submit for approval");
      } else {
        message.error(parseAnnouncementError(e, "Failed to submit for approval").message);
      }
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
        actorId,
      });
      message.success("Announcement published");
      onSaved();
    } catch (e) {
      reportSaveError(e, "Failed to publish announcement");
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
    } catch (e) {
      reportSaveError(e, "Failed to publish emergency announcement");
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

  const isEmergency = normalizePriority(priority) === "EMERGENCY";

  // One primary action, chosen by the category — never both.
  const primaryAction = (() => {
    if (isEmergency && can.emergency) {
      return (
        <Button danger type="primary" loading={acting} onClick={() => setEmergencyOpen(true)}>
          Publish Emergency
        </Button>
      );
    }
    if (approvalRequired) {
      return (
        <Button type="primary" loading={acting} onClick={handleSubmitForApproval}>
          Submit for approval
        </Button>
      );
    }
    if (can.publishGeneral) {
      return (
        <Button type="primary" loading={acting} onClick={handlePublishDirect}>
          Publish
        </Button>
      );
    }
    // No publish grant — saving a draft is all that's offered.
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

        {approvalRequired && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="This category needs approval"
            description={
              "It goes to your reporting manager, the same way a leave request does. " +
              "If nobody answers in time it moves up the reporting chain, and HR picks up " +
              "anything that runs off the top."
            }
          />
        )}

        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Announcement title" />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select
            loading={!categories.length}
            optionFilterProp="label"
            showSearch
            onChange={handleCategoryChange}
            options={categories.map((c) => ({
              value: c.categoryCode,
              label: c.categoryName || c.categoryCode,
            }))}
          />
        </Form.Item>
        <Form.Item name="content" label="Content" rules={[{ required: true }]}>
          <TextArea rows={8} placeholder="Announcement content (HTML supported)" />
        </Form.Item>

        {/* Deliberately outside Form.Item — the audience is a composite value held
            in its own state, not a registered form field. It sits directly after
            the message because who receives it is part of writing it, not a
            delivery option to be set afterwards. */}
        <AudienceSelector value={audience} onChange={setAudience} disabled={saving || acting} />

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
