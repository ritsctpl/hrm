// src/components/Tile.tsx

import React from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import { ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./Tile.module.css";

interface TileProps {
  description: string;
  url: string;
  activityId: string;
  subLabel?: string;
  badgeCount?: number;
  icon?: LucideIcon;
}

const Tile: React.FC<TileProps> = ({ description, url, activityId, subLabel, badgeCount, icon: Icon }) => {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent) => {
    const cleanedUrl = url.replace(/\/index\.html$/, "");
    if (event.ctrlKey || event.metaKey) {
      window.open(`/hrm${cleanedUrl}`, "_blank");
    } else {
      router.push(cleanedUrl);
    }
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanedUrlCtrl = `/hrm${url.replace(/\/index\.html$/, "")}`;
    window.open(cleanedUrlCtrl, "_blank");
  };

  return (
    <Tooltip title={description}>
      <div className={styles.tile} onClick={handleClick}>
        {badgeCount != null && badgeCount > 0 && (
          <span className={styles.badge}>{badgeCount}</span>
        )}
        <div className={styles.iconContainer}>
          {Icon && <Icon size={28} strokeWidth={1.5} />}
        </div>
        <div className={styles.cardContent}>
          <span className={styles.description}>{description}</span>
          {subLabel && (
            <span className={styles.subLabel}>{subLabel}</span>
          )}
        </div>
        <button
          className={styles.openButton}
          onClick={handleClickIcon}
          aria-label={`Open ${description} in new tab`}
        >
          <ExternalLink size={13} />
        </button>
      </div>
    </Tooltip>
  );
};

export default Tile;
