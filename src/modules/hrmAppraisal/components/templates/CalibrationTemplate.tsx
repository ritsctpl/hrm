'use client';

import React, { useEffect } from "react";
import { Button, Select, Typography } from "antd";
import Can from "../../../hrmAccess/components/Can";
import BellCurveChart from "../organisms/BellCurveChart";
import CalibrationTable from "../organisms/CalibrationTable";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import styles from "../../styles/Calibration.module.css";

const CalibrationTemplate: React.FC = () => {
  const {
    activeCycle,
    ratingDistribution,
    calibrationFilters,
    setCalibrationFilters,
    fetchCalibrationReviews,
    fetchRatingDistribution,
    finalizeCalibration,
  } = useHrmAppraisalStore();

  useEffect(() => {
    if (activeCycle?.cycleId) {
      setCalibrationFilters({ cycleId: activeCycle.cycleId });
      fetchCalibrationReviews(activeCycle.cycleId, calibrationFilters.department);
      fetchRatingDistribution(activeCycle.cycleId, calibrationFilters.department);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCycle?.cycleId]);

  return (
    <div className={styles.calibrationRoot}>
      <div className={styles.calibrationHeader}>
        <Typography.Text strong>HR Calibration — {activeCycle?.cycleName}</Typography.Text>
        <div style={{ display: "flex", gap: 12 }}>
          <Select
            placeholder="Department"
            style={{ width: 180 }}
            allowClear
            onChange={(dept) => {
              setCalibrationFilters({ department: dept ?? "" });
              if (activeCycle?.cycleId) {
                fetchCalibrationReviews(activeCycle.cycleId, dept ?? "");
                fetchRatingDistribution(activeCycle.cycleId, dept ?? "");
              }
            }}
            options={(activeCycle?.applicableDepartments ?? []).map((d) => ({
              value: d,
              label: d,
            }))}
          />
          <Can I="edit">
            <Button
              type="primary"
              onClick={() =>
                finalizeCalibration(
                  activeCycle?.cycleId ?? "",
                  calibrationFilters.department
                )
              }
            >
              Finalize Calibration
            </Button>
          </Can>
        </div>
      </div>

      {ratingDistribution && (
        <div className={styles.bellCurveContainer}>
          <Typography.Text strong>Bell Curve Distribution</Typography.Text>
          <BellCurveChart distribution={ratingDistribution} />
        </div>
      )}

      <CalibrationTable />
    </div>
  );
};

export default CalibrationTemplate;
