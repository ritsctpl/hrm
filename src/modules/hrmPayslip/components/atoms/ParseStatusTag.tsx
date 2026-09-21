'use client';

import React from "react";
import { Tag, Tooltip } from "antd";
import type { PayslipParseStatus } from "../../types/domain.types";

const LABELS: Record<PayslipParseStatus, { text: string; color: string; hint: string }> = {
  OK: { text: "Stored", color: "green", hint: "Stored and ready to send." },
  REPLACED_EXISTING: {
    text: "Replaced",
    color: "blue",
    hint: "Stored. The previous payslip for this period was archived.",
  },
  EMPLOYEE_NO_EMAIL: {
    text: "No email",
    color: "gold",
    hint: "Stored and downloadable, but this employee has no work email on record.",
  },
  BAD_FILENAME: {
    text: "Bad file name",
    color: "red",
    hint: "Rename to Rxxxxx_mmm-yyyy.pdf and upload again.",
  },
  EMPLOYEE_NOT_FOUND: {
    text: "Unknown employee",
    color: "red",
    hint: "No active employee holds that code at this site.",
  },
  NOT_A_PDF: { text: "Not a PDF", color: "red", hint: "Only PDF files can be uploaded." },
  STORAGE_FAILED: {
    text: "Storage failed",
    color: "red",
    hint: "The file was fine but could not be stored. Upload it again; if it keeps failing, this is a system issue, not a problem with the file.",
  },
};

const ParseStatusTag: React.FC<{ status: PayslipParseStatus }> = ({ status }) => {
  const meta = LABELS[status];
  if (!meta) return <Tag>{status}</Tag>;
  return (
    <Tooltip title={meta.hint}>
      <Tag color={meta.color}>{meta.text}</Tag>
    </Tooltip>
  );
};

export default ParseStatusTag;
