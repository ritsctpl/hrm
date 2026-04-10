"use client";

import React, { useEffect } from "react";
import { Drawer, Form, Input, Select, DatePicker, Switch, Button, Space, message } from "antd";
import dayjs from "dayjs";
import { AnnouncementComposeDrawerProps } from "../../types/ui.types";
import { HrmAnnouncementService } from "../../services/hrmAnnouncementService";
import { CATEGORY_LABELS } from "../../utils/constants";
import { useHrmAnnouncementStore } from "../../stores/hrmAnnouncementStore";
import Can from "../../../hrmAccess/components/Can";

const { Option } = Select;
const { TextArea } = Input;

const AnnouncementComposeDrawer: React.FC<AnnouncementComposeDrawerProps> = ({
  open,
  editAnnouncement,
  site,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const { saving, setSaving } = useHrmAnnouncementStore();

  useEffect(() => {
    if (open) {
      if (editAnnouncement) {
        form.setFieldsValue({
          title: editAnnouncement.title,
          content: editAnnouncement.content,
          priority: editAnnouncement.priority,
          category: editAnnouncement.category,
          pinToTop: editAnnouncement.pinToTop,
          scheduledPublishAt: editAnnouncement.scheduledPublishAt ? dayjs(editAnnouncement.scheduledPublishAt) : undefined,
          expiresAt: editAnnouncement.expiresAt ? dayjs(editAnnouncement.expiresAt) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ priority: "NORMAL", category: "GENERAL", pinToTop: false });
      }
    }
  }, [open, editAnnouncement, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        site,
        scheduledPublishAt: values.scheduledPublishAt?.toISOString(),
        expiresAt: values.expiresAt?.toISOString(),
      };
      if (editAnnouncement) {
        await HrmAnnouncementService.updateAnnouncement({
          ...payload,
          announcementHandle: editAnnouncement.handle,
        });
      } else {
        await HrmAnnouncementService.createAnnouncement(payload);
      }
      message.success(editAnnouncement ? "Announcement updated" : "Announcement created");
      onSaved();
    } catch {
      message.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editAnnouncement ? "Edit Announcement" : "New Announcement"}
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Can I={editAnnouncement ? "edit" : "add"}>
            <Button type="primary" onClick={handleSubmit} loading={saving}>
              {editAnnouncement ? "Update" : "Create"}
            </Button>
          </Can>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Announcement title" />
        </Form.Item>
        <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
          <Select>
            <Option value="NORMAL">Normal</Option>
            <Option value="HIGH">High</Option>
            <Option value="URGENT">Urgent</Option>
          </Select>
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
    </Drawer>
  );
};

export default AnnouncementComposeDrawer;
