"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import type { LeaveBlackoutPeriod } from "../../types/api.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const BlackoutPeriodPanel: React.FC = () => {
  const organizationId = getOrganizationId();
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for audit fields.
  const userId = identity.employeeIdWithName || cookies.userId || "";

  const [blackouts, setBlackouts] = useState<LeaveBlackoutPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const { options: leaveTypeOptions } = useLeaveTypeOptions();

  const fetchBlackouts = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await HrmLeaveService.getAllBlackouts({ organizationId });
      setBlackouts(res);
    } catch {
      message.error("Failed to load blackout periods");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchBlackouts();
  }, [fetchBlackouts]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const [startDate, endDate] = values.dateRange;
      await HrmLeaveService.createBlackout({
        organizationId,
        name: values.name,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        applicableLeaveTypes: values.applicableLeaveTypes ?? [],
        applicableDepartments: values.applicableDepartments ?? [],
        reason: values.reason,
        createdBy: userId,
      });
      message.success("Blackout period created");
      setModalOpen(false);
      form.resetFields();
      fetchBlackouts();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return; // validation error
      message.error("Failed to create blackout period");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (handle: string) => {
    try {
      await HrmLeaveService.deleteBlackout({ organizationId, handle });
      message.success("Blackout period deleted");
      fetchBlackouts();
    } catch {
      message.error("Failed to delete blackout period");
    }
  };

  const columns: ColumnsType<LeaveBlackoutPeriod> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 120,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 120,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD"),
    },
    {
      title: "Leave Types",
      dataIndex: "applicableLeaveTypes",
      key: "applicableLeaveTypes",
      width: 200,
      render: (types: string[]) =>
        !types || types.length === 0 ? (
          <Tag color="red">All Types</Tag>
        ) : (
          types.map((t) => (
            <Tag key={t} color="blue">
              {t}
            </Tag>
          ))
        ),
    },
    {
      title: "Departments",
      dataIndex: "applicableDepartments",
      key: "applicableDepartments",
      width: 180,
      render: (depts: string[]) =>
        !depts || depts.length === 0 ? (
          <Tag color="red">All Depts</Tag>
        ) : (
          depts.map((d) => (
            <Tag key={d} color="geekblue">
              {d}
            </Tag>
          ))
        ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      render: (_: unknown, record: LeaveBlackoutPeriod) => (
        <Popconfirm
          title="Delete this blackout period?"
          onConfirm={() => handleDelete(record.handle)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Blackout Periods
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Add Blackout Period
        </Button>
      </div>

      <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
        Leave applications are blocked during active blackout periods.
        Empty leave types or departments means the blackout applies to all.
      </Text>

      <Table
        rowKey="handle"
        dataSource={blackouts}
        columns={columns}
        loading={loading}
        size="small"
        pagination={false}
        locale={{ emptyText: "No blackout periods configured" }}
      />

      <Modal
        title="Add Blackout Period"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Create"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g., Year-End Close" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: "Date range is required" }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="applicableLeaveTypes"
            label="Applicable Leave Types"
            tooltip="Leave empty to block all leave types"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="All leave types (leave empty for all)"
              options={leaveTypeOptions}
            />
          </Form.Item>

          <Form.Item
            name="applicableDepartments"
            label="Applicable Departments"
            tooltip="Leave empty to apply to all departments"
          >
            <Select
              mode="tags"
              allowClear
              placeholder="All departments (leave empty for all)"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Reason is required" }]}
          >
            <TextArea rows={3} placeholder="e.g., Financial year-end close" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BlackoutPeriodPanel;
