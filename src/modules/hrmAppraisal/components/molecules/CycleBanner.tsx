'use client';

import React from "react";
import { Steps, Tag, Typography } from "antd";
import CycleStatusBadge from "../atoms/CycleStatusBadge";
import type { AppraisalCycle } from "../../types/domain.types";
import { PHASE_LABELS } from "../../utils/appraisalConstants";
import styles from "../../styles/AppraisalLanding.module.css";

interface Props {
  cycle: AppraisalCycle;
}

const PHASE_STEP_STATUS: Record<string, "wait" | "process" | "finish" | "error"> = {
  NOT_STARTED: "wait",
  OPEN: "process",
  CLOSED: "finish",
};

const CycleBanner: React.FC<Props> = ({ cycle }) => {
  const currentPhaseIndex = cycle.phases.findIndex((p) => p.status === "OPEN");

  return (
    <div className={styles.cycleBanner}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Typography.Title level={5} className={styles.cycleName}>
            {cycle.cycleName}
          </Typography.Title>
          <Typography.Paragraph className={styles.cycleMeta}>
            Period: {cycle.periodStart} — {cycle.periodEnd}
          </Typography.Paragraph>
        </div>
        <CycleStatusBadge status={cycle.status} />
      </div>
      <Steps
        size="small"
        current={currentPhaseIndex}
        items={cycle.phases
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
          .map((phase) => ({
            title: (
              <span style={{ color: "#fff", fontSize: 11 }}>
                {PHASE_LABELS[phase.phaseType] ?? phase.phaseName}
              </span>
            ),
            status: PHASE_STEP_STATUS[phase.status] ?? "wait",
            description: (
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
                {phase.startDate} – {phase.endDate}
              </span>
            ),
          }))}
        style={{ "--steps-item-title-color": "#fff" } as React.CSSProperties}
      />
    </div>
  );
};

export default CycleBanner;
