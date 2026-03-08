'use client';

import React from "react";
import dynamic from "next/dynamic";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmAppraisalStore } from "./stores/hrmAppraisalStore";
import type { AppraisalScreenView } from "./types/ui.types";
import styles from "./styles/AppraisalLanding.module.css";

const GoalSettingTemplate = dynamic(
  () => import("./components/templates/GoalSettingTemplate"),
  { ssr: false }
);
const SelfAssessmentForm = dynamic(
  () => import("./components/organisms/SelfAssessmentForm"),
  { ssr: false }
);
const ManagerReviewPanel = dynamic(
  () => import("./components/organisms/ManagerReviewPanel"),
  { ssr: false }
);
const PeerFeedbackOrchestrator = dynamic(
  () => import("./components/organisms/PeerFeedbackOrchestrator"),
  { ssr: false }
);
const PIPPanel = dynamic(() => import("./components/organisms/PIPPanel"), { ssr: false });
const CalibrationTemplate = dynamic(
  () => import("./components/templates/CalibrationTemplate"),
  { ssr: false }
);
const AppraisalSummaryTemplate = dynamic(
  () => import("./components/templates/AppraisalSummaryTemplate"),
  { ssr: false }
);

const SCREEN_TITLES: Record<AppraisalScreenView, string> = {
  LANDING: "Performance Appraisal",
  GOAL_SETTING: "Appraisal > Goal Setting",
  SELF_ASSESSMENT: "Appraisal > Self Assessment",
  MANAGER_REVIEW: "Appraisal > Manager Review",
  FEEDBACK_360: "Appraisal > 360 Feedback",
  APPRAISAL_SUMMARY: "Appraisal > Summary",
  CALIBRATION: "Appraisal > HR Calibration",
  PIP: "Appraisal > PIP Management",
};

const HrmAppraisalScreen: React.FC = () => {
  const { currentView, setCurrentView } = useHrmAppraisalStore();

  const renderContent = () => {
    switch (currentView) {
      case "GOAL_SETTING":
        return <GoalSettingTemplate />;
      case "SELF_ASSESSMENT":
        return <SelfAssessmentForm />;
      case "MANAGER_REVIEW":
        return <ManagerReviewPanel />;
      case "FEEDBACK_360":
        return <PeerFeedbackOrchestrator />;
      case "APPRAISAL_SUMMARY":
        return <AppraisalSummaryTemplate />;
      case "CALIBRATION":
        return <CalibrationTemplate />;
      case "PIP":
        return <PIPPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.landingRoot}>
      <CommonAppBar
        appTitle={SCREEN_TITLES[currentView]}
      />
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default HrmAppraisalScreen;
