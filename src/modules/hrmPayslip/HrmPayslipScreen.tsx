'use client';

import React, { useEffect } from "react";
import { Button, Skeleton } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import CommonAppBar from "@/components/CommonAppBar";
import PayslipRenderer from "./components/organisms/PayslipRenderer";
import { useHrmPayslipStore } from "./stores/payslipStore";
import styles from "./styles/Payslip.module.css";

interface HrmPayslipScreenProps {
  employeeId: string;
  payrollYear: number;
  payrollMonth: number;
  onBack: () => void;
}

const HrmPayslipScreen: React.FC<HrmPayslipScreenProps> = ({
  employeeId,
  payrollYear,
  payrollMonth,
  onBack,
}) => {
  const { myPayslipRenderData, myPayslipLoading, loadMyPayslipData, downloadMyPayslip } =
    useHrmPayslipStore();

  useEffect(() => {
    loadMyPayslipData(payrollYear, payrollMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, payrollYear, payrollMonth]);

  return (
    <div className={styles.payslipScreen}>
      <CommonAppBar appTitle="Payslip" />
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 24px" }}>
        <Button
          icon={<DownloadOutlined />}
          disabled={!myPayslipRenderData}
          onClick={() => downloadMyPayslip(payrollYear, payrollMonth)}
        >
          Download PDF
        </Button>
      </div>
      <div className={styles.payslipScreenContent}>
        {myPayslipLoading && <Skeleton active style={{ width: 794 }} />}
        {!myPayslipLoading && myPayslipRenderData && (
          <PayslipRenderer data={myPayslipRenderData} />
        )}
      </div>
    </div>
  );
};

export default HrmPayslipScreen;
