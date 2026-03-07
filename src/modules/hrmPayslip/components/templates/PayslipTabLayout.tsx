'use client';

import React from "react";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import PayslipTemplateList from "../organisms/PayslipTemplateList";
import PayslipTemplateForm from "../organisms/PayslipTemplateForm";
import styles from "../../styles/TemplateDesigner.module.css";

const PayslipTabLayout: React.FC = () => {
  return (
    <div className={styles.designerRoot}>
      <PayslipTemplateList />
      <PayslipTemplateForm />
    </div>
  );
};

export default PayslipTabLayout;
