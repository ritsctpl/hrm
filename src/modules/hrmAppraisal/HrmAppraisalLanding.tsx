'use client';

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Tabs } from "antd";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmAppraisalStore } from "./stores/hrmAppraisalStore";
import { useAppraisalAuth } from "./hooks/useAppraisalAuth";
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
const HrmAppraisalScreen = dynamic(
  () => import("./HrmAppraisalScreen"),
  { ssr: false }
);

const HrmAppraisalLanding: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentView,
    activeCycle,
    fetchCycles,
    fetchMyGoals,
    fetchMyReview,
    fetchMyFeedback,
    fetchTeamReviews,
  } = useHrmAppraisalStore();

  const { isManager, isHr, isAdmin } = useAppraisalAuth();

  useEffect(() => {
    fetchCycles();
    fetchMyFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeCycle) {
      fetchMyGoals(activeCycle.cycleId);
      fetchMyReview(activeCycle.cycleId);
      if (isManager || isHr || isAdmin) {
        fetchTeamReviews(activeCycle.cycleId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCycle]);

  // If a detail screen is active, render it instead of the landing
  if (currentView !== "LANDING") {
    return <HrmAppraisalScreen />;
  }

  const tabItems = useMemo(() => {
    const items: Array<{ key: string; label: string; children: React.ReactNode }> = [
      {
        key: "my-appraisal",
        label: "My Appraisal",
        children: <AppraisalLandingTemplate />,
      },
    ];

    if (isManager || isHr || isAdmin) {
      items.push({
        key: "team-reviews",
        label: "Team Reviews",
        children: <ManagerReviewPanel />,
      });
    }

    if (isHr || isAdmin) {
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
  }, [isManager, isHr, isAdmin]);

  return (
    <div className={styles.landingRoot}>
      <CommonAppBar appTitle="Performance Appraisal" />
      <div className={styles.content}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className={styles.mainTabs}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
        />
      </div>
    </div>
  );
};

export default HrmAppraisalLanding;
