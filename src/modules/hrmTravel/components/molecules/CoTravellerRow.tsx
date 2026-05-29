"use client";

import React from "react";
import { Button, message, Tooltip } from "antd";
import { DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import type { CoTravellerDto } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

interface Props {
  traveller: CoTravellerDto;
  readonly?: boolean;
  onRemove?: (employeeId: string) => void;
}

const CoTravellerRow: React.FC<Props> = ({ traveller, readonly, onRemove }) => {
  const handleCopyEmail = () => {
    if (traveller.workEmail) {
      navigator.clipboard.writeText(traveller.workEmail);
      message.success("Email copied to clipboard");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid #f5f5f5",
        gap: 8,
      }}
    >
      <span style={{ width: 200, fontSize: 12, color: "#8c8c8c", flexShrink: 0 }}>
        {traveller.employeeId} - {traveller.employeeName}
      </span>
      <span style={{ width: 120, fontSize: 12, color: "#595959", flexShrink: 0 }}>
        {traveller.position || "—"}
      </span>
      <span style={{ width: 110, fontSize: 12, color: "#595959", flexShrink: 0 }}>{traveller.department}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <Tooltip title={traveller.workEmail || "No email"}>
          <span style={{ fontSize: 12, color: "#595959", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {traveller.workEmail || "—"}
          </span>
        </Tooltip>
        {traveller.workEmail && (
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopyEmail}
            title="Copy email"
            style={{ flexShrink: 0 }}
          />
        )}
      </div>
      {!readonly && onRemove && (
        <Can I="delete" object="travel_co_traveller">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemove(traveller.employeeId)}
            style={{ flexShrink: 0 }}
          />
        </Can>
      )}
    </div>
  );
};

export default CoTravellerRow;
