import { HeadcountTrendData, DeptDistributionItem, LeaveUtilizationItem, AttritionData } from "../types/domain.types";

export function buildHeadcountTrendOption(data: HeadcountTrendData[]) {
  return {
    tooltip: { trigger: "axis" as const },
    legend: { data: ["Headcount", "New Hires", "Separations"], bottom: 0 },
    grid: { top: 20, bottom: 40, left: 50, right: 50 },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => d.month),
    },
    yAxis: [
      { type: "value" as const, name: "Headcount" },
      { type: "value" as const, name: "Changes", position: "right" as const },
    ],
    series: [
      {
        name: "Headcount",
        type: "line" as const,
        data: data.map((d) => d.headcount),
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: "#1890ff" },
        lineStyle: { width: 3 },
      },
      {
        name: "New Hires",
        type: "bar" as const,
        yAxisIndex: 1,
        data: data.map((d) => d.newHires),
        itemStyle: { color: "#52c41a" },
      },
      {
        name: "Separations",
        type: "bar" as const,
        yAxisIndex: 1,
        data: data.map((d) => d.separations),
        itemStyle: { color: "#ff4d4f" },
      },
    ],
  };
}

export function buildDeptDistributionOption(data: DeptDistributionItem[]) {
  return {
    tooltip: { trigger: "item" as const },
    legend: { bottom: 0, type: "scroll" as const },
    series: [
      {
        type: "pie" as const,
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12 } },
        data: data.map((d) => ({ value: d.count, name: d.department })),
      },
    ],
  };
}

export function buildAttritionGaugeOption(data: AttritionData) {
  return {
    series: [
      {
        type: "gauge" as const,
        min: 0,
        max: 15,
        splitNumber: 3,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.33, "#52c41a"],
              [0.67, "#faad14"],
              [1, "#ff4d4f"],
            ],
          },
        },
        pointer: { itemStyle: { color: "auto" } },
        axisTick: { distance: -20, splitNumber: 5, lineStyle: { width: 2, color: "#999" } },
        splitLine: { distance: -24, length: 10, lineStyle: { width: 3, color: "#999" } },
        axisLabel: { color: "inherit", distance: 30, fontSize: 10 },
        detail: {
          valueAnimation: true,
          formatter: "{value}%",
          color: "inherit",
          fontSize: 18,
          offsetCenter: [0, "70%"],
        },
        data: [{ value: data.currentRate }],
      },
    ],
  };
}

export function buildLeaveUtilizationOption(data: LeaveUtilizationItem[]) {
  return {
    tooltip: { trigger: "item" as const },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie" as const,
        radius: ["40%", "70%"],
        data: data.map((d) => ({ value: d.daysUsed, name: d.leaveType })),
        emphasis: { itemStyle: { shadowBlur: 10 } },
        label: { show: false },
      },
    ],
  };
}

export function buildModuleUsageOption(data: { module: string; usagePercent: number }[]) {
  return {
    tooltip: { trigger: "axis" as const, axisPointer: { type: "shadow" as const } },
    grid: { top: 10, bottom: 10, left: 100, right: 40 },
    xAxis: { type: "value" as const, max: 100 },
    yAxis: {
      type: "category" as const,
      data: data.map((d) => d.module),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: "bar" as const,
        data: data.map((d) => ({
          value: d.usagePercent,
          itemStyle: {
            color: d.usagePercent >= 80 ? "#52c41a" : d.usagePercent >= 50 ? "#1890ff" : "#faad14",
          },
        })),
        label: { show: true, position: "right" as const, formatter: "{c}%" },
      },
    ],
  };
}
