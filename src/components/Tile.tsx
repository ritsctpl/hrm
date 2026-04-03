// src/components/Tile.tsx

"use client";
import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import { getModuleIcon } from "@utils/moduleIconMap";
import styles from "./Tile.module.css";

interface TileProps {
  description: string;
  url: string;
  activityId: string;
}

const Tile: React.FC<TileProps> = ({ description, url }) => {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent) => {
    const cleanedUrl = url.replace(/\/index\.html$/, "");

    if (event.ctrlKey) {
      window.open(`/hrm${cleanedUrl}`, "_blank");
    } else {
      router.push(cleanedUrl);
    }
  };

  const IconComponent = getModuleIcon(url);

  return (
    <Tooltip title={description}>
      <Card className={styles.tile} onClick={handleClick}>
        <CardContent className={styles.cardContent}>
          <div className={styles.iconWrapper}>
            <IconComponent size={24} strokeWidth={1.5} />
          </div>
          <Typography className={styles.description}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default Tile;
