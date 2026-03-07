'use client';

import React from "react";
import { Form, Switch } from "antd";

interface Props {
  name: string;
  label: string;
}

const SectionToggle: React.FC<Props> = ({ name, label }) => (
  <Form.Item name={name} label={label} valuePropName="checked" style={{ marginBottom: 8 }}>
    <Switch />
  </Form.Item>
);

export default SectionToggle;
