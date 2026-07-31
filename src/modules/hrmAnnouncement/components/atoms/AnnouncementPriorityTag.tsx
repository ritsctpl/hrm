"use client";

import React from "react";
import { Tag } from "antd";
import { AnnouncementPriority } from "../../types/domain.types";
import { PRIORITY_COLORS, PRIORITY_LABELS, normalizePriority } from "../../utils/constants";

interface AnnouncementPriorityTagProps {
  priority: AnnouncementPriority;
}

// Normalized so legacy NORMAL/HIGH/URGENT values still resolve to a colour.
const AnnouncementPriorityTag: React.FC<AnnouncementPriorityTagProps> = ({ priority }) => {
  const p = normalizePriority(priority);
  return <Tag color={PRIORITY_COLORS[p]}>{PRIORITY_LABELS[p]}</Tag>;
};

export default AnnouncementPriorityTag;
