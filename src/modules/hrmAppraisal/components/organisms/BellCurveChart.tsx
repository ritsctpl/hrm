'use client';

import React from "react";
import ReactECharts from "echarts-for-react";
import type { BellCurveChartProps } from "../../types/ui.types";
import { RATING_LABELS } from "../../utils/appraisalConstants";

const BellCurveChart: React.FC<BellCurveChartProps> = ({
  distribution,
  highlightEmployeeRating,
  height = 300,
}) => {
  const { buckets } = distribution;

  const option = {
    tooltip: { trigger: "axis" },
    legend: {
      data: ["Actual Count", "Target %"],
      bottom: 0,
    },
    xAxis: {
      type: "category",
      data: buckets.map((b) => RATING_LABELS[b.rating] ?? String(b.rating)),
    },
    yAxis: [
      { type: "value", name: "Count", position: "left" },
      { type: "value", name: "Target %", position: "right", max: 100 },
    ],
    series: [
      {
        name: "Actual Count",
        type: "bar",
        data: buckets.map((b) => ({
          value: b.count,
          itemStyle: {
            color:
              highlightEmployeeRating !== undefined && b.rating === highlightEmployeeRating
                ? "#1565c0"
                : "#91caff",
          },
          label: {
            show: true,
            position: "top",
            formatter: (params: { dataIndex: number }) => {
              const bucket = buckets[params.dataIndex];
              return `${bucket.count} (${bucket.percentage.toFixed(0)}%)`;
            },
          },
        })),
      },
      {
        name: "Target %",
        type: "line",
        yAxisIndex: 1,
        data: buckets.map((b) => b.targetPercentage),
        lineStyle: { color: "#f5222d", type: "dashed" },
        itemStyle: { color: "#f5222d" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} notMerge />;
};

export default BellCurveChart;
