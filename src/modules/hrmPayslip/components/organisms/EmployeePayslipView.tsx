'use client';

import React, { useEffect } from "react";
import { Button, Empty, Skeleton, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import MonthNavigator from "../molecules/MonthNavigator";
import PayslipRenderer from "./PayslipRenderer";
import { formatPeriodLabel } from "../../utils/payslipFormatters";

const EmployeePayslipView: React.FC = () => {
  const {
    myPayslipYear,
    myPayslipMonth,
    myPayslipList,
    myPayslipRenderData,
    myPayslipLoading,
    setMyPayslipYear,
    setMyPayslipMonth,
    loadMyPayslipData,
    downloadMyPayslip,
  } = useHrmPayslipStore();

  const availableMonths = myPayslipList.map((p) => p.payrollMonth);

  useEffect(() => {
    loadMyPayslipData(myPayslipYear, myPayslipMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPayslipYear, myPayslipMonth]);

  const handleYearChange = (year: number) => {
    setMyPayslipYear(year);
  };

  const handleMonthSelect = (month: number) => {
    setMyPayslipMonth(month);
  };

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}
      >
        <MonthNavigator
          year={myPayslipYear}
          selectedMonth={myPayslipMonth}
          availableMonths={availableMonths}
          onYearChange={handleYearChange}
          onMonthSelect={handleMonthSelect}
        />
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          disabled={!myPayslipRenderData}
          onClick={() => downloadMyPayslip(myPayslipYear, myPayslipMonth)}
        >
          Download PDF
        </Button>
      </div>

      {myPayslipLoading && (
        <Skeleton active style={{ width: 794, height: 1123 }} />
      )}

      {!myPayslipLoading && !myPayslipRenderData && (
        <Empty
          description={
            <Typography.Text type="secondary">
              Payslip not yet generated for{" "}
              {formatPeriodLabel(myPayslipYear, myPayslipMonth)}
            </Typography.Text>
          }
        />
      )}

      {!myPayslipLoading && myPayslipRenderData && (
        <PayslipRenderer data={myPayslipRenderData} />
      )}
    </div>
  );
};

export default EmployeePayslipView;
