// src/components/Tile.tsx

import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import { Button, Tooltip } from "antd";
import styles from "./Tile.module.css";
import { ExportOutlined } from "@ant-design/icons";

interface TileProps {
  description: string;
  url: string;
  activityId: string;
}

const Tile: React.FC<TileProps> = ({ description, url, activityId }) => {
  const maxLength = 11;
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
        <Card className={styles.tile}>
          <CardContent className={styles.cardContent}>
            <Typography className={styles.description} fontSize="0.9rem">
              {description}
            </Typography>
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
            data-testid={`tile-open-new-tab-${activityId}`}
            icon={<ExportOutlined />}
          />
        </Card>
      </Link>
    </Tooltip>
  );
};

export default Tile;
