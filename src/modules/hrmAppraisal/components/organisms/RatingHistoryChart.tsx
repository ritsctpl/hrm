'use client';

import React from "react";
import ReactECharts from "echarts-for-react";

interface HistoryPoint {
  cycleLabel: string;
  rating: number;
}

interface Props {
  history: HistoryPoint[];
  height?: number;
}

const RatingHistoryChart: React.FC<Props> = ({ history, height = 240 }) => {
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: history.map((h) => h.cycleLabel),
    },
    yAxis: {
      type: "value",
      min: 1,
      max: 5,
      interval: 1,
    },
    series: [
      {
        name: "Rating",
        type: "line",
        data: history.map((h) => h.rating),
        smooth: true,
        lineStyle: { color: "#1890ff", width: 2 },
        itemStyle: { color: "#1890ff" },
        label: { show: true, position: "top" },
        markPoint: {
          data: [{ type: "max", name: "Peak" }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
};

export default RatingHistoryChart;
