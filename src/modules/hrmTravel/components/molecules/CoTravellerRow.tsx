"use client";

import React from "react";
import { Tag, Button, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { CoTravellerDto } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

interface Props {
  traveller: CoTravellerDto;
  readonly?: boolean;
  onRemove?: (employeeId: string) => void;
}

const CoTravellerRow: React.FC<Props> = ({ traveller, readonly, onRemove }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid #f5f5f5",
        gap: 12,
      }}
    >
      <span style={{ width: 80, fontSize: 12, color: "#8c8c8c" }}>{traveller.employeeId}</span>
      <span style={{ flex: 1, fontSize: 13 }}>{traveller.employeeName}</span>
      <span style={{ width: 120, fontSize: 12, color: "#595959" }}>{traveller.department}</span>
      <span style={{ width: 90 }}>
        {traveller.hasConflict ? (
          <Tooltip title={traveller.conflictReason}>
            <Tag color="error">Conflict</Tag>
          </Tooltip>
        ) : (
          <Tag color="success">OK</Tag>
        )}
      </span>
      {!readonly && onRemove && (
        <Can I="delete" object="travel_co_traveller">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemove(traveller.employeeId)}
          />
        </Can>
      )}
    </div>
  );
};

export default CoTravellerRow;
