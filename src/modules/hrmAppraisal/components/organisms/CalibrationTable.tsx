'use client';

import React, { useState } from "react";
import { Button, Input, InputNumber, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ExpandableConfig } from "antd/es/table/interface";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import type { AppraisalReview } from "../../types/domain.types";
import styles from "../../styles/Calibration.module.css";

const CalibrationTable: React.FC = () => {
  const { calibrationReviews, loadingCalibration, calibrateRating, savingCalibration } =
    useHrmAppraisalStore();

  const [calibratedValues, setCalibratedValues] = useState<Record<string, number>>({});
  const [calibrationNotes, setCalibrationNotes] = useState<Record<string, string>>({});

  const columns: ColumnsType<AppraisalReview> = [
    { title: "Name", dataIndex: "employeeName", key: "employeeName" },
    { title: "Dept", dataIndex: "department", key: "department", width: 120 },
    {
      title: "Self",
      key: "selfRating",
      width: 70,
      render: (_, r) => r.selfAssessment?.overallRating?.toFixed(1) ?? "—",
    },
    {
      title: "Manager",
      key: "mgr",
      width: 80,
      render: (_, r) => r.managerAssessment?.overallRating?.toFixed(1) ?? "—",
    },
    {
      title: "Proposed",
      key: "proposed",
      width: 90,
      render: (_, r) => r.managerAssessment?.recommendedRating?.toFixed(1) ?? "—",
    },
    {
      title: "Calibrated",
      key: "calibrated",
      width: 120,
      render: (_, r) => (
        <InputNumber
          size="small"
          min={1}
          max={5}
          step={0.1}
          value={calibratedValues[r.reviewId] ?? r.calibration?.calibratedRating}
          onChange={(v) =>
            setCalibratedValues((prev) => ({ ...prev, [r.reviewId]: v ?? 0 }))
          }
          style={{ width: 80 }}
        />
      ),
    },
  ];

  const expandable: ExpandableConfig<AppraisalReview> = {
    expandedRowRender: (record) => (
      <div className={styles.calibrationDetail}>
        <div>
          <Typography.Text type="secondary">Calibration Notes:</Typography.Text>
          <Input.TextArea
            rows={2}
            value={calibrationNotes[record.reviewId] ?? record.calibration?.calibrationNotes}
            onChange={(e) =>
              setCalibrationNotes((prev) => ({ ...prev, [record.reviewId]: e.target.value }))
            }
            style={{ marginTop: 4 }}
          />
        </div>
        <Button
          type="primary"
          size="small"
          loading={savingCalibration}
          onClick={() =>
            calibrateRating(
              record.reviewId,
              calibratedValues[record.reviewId] ?? 0,
              calibrationNotes[record.reviewId] ?? ""
            )
          }
        >
          Save Calibration for {record.employeeName}
        </Button>
      </div>
    ),
  };

  return (
    <Table
      dataSource={calibrationReviews}
      columns={columns}
      rowKey="reviewId"
      size="small"
      loading={loadingCalibration}
      expandable={expandable}
      pagination={{ pageSize: 20 }}
      className={styles.calibrationTable}
    />
  );
};

export default CalibrationTable;
