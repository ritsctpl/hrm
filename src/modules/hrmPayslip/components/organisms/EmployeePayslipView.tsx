'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, Card, Empty, Skeleton, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import MonthNavigator from "../molecules/MonthNavigator";
import PayslipRenderer from "./PayslipRenderer";
import { payslipPeriod } from "../../utils/payslipFormat";
import { payslipPasswordHint } from "../../utils/payslipPdf";

/**
 * The employee's own payslips. fe-spec §1.
 *
 * The PDF is produced here in the browser from the frozen snapshot; the server stores none.
 */
const EmployeePayslipView: React.FC = () => {
  const {
    myPayslipYear,
    myPayslipMonth,
    myPayslipList,
    snapshot,
    snapshotLoading,
    snapshotError,
    pdfGenerating,
    setMyPayslipYear,
    setMyPayslipMonth,
    loadMyPayslips,
    loadMySnapshot,
    downloadMyPayslip,
  } = useHrmPayslipStore();

  const searchParams = useSearchParams();
  // State, not a ref: the snapshot effect below must not run until the deep-linked month has
  // actually landed in the store. With a ref it fired once with the stale default month, so two
  // requests raced and the failure message named the wrong month.
  const [linkResolved, setLinkResolved] = useState(false);

  /**
   * The email sent when a run is marked Paid links to
   * `/rits/hrm_payslip_app?year=2026&month=7`. Without honouring those parameters the employee
   * would land on whatever month happened to be selected, and the link would be decorative.
   * A month that is not issued shows its own empty state — it must never quietly fall back to a
   * different month, which would show someone a payslip other than the one they clicked for.
   */
  useEffect(() => {
    if (linkResolved) return;
    // useSearchParams can be empty on the first client render, and marking the link "applied" then
    // would swallow it for good — which is exactly what happened: a link to Jul-2026 landed on the
    // default month. window.location.search is authoritative here and available as soon as this
    // effect runs in the browser.
    const query = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(query || searchParams?.toString() || "");
    const year = Number(params.get("year"));
    const month = Number(params.get("month"));
    if (year >= 1970 && month >= 1 && month <= 12) {
      setMyPayslipYear(year);
      setMyPayslipMonth(month);
    }
    setLinkResolved(true);
  }, [linkResolved, searchParams, setMyPayslipYear, setMyPayslipMonth]);

  useEffect(() => {
    loadMyPayslips();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPayslipYear]);

  useEffect(() => {
    if (!linkResolved) return;
    loadMySnapshot(myPayslipYear, myPayslipMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkResolved, myPayslipYear, myPayslipMonth]);

  const availableMonths = myPayslipList.map((p) => p.payrollMonth);
  const revoked = myPayslipList.find(
    (p) => p.payrollMonth === myPayslipMonth && p.status === "REVOKED",
  );
  const period = payslipPeriod(myPayslipYear, myPayslipMonth);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
        <MonthNavigator
          year={myPayslipYear}
          selectedMonth={myPayslipMonth}
          availableMonths={availableMonths}
          onYearChange={setMyPayslipYear}
          onMonthSelect={setMyPayslipMonth}
        />
        <Card size="small" style={{ minWidth: 230 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            block
            loading={pdfGenerating}
            disabled={!snapshot || !!revoked}
            onClick={() => downloadMyPayslip(myPayslipYear, myPayslipMonth)}
          >
            Download PDF
          </Button>
          {snapshot && payslipPasswordHint(snapshot) && (
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              {payslipPasswordHint(snapshot)}
            </Typography.Paragraph>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        {snapshotError && (
          <Alert type="error" showIcon message={snapshotError} style={{ marginBottom: 16 }} />
        )}

        {revoked && (
          <Alert
            type="warning"
            showIcon
            message="This payslip was withdrawn and replaced. Please download the reissued payslip for this month."
            style={{ marginBottom: 16 }}
          />
        )}

        {snapshotLoading && <Skeleton active paragraph={{ rows: 12 }} />}

        {!snapshotLoading && !snapshot && !revoked && !snapshotError && (
          <Empty
            description={
              <Typography.Text type="secondary">
                No payslip issued for {period} yet. Your payslip appears here once payroll for the
                month is approved.
              </Typography.Text>
            }
          />
        )}

        {!snapshotLoading && snapshot && !revoked && <PayslipRenderer snapshot={snapshot} />}
      </div>
    </div>
  );
};

export default EmployeePayslipView;
