"use client";

import React from "react";
import { Tag } from "antd";
import { AnnouncementCategory } from "../../types/domain.types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../utils/constants";

interface AnnouncementCategoryBadgeProps {
  category: AnnouncementCategory;
}

const AnnouncementCategoryBadge: React.FC<AnnouncementCategoryBadgeProps> = ({ category }) => (
  <Tag color={CATEGORY_COLORS[category]}>{CATEGORY_LABELS[category]}</Tag>
);

export default AnnouncementCategoryBadge;
