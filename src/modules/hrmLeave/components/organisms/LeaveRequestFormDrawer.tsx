"use client";

import React from "react";
import { Button, Drawer, Input, Radio, Steps, Typography, message } from "antd";
import { parseCookies } from "nookies";
import LeaveBalanceCard from "../molecules/LeaveBalanceCard";
import DateRangePicker from "../molecules/DateRangePicker";
import ValidationSummaryPanel from "../molecules/ValidationSummaryPanel";
import Can from "../../../hrmAccess/components/Can";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { LeaveBalance } from "../../types/domain.types";
import { DayType } from "../../types/ui.types";
import styles from "../../styles/HrmLeaveForm.module.css";

const { Text } = Typography;

interface LeaveRequestFormDrawerProps {
  site: string;
  employeeId: string;
  balances: LeaveBalance[];
  onSubmitted: () => void;
}

const STEPS = [
  { title: "Select Type" },
  { title: "Select Dates" },
  { title: "Validation" },
  { title: "Reason & Submit" },
];

const LeaveRequestFormDrawer: React.FC<LeaveRequestFormDrawerProps> = ({
  site,
  employeeId,
  balances,
  onSubmitted,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? employeeId;

  const {
    showLeaveForm,
    leaveFormStep,
    leaveFormState,
    validationSummary,
    validationLoading,
    closeLeaveForm,
    setLeaveFormStep,
    updateLeaveFormState,
    setValidationSummary,
    setValidationLoading,
    addMyRequest,
  } = useHrmLeaveStore();

  const [submitting, setSubmitting] = React.useState(false);

  const selectedBalance = balances.find(
    (b) => b.leaveTypeCode === leaveFormState.leaveTypeCode
  );

  const handleValidate = async () => {
    if (!leaveFormState.leaveTypeCode || !leaveFormState.startDate || !leaveFormState.endDate) return;
    setValidationLoading(true);
    try {
      const res = await HrmLeaveService.validateLeaveRequest({
        site,
        employeeId,
        leaveTypeCode: leaveFormState.leaveTypeCode,
        startDate: leaveFormState.startDate,
        endDate: leaveFormState.endDate,
        startDayType: leaveFormState.startDayType,
        endDayType: leaveFormState.endDayType,
        totalDays: leaveFormState.totalDays,
        reason: "",
        createdBy: userId,
      });
      setValidationSummary(res);
      setLeaveFormStep(3);
    } catch {
      message.error("Validation failed");
    } finally {
      setValidationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!leaveFormState.leaveTypeCode || !leaveFormState.startDate || !leaveFormState.endDate) return;
    if (!leaveFormState.reason.trim()) {
      message.warning("Reason is mandatory");
      return;
    }
    setSubmitting(true);
    try {
      const result = await HrmLeaveService.submitLeaveRequest({
        site,
        employeeId,
        leaveTypeCode: leaveFormState.leaveTypeCode,
        startDate: leaveFormState.startDate,
        endDate: leaveFormState.endDate,
        startDayType: leaveFormState.startDayType,
        endDayType: leaveFormState.endDayType,
        totalDays: leaveFormState.totalDays,
        reason: leaveFormState.reason,
        attachmentPath: leaveFormState.attachmentPath ?? undefined,
        createdBy: userId,
      });
      addMyRequest(result);
      message.success("Leave request submitted successfully");
      closeLeaveForm();
      onSubmitted();
    } catch {
      message.error("Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep1 = !!leaveFormState.leaveTypeCode;
  const canProceedStep2 =
    !!leaveFormState.startDate &&
    !!leaveFormState.endDate &&
    leaveFormState.totalDays > 0;

  const renderStep = () => {
    switch (leaveFormStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <Text style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
              Available Balances — select one:
            </Text>
            <div className={styles.typeSelector}>
              {balances.map((b) => (
                <div
                  key={b.leaveTypeCode}
                  className={`${styles.typeOption} ${
                    leaveFormState.leaveTypeCode === b.leaveTypeCode
                      ? styles.typeOptionSelected
                      : ""
                  }`}
                  onClick={() =>
                    updateLeaveFormState({ leaveTypeCode: b.leaveTypeCode })
                  }
                >
                  <div className={styles.typeOptionLeft}>
                    <input
                      type="radio"
                      readOnly
                      checked={leaveFormState.leaveTypeCode === b.leaveTypeCode}
                    />
                    <span>{b.leaveTypeName}</span>
                  </div>
                  <span
                    className={`${styles.typeOptionBalance} ${
                      b.availableBalance === 0 ? styles.typeOptionZero : ""
                    }`}
                  >
                    {b.availableBalance.toFixed(1)} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <DateRangePicker
              startDate={leaveFormState.startDate}
              endDate={leaveFormState.endDate}
              startDayType={leaveFormState.startDayType}
              endDayType={leaveFormState.endDayType}
              halfDayAllowed={selectedBalance?.halfDayAllowed ?? false}
              onStartDateChange={(date, dayType) =>
                updateLeaveFormState({ startDate: date, startDayType: dayType })
              }
              onEndDateChange={(date, dayType) =>
                updateLeaveFormState({ endDate: date, endDayType: dayType })
              }
              onTotalDaysChange={(days) => updateLeaveFormState({ totalDays: days })}
            />
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <ValidationSummaryPanel
              summary={validationSummary}
              loading={validationLoading}
            />
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.reasonStep}>
              <Text>
                Reason <Text type="danger">*</Text>
              </Text>
              <Input.TextArea
                rows={4}
                placeholder="Enter reason for leave (mandatory)"
                value={leaveFormState.reason}
                onChange={(e) => updateLeaveFormState({ reason: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Drawer
      title="Apply for Leave"
      open={showLeaveForm}
      onClose={closeLeaveForm}
      width={640}
      footer={
        <div className={styles.formActions}>
          <Button
            onClick={() => setLeaveFormStep(Math.max(1, leaveFormStep - 1) as 1 | 2 | 3 | 4)}
            disabled={leaveFormStep === 1}
          >
            Back
          </Button>
          {leaveFormStep < 4 ? (
            <Button
              type="primary"
              disabled={
                (leaveFormStep === 1 && !canProceedStep1) ||
                (leaveFormStep === 2 && !canProceedStep2)
              }
              onClick={() => {
                if (leaveFormStep === 2) {
                  handleValidate();
                } else {
                  setLeaveFormStep((leaveFormStep + 1) as 1 | 2 | 3 | 4);
                }
              }}
              loading={validationLoading}
            >
              Next
            </Button>
          ) : (
            <Can I="add" object="leave_request">
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!leaveFormState.reason.trim()}
              >
                Submit Request
              </Button>
            </Can>
          )}
        </div>
      }
    >
      <Steps
        current={leaveFormStep - 1}
        items={STEPS}
        size="small"
        className={styles.formStepsBar}
      />
      {renderStep()}
    </Drawer>
  );
};

export default LeaveRequestFormDrawer;
