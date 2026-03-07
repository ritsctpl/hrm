"use client";

import React, { useState } from "react";
import { LeaveRequest } from "../../types/domain.types";
import LeaveCalendarView from "./LeaveCalendarView";

interface TeamCalendarViewProps {
  requests: LeaveRequest[];
}

const TeamCalendarView: React.FC<TeamCalendarViewProps> = ({ requests }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const year = now.getFullYear();

  return (
    <LeaveCalendarView
      requests={requests}
      year={year}
      month={month}
      onMonthChange={setMonth}
      teamView
    />
  );
};

export default TeamCalendarView;
