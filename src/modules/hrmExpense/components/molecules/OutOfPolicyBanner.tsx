"use client";

import React from "react";
import { Alert, Form, Input } from "antd";

interface Props {
  show: boolean;
  justification: string;
  readonly?: boolean;
  onJustificationChange?: (val: string) => void;
}

const OutOfPolicyBanner: React.FC<Props> = ({ show, justification, readonly, onJustificationChange }) => {
  if (!show) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <Alert
        type="warning"
        showIcon
        message="One or more items exceed the daily policy limit."
        description={
          !readonly && (
            <Form.Item label="Justification" required style={{ marginBottom: 0, marginTop: 8 }}>
              <Input.TextArea
                placeholder="Explain why the limit was exceeded..."
                value={justification}
                onChange={(e) => onJustificationChange?.(e.target.value)}
                rows={2}
              />
            </Form.Item>
          )
        }
      />
      {readonly && justification && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#fffbe6", borderRadius: 4, fontSize: 13 }}>
          <strong>Justification:</strong> {justification}
        </div>
      )}
    </div>
  );
};

export default OutOfPolicyBanner;
