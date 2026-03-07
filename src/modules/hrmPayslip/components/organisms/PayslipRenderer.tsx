'use client';

import React from "react";
import { Descriptions } from "antd";
import styles from "../../styles/PayslipRenderer.module.css";
import { formatCurrency, formatDate, maskAccountNumber } from "../../utils/payslipFormatters";
import type { PayslipRendererProps } from "../../types/ui.types";

const PayslipRenderer: React.FC<PayslipRendererProps> = ({ data }) => {
  const {
    companyName, companyAddress, companyLogoPath, cin, gstin,
    payPeriodLabel, employeeName, employeeNumber, designation,
    department, location, dateOfJoining, bankAccountNumber, bankIfscCode,
    workingDays, paidDays, lopDays,
    earnings, grossEarnings, deductions, totalDeductions, netPay, netPayInWords,
    earningsSectionLabel, deductionsSectionLabel,
    showAttendanceSection, showNetPayInWords, showFooterSignature,
    footerNote, signatureLabel,
  } = data;

  return (
    <div className={styles.payslipPage}>
      <div className={styles.header}>
        {companyLogoPath && (
          <img src={companyLogoPath} alt="Company Logo" className={styles.logo} />
        )}
        <div className={styles.companyDetails}>
          <h2 className={styles.companyName}>{companyName}</h2>
          <p className={styles.companyMeta}>{companyAddress}</p>
          <p className={styles.companyMeta}>CIN: {cin} | GSTIN: {gstin}</p>
        </div>
      </div>

      <div className={styles.title}>PAYSLIP</div>
      <p className={styles.period}>For the month of: {payPeriodLabel}</p>

      <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Name">{employeeName}</Descriptions.Item>
        <Descriptions.Item label="Emp No">{employeeNumber}</Descriptions.Item>
        <Descriptions.Item label="Designation">{designation}</Descriptions.Item>
        <Descriptions.Item label="Department">{department}</Descriptions.Item>
        <Descriptions.Item label="Location">{location}</Descriptions.Item>
        <Descriptions.Item label="DOJ">{formatDate(dateOfJoining)}</Descriptions.Item>
        <Descriptions.Item label="Bank A/C">
          {maskAccountNumber(bankAccountNumber)}
        </Descriptions.Item>
        <Descriptions.Item label="IFSC">{bankIfscCode}</Descriptions.Item>
      </Descriptions>

      {showAttendanceSection && (
        <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Working Days">{workingDays}</Descriptions.Item>
          <Descriptions.Item label="Paid Days">{paidDays}</Descriptions.Item>
          <Descriptions.Item label="LOP Days">
            <span style={{ color: lopDays > 0 ? "#c62828" : undefined }}>{lopDays}</span>
          </Descriptions.Item>
        </Descriptions>
      )}

      <div className={styles.payComponents}>
        <div>
          <div className={`${styles.sectionHeader} ${styles.earningHeader}`}>
            {earningsSectionLabel || "EARNINGS"}
          </div>
          <table className={styles.payTable}>
            <thead>
              <tr>
                <th>Component</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.componentCode}>
                  <td>{e.componentName}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(e.proratedAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Earnings</td>
                <td className={styles.earningTotal} style={{ textAlign: "right" }}>
                  {formatCurrency(grossEarnings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <div className={`${styles.sectionHeader} ${styles.deductionHeader}`}>
            {deductionsSectionLabel || "DEDUCTIONS"}
          </div>
          <table className={styles.payTable}>
            <thead>
              <tr>
                <th>Component</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((d) => (
                <tr key={d.componentCode}>
                  <td>{d.componentName}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(d.proratedAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Deductions</td>
                <td className={styles.deductionTotal} style={{ textAlign: "right" }}>
                  {formatCurrency(totalDeductions)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className={styles.netPay}>NET PAY: Rs. {formatCurrency(netPay)}</div>

      {showNetPayInWords && (
        <p className={styles.netPayWords}>In Words: {netPayInWords}</p>
      )}

      {showFooterSignature && (
        <div className={styles.footer}>
          <span>{footerNote || "This is a computer-generated payslip."}</span>
          <span>{signatureLabel || "Authorized Signatory"}</span>
        </div>
      )}
    </div>
  );
};

export default PayslipRenderer;
