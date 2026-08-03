"use client";

import React from "react";
import { Tag } from "antd";
import { AnnouncementCategory } from "../../types/domain.types";
import { useAnnouncementCategories } from "../../hooks/useAnnouncementCategories";

interface AnnouncementCategoryBadgeProps {
  category: AnnouncementCategory;
}

/**
 * Label and colour come from the server's category record — a site can define
 * its own, so nothing here is hardcoded. Falls back to the raw code while the
 * list loads or when the code is unknown, which is better than rendering blank.
 */
const AnnouncementCategoryBadge: React.FC<AnnouncementCategoryBadgeProps> = ({ category }) => {
  const { byCode } = useAnnouncementCategories();
  const record = byCode(category);

  return (
    <Tag color={record?.color || "default"}>{record?.categoryName || category}</Tag>
  );
};

export default AnnouncementCategoryBadge;
