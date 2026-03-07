"use client";

import React, { useEffect, useState } from "react";
import { Tag } from "antd";
import { SlaCountdownBadgeProps } from "../../types/ui.types";
import { SLA_WARNING_HOURS, SLA_CRITICAL_HOURS } from "../../utils/constants";

function getRemaining(deadline: string): number {
  return new Date(deadline).getTime() - Date.now();
}

function formatTime(ms: number): string {
  if (ms <= 0) return "SLA Breached";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const SlaCountdownBadge: React.FC<SlaCountdownBadgeProps> = ({
  deadline,
  breached,
  escalationLevel,
}) => {
  const [remaining, setRemaining] = useState(() => getRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemaining(deadline));
    }, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  const hoursLeft = remaining / 3600000;
  let color: string = "green";
  if (breached || remaining <= 0) color = "red";
  else if (hoursLeft <= SLA_CRITICAL_HOURS) color = "red";
  else if (hoursLeft <= SLA_WARNING_HOURS) color = "orange";

  const label = breached || remaining <= 0 ? "SLA!" : formatTime(remaining);

  return (
    <Tag color={color} style={{ fontSize: 11 }}>
      {label}
      {escalationLevel > 0 && (
        <span style={{ marginLeft: 4 }}>ESC{escalationLevel}</span>
      )}
    </Tag>
  );
};

export default SlaCountdownBadge;
