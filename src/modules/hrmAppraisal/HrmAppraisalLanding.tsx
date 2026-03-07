'use client';

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Tabs } from "antd";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmAppraisalStore } from "./stores/hrmAppraisalStore";
import styles from "./styles/AppraisalLanding.module.css";

const AppraisalLandingTemplate = dynamic(
  () => import("./components/templates/AppraisalLandingTemplate"),
  { ssr: false }
);
const ManagerReviewPanel = dynamic(
  () => import("./components/organisms/ManagerReviewPanel"),
  { ssr: false }
);
const CalibrationTemplate = dynamic(
  () => import("./components/templates/CalibrationTemplate"),
  { ssr: false }
);
const CycleConfigForm = dynamic(
  () => import("./components/organisms/CycleConfigForm"),
  { ssr: false }
);

const HrmAppraisalLanding: React.FC = () => {
  const { activeTab, setActiveTab, fetchCycles, fetchMyGoals, fetchMyFeedback } =
    useHrmAppraisalStore();

  const role = parseCookies().role ?? "EMPLOYEE";
  const isManager = role === "MANAGER" || role === "ADMIN";
  const isHr = role === "HR" || role === "ADMIN";

  useEffect(() => {
    fetchCycles().then(() => {
      const cycle = useHrmAppraisalStore.getState().activeCycle;
      if (cycle) {
        fetchMyGoals(cycle.cycleId);
      }
    });
    fetchMyFeedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabItems = useMemo(() => {
    const items: Array<{ key: string; label: string; children: React.ReactNode }> = [
      {
        key: "my-appraisal",
        label: "My Appraisal",
        children: <AppraisalLandingTemplate />,
      },
    ];

    if (isManager) {
      items.push({
        key: "team-reviews",
        label: "Team Reviews",
        children: <ManagerReviewPanel />,
      });
    }

    if (isHr) {
      items.push({
        key: "calibration",
        label: "Calibration",
        children: <CalibrationTemplate />,
      });
      items.push({
        key: "cycle-admin",
        label: "Cycle Admin",
        children: <CycleConfigForm />,
      });
    }

    return items;
  }, [isManager, isHr]);

  return (
    <div className={styles.landingRoot}>
      <CommonAppBar title="Performance Appraisal" showBack={false} />
      <div className={styles.content}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className={styles.mainTabs}
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );
};

export default HrmAppraisalLanding;
