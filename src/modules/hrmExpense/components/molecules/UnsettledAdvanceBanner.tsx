"use client";

import React from "react";
import { Alert, Button } from "antd";
import type { ExpenseReport } from "../../types/domain.types";

interface Props {
  advance: ExpenseReport | null;
  onView?: (handle: string) => void;
}

const UnsettledAdvanceBanner: React.FC<Props> = ({ advance, onView }) => {
  if (!advance) return null;

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 12 }}
      message={`You have an unsettled advance (${advance.requestId} — ${advance.currency} ${advance.totalClaimedAmount.toLocaleString()}).`}
      description="You cannot raise a new advance until the existing one is settled."
      action={
        onView && (
          <Button size="small" onClick={() => onView(advance.handle)}>
            View Advance {advance.requestId}
          </Button>
        )
      }
    />
  );
};

export default UnsettledAdvanceBanner;
