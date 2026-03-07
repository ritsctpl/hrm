'use client';

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Tabs } from "antd";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmPayslipStore } from "./stores/payslipStore";
import styles from "./styles/Payslip.module.css";

const PayslipGenerationPanel = dynamic(
  () => import("./components/organisms/PayslipGenerationPanel"),
  { ssr: false }
);
const EmployeePayslipView = dynamic(
  () => import("./components/organisms/EmployeePayslipView"),
  { ssr: false }
);
const PayslipRepository = dynamic(
  () => import("./components/organisms/PayslipRepository"),
  { ssr: false }
);
const PayslipTabLayout = dynamic(
  () => import("./components/templates/PayslipTabLayout"),
  { ssr: false }
);

const HrmPayslipLanding: React.FC = () => {
  const { activeTab, setActiveTab, loadMyPayslips, fetchTemplates } = useHrmPayslipStore();

  const role = parseCookies().role ?? "EMPLOYEE";
  const isAdminOrHr = role === "ADMIN" || role === "HR" || role === "FINANCE";

  useEffect(() => {
    loadMyPayslips();
    if (isAdminOrHr) {
      fetchTemplates();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabItems = useMemo(() => {
    const items = [];
    if (isAdminOrHr) {
      items.push({
        key: "generate",
        label: "Generate",
        children: <PayslipGenerationPanel />,
      });
    }
    items.push({
      key: "myPayslips",
      label: "My Payslips",
      children: <EmployeePayslipView />,
    });
    if (isAdminOrHr) {
      items.push({
        key: "repository",
        label: "Repository",
        children: <PayslipRepository />,
      });
      items.push({
        key: "templates",
        label: "Templates",
        children: <PayslipTabLayout />,
      });
    }
    return items;
  }, [isAdminOrHr]);

  const defaultTab = isAdminOrHr ? "generate" : "myPayslips";

  return (
    <div className={styles.payslipPage}>
      <CommonAppBar appTitle="Payslip Management" showBack={false} />
      <div className={styles.tabsWrapper}>
        <Tabs
          activeKey={activeTab}
          defaultActiveKey={defaultTab}
          onChange={(key) => setActiveTab(key as typeof activeTab)}
          items={tabItems}
          className={styles.mainTabs}
        />
      </div>
    </div>
  );
};

export default HrmPayslipLanding;
