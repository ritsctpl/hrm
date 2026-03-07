'use client';

import React from "react";
import dynamic from "next/dynamic";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmAppraisalStore } from "./stores/hrmAppraisalStore";
import type { AppraisalScreenView } from "./types/ui.types";

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
      case "PIP":
        return <PIPPanel />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CommonAppBar
        title={SCREEN_TITLES[currentView]}
        showBack
        onBack={() => setCurrentView("LANDING")}
      />
      <div style={{ flex: 1, overflow: "auto" }}>{renderContent()}</div>
    </div>
  );
};

export default HrmAppraisalScreen;
