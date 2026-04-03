// src/components/Tile.tsx

import React from "react";
import { Card, CardContent, Typography, IconButton } from "@mui/material";
import { Launch } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Button, Tooltip } from "antd";
import styles from "./Tile.module.css";
import { ExportOutlined } from "@ant-design/icons";


interface TileProps {
  description: string;
  url: string;
  activityId: string; // Ensure this is required
  subLabel?: string;      // Short description below name
  badgeCount?: number;    // Notification badge count
}

const Tile: React.FC<TileProps> = ({ description, url, activityId, subLabel, badgeCount }) => {
  const router = useRouter();
  const maxLength = 11;

  const handleClick = (event: React.MouseEvent) => {
    const cleanedUrl = url.replace(/\/index\.html$/, "");

    if (event.ctrlKey) {
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
      <Card className={styles.tile} onClick={handleClick}>
        {badgeCount != null && badgeCount > 0 && (
          <span className={styles.badge}>{badgeCount}</span>
        )}
        <CardContent className={styles.cardContent}>
          <Typography className={styles.description} fontSize="0.9rem">
            {description}
          </Typography>
          {subLabel && (
            <Typography className={styles.subLabel}>
              {subLabel}
            </Typography>
          )}
          <Typography variant="body2" className={styles.activityId}>
            {activityId.length > maxLength
              ? `${activityId.substring(0, maxLength)}...`
              : activityId}
          </Typography>
        </CardContent>
        <Button
          type="text"
          className={styles.iconButton}
          onClick={handleClickIcon}
          aria-label={`Open ${description} in new tab`}
          icon={<ExportOutlined />}
        />
      </Card>
    </Tooltip>
  );
};

export default Tile;
