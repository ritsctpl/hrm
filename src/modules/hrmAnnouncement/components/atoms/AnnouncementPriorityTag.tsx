"use client";

import React from "react";
import { Tag } from "antd";
import { AnnouncementPriority } from "../../types/domain.types";
import { PRIORITY_COLORS } from "../../utils/constants";

interface AnnouncementPriorityTagProps {
  priority: AnnouncementPriority;
}

const AnnouncementPriorityTag: React.FC<AnnouncementPriorityTagProps> = ({ priority }) => (
  <Tag color={PRIORITY_COLORS[priority]}>{priority}</Tag>
);

export default AnnouncementPriorityTag;
