'use client';

import React from "react";
import { Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
  message?: string;
}

const GenerationProgress: React.FC<Props> = ({ message = "Generating payslips..." }) => (
  <div style={{ textAlign: "center", padding: "32px 0" }}>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
    <Typography.Paragraph style={{ marginTop: 16, color: "#666" }}>{message}</Typography.Paragraph>
  </div>
);

export default GenerationProgress;
