// src/components/Tile.tsx

import React from "react";
import Link from "next/link";
import { Tooltip } from "antd";
import { ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./Tile.module.css";

interface TileProps {
  description: string;
  url: string;
  activityId: string;
  subLabel?: string;
  icon?: LucideIcon;
}

const Tile: React.FC<TileProps> = ({ description, url, activityId, subLabel, icon: Icon }) => {
  const cleanedUrl = url?.replace(/\/index\.html$/, "") || "/";

  const handleClickIcon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/hrm${cleanedUrl}`, "_blank");
  };

  return (
    <Tooltip title={description}>
      <Link
        href={cleanedUrl}
        className={styles.tileLink}
        data-testid={`tile-link-${activityId}`}
      >
        <div className={styles.tile}>
          <div className={styles.iconContainer}>
            {Icon && <Icon size={28} strokeWidth={1.5} />}
          </div>
          <div className={styles.cardContent}>
            <span className={styles.description}>{description}</span>
            {subLabel && <span className={styles.subLabel}>{subLabel}</span>}
          </div>
          <button
            className={styles.openButton}
            onClick={handleClickIcon}
            aria-label={`Open ${description} in new tab`}
            data-testid={`tile-open-new-tab-${activityId}`}
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </Link>
    </Tooltip>
  );
};

export default Tile;
