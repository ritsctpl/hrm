"use client";

import React, { useEffect, useState } from "react";
import { Drawer, Form, DatePicker, InputNumber, Input, Button, message, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { parseCookies } from "nookies";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { HrmHolidayService } from "../../../hrmHoliday/services/hrmHolidayService";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";

const { TextArea } = Input;
const { Text } = Typography;

interface CompOffRequestFormProps {
  onSubmitted: () => void;
}

const CompOffRequestForm: React.FC<CompOffRequestFormProps> = ({ onSubmitted }) => {
  const organizationId = getOrganizationId();
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for employeeId/createdBy.
  const employeeId = identity.employeeIdWithName || cookies.employeeId || cookies.userId || "";
  const { showCompOffForm, closeCompOffForm } = useHrmLeaveStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [autoQuantity, setAutoQuantity] = useState<number>(0);
  // Company holidays — comp-off may be claimed for a company holiday or a
  // weekly-off (Sat/Sun). Set of ISO (YYYY-MM-DD) dates.
  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!showCompOffForm || !organizationId) {
      return;
    }
    let cancelled = false;
    const thisYear = new Date().getFullYear();
    // Comp-off worked dates can land late in the prior year or early next year;
    // load the surrounding years so the picker validates them correctly.
    // Holidays come from /holiday/retrieve-all via getAllHolidayDates.
    Promise.all(
      [thisYear - 1, thisYear, thisYear + 1].map((year) =>
        HrmHolidayService.getAllHolidayDates({
          organizationId,
          year,
          requestingUserRole: cookies.userRole ?? "EMPLOYEE",
          buHandle: cookies.buHandle || undefined,
        }).catch(() => new Map<string, string>()),
      ),
    ).then((maps) => {
      if (cancelled) return;
      const set = new Set<string>();
      maps.forEach((m) => m.forEach((_name, date) => set.add(date)));
      setHolidayDates(set);
    });
    return () => {
      cancelled = true;
    };
  }, [showCompOffForm, organizationId]);

  // A date qualifies for comp-off when it's a weekly off (Sat/Sun) or a
  // published company holiday.
  const isEligibleWorkedDate = (d: Dayjs): boolean => {
    const dow = d.day(); // 0 = Sun, 6 = Sat
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = holidayDates.has(d.format("YYYY-MM-DD"));
    return isWeekend || isHoliday;
  };

  const handleHoursChange = (hours: number | null) => {
    if (!hours) {
      setAutoQuantity(0);
      return;
    }
    const qty = hours >= 8 ? 1 : hours >= 4 ? 0.5 : 0;
    setAutoQuantity(qty);
    form.setFieldsValue({ quantity: qty });
  };

  // Disable future dates and any working day that is neither a weekend nor a
  // company holiday.
  const disableWorkedDate = (current: Dayjs) => {
    if (!current) return false;
    if (current.isAfter(dayjs().endOf("day"))) return true;
    return !isEligibleWorkedDate(current);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!isEligibleWorkedDate(values.workedDate)) {
        message.warning(
          "Comp-off can only be claimed for a company holiday or a weekly off (Sat/Sun).",
        );
        return;
      }
      if (values.quantity <= 0) {
        message.warning("Minimum 4 hours required to claim comp-off");
        return;
      }
      setLoading(true);
      await HrmLeaveService.submitCompOffRequest({
        organizationId,
        employeeId,
        workedDate: values.workedDate.format("YYYY-MM-DD"),
        hours: values.hours,
        quantity: values.quantity,
        reason: values.reason,
        createdBy: employeeId,
      });
      message.success("Comp-off request submitted");
      form.resetFields();
      setAutoQuantity(0);
      closeCompOffForm();
      onSubmitted();
    } catch (err: unknown) {
      // antd's validateFields rejects with { errorFields }; the inline field
      // errors are already shown, so don't surface a toast for those.
      if (err && typeof err === "object" && "errorFields" in err) {
        return;
      }
      // Surface the actual backend error instead of a generic message so the
      // user knows why (e.g. server rejected the worked date).
      const apiError = err as {
        response?: { data?: { message_details?: { error?: string; msg?: string }; message?: string } };
        message?: string;
      };
      const backendMsg =
        apiError?.response?.data?.message_details?.error ||
        apiError?.response?.data?.message_details?.msg ||
        apiError?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to submit comp-off request";
      message.error(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Request Comp-Off"
      open={showCompOffForm}
      onClose={closeCompOffForm}
      width={480}
      destroyOnClose
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={closeCompOffForm}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Submit Request
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="workedDate"
          label="Worked Date"
          rules={[{ required: true, message: "Please select the date you worked" }]}
          extra="Comp-off can only be claimed for a company holiday or a weekly off (Sat/Sun)."
        >
          <DatePicker
            format="DD-MMM-YYYY"
            style={{ width: "100%" }}
            disabledDate={disableWorkedDate}
            placeholder="Select the date you worked"
          />
        </Form.Item>

        <Form.Item
          name="hours"
          label="Hours Worked"
          rules={[
            { required: true, message: "Please enter hours worked" },
            { type: "number", min: 4, message: "Minimum 4 hours required" },
          ]}
        >
          <InputNumber
            min={4}
            max={24}
            style={{ width: "100%" }}
            placeholder="Enter hours worked"
            onChange={handleHoursChange}
          />
        </Form.Item>

        <Form.Item name="quantity" label="Days to Credit">
          <InputNumber
            style={{ width: "100%" }}
            disabled
            value={autoQuantity}
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: -16, marginBottom: 16 }}>
          Auto-calculated: 8+ hours = 1 day, 4-7 hours = 0.5 day
        </Text>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please provide a reason" }]}
        >
          <TextArea rows={4} placeholder="Describe why you worked on this day" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CompOffRequestForm;
