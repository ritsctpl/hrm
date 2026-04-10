'use client';

import React from "react";
import { Button, Empty, Spin, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/TemplateDesigner.module.css";

const PayslipTemplateList: React.FC = () => {
  const { templates, selectedTemplate, selectTemplate, templatesLoading } = useHrmPayslipStore();

  const emptyTemplate = {
    handle: "",
    site: "",
    templateCode: "",
    templateName: "",
    isActive: false,
    companyName: "",
    companyAddress: "",
    companyLogoPath: "",
    cin: "",
    gstin: "",
    showAttendanceSection: true,
    showEarningsSection: true,
    showDeductionsSection: true,
    showTaxSection: false,
    showNetPayInWords: true,
    showFooterSignature: true,
    footerNote: "This is a computer-generated payslip.",
    signatureLabel: "Authorized Signatory",
    earningsSectionLabel: "EARNINGS",
    deductionsSectionLabel: "DEDUCTIONS",
    version: 1,
    active: 0,
    createdDateTime: "",
    modifiedDateTime: "",
  };

  return (
    <div className={styles.templateList}>
      <div className={styles.templateListHeader}>
        <Typography.Text strong>Templates</Typography.Text>
        <Can I="add">
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => selectTemplate(emptyTemplate)}
          >
            New
          </Button>
        </Can>
      </div>

      {templatesLoading && <Spin style={{ display: "block", textAlign: "center" }} />}

      {!templatesLoading && templates.length === 0 && (
        <Empty description="No templates" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {templates.map((t) => (
        <div
          key={t.handle}
          className={`${styles.templateRow} ${selectedTemplate?.handle === t.handle ? styles.templateRowActive : ""}`}
          onClick={() => selectTemplate(t)}
        >
          <div>
            <Typography.Text style={{ fontSize: 13 }}>{t.templateCode}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {t.templateName}
            </Typography.Text>
          </div>
          {t.isActive && <Tag color="green" style={{ fontSize: 10 }}>Active</Tag>}
        </div>
      ))}
    </div>
  );
};

export default PayslipTemplateList;
