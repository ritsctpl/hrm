"use client";

import React from "react";
import { Tag } from "antd";
import type { TravelType } from "../../types/domain.types";
import { TRAVEL_TYPE_COLORS } from "../../utils/travelConstants";

interface Props {
  travelType: TravelType;
}

const TravelTypeTag: React.FC<Props> = ({ travelType }) => {
  return (
    <Tag color={TRAVEL_TYPE_COLORS[travelType]}>
      {travelType}
    </Tag>
  );
};

export default TravelTypeTag;
