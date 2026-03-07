'use client';

import React from "react";
import ReactECharts from "echarts-for-react";
import type { RadarChartProps } from "../../types/ui.types";

const RadarChartPanel: React.FC<RadarChartProps> = ({
  competencies,
  selfRatings,
  managerRatings,
  peerAvgRatings,
  height = 360,
}) => {
  const indicators = competencies.map((name) => ({ name, max: 5 }));

  const option = {
    legend: {
      data: ["Self", "Manager", "Peer Average"],
      bottom: 0,
    },
    radar: {
      indicator: indicators,
      radius: "65%",
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: selfRatings,
            name: "Self",
            itemStyle: { color: "#1890ff" },
            areaStyle: { opacity: 0.1 },
          },
          {
            value: managerRatings,
            name: "Manager",
            itemStyle: { color: "#52c41a" },
            areaStyle: { opacity: 0.1 },
          },
          {
            value: peerAvgRatings,
            name: "Peer Average",
            itemStyle: { color: "#fa8c16" },
            areaStyle: { opacity: 0.1 },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
};

export default RadarChartPanel;
