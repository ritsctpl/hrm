'use client';

import React from "react";
import styles from "../../styles/PayslipRenderer.module.css";
import type { PayslipSnapshot } from "../../types/domain.types";
import {
  payslipAmount,
  payslipAmountInWords,
  payslipDate,
  payslipNetAmount,
  payslipPeriod,
} from "../../utils/payslipFormat";

/**
 * The payslip, on screen. be-spec §12 / fe-spec §1.
 *
 * Renders the frozen snapshot in the RITS layout — the same object `payslipPdf.ts` turns into the
 * downloadable file, so what the employee sees and what they download cannot diverge.
 *
 * Format rules here are copied from `R10197_Jul-2026.pdf`, not chosen: a zero prints as `-`,
 * amounts carry Indian digit grouping rounded to whole rupees, and PAN and account number arrive
 * already masked from the server.
 */
interface Props {
  snapshot: PayslipSnapshot;
}

const PayslipRenderer: React.FC<Props> = ({ snapshot: s }) => {
  const period = payslipPeriod(s.payrollYear, s.payrollMonth, s.payPeriodLabel);
  const earnings = s.earnings ?? [];
  const deductions = s.deductions ?? [];
  const rows = Math.max(earnings.length, deductions.length, 1);

  return (
    <div className={styles.payslip} data-testid="payslip-render">
      <div className={styles.header}>
        {s.companyLogoPath ? (
          <img src={s.companyLogoPath} alt="" className={styles.logo} />
        ) : (
          <div className={styles.logoPlaceholder} aria-hidden="true" />
        )}
        <div>
          <div className={styles.companyName}>{s.companyName}</div>
          <div className={styles.companyAddress}>{s.companyAddress}</div>
        </div>
      </div>

      <div className={styles.periodBand}>Pay Slip&nbsp; :&nbsp; {period}</div>

      <table className={styles.infoGrid}>
        <tbody>
          <tr>
            <th>Employee Name</th><td className={styles.strong}>{s.employeeName}</td>
            <th>Employee ID</th><td className={styles.strong}>{s.employeeId}</td>
          </tr>
          <tr>
            <th>Designation</th><td>{s.designation}</td>
            <th>Department</th><td>{s.department}</td>
          </tr>
          <tr>
            <th>Date of joining</th><td>{payslipDate(s.dateOfJoining)}</td>
            <th>Gender</th><td>{s.gender}</td>
          </tr>
          <tr>
            <th>PAN</th><td>{s.panMasked}</td>
            <th>UAN</th><td>{s.uan}</td>
          </tr>
          <tr>
            <th>Payable days</th><td>{s.payableDays}</td>
            <th>Bank IFSC</th><td>{s.bankIfsc}</td>
          </tr>
          <tr>
            <th>LOP Days</th><td>{s.lopDays ?? 0}</td>
            <th>Account Number</th><td>{s.accountNumberMasked}</td>
          </tr>
        </tbody>
      </table>

      <table className={styles.components}>
        <thead>
          <tr className={styles.sectionBand}>
            <th colSpan={2}>EARNINGS</th>
            <th colSpan={2}>DEDUCTIONS</th>
          </tr>
          <tr className={styles.columnHeads}>
            <th>Component</th><th className={styles.right}>Amount</th>
            <th>Component</th><th className={styles.right}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td>{earnings[i]?.componentName ?? ""}</td>
              <td className={styles.right}>
                {earnings[i] ? payslipAmount(earnings[i].amount) : ""}
              </td>
              <td>{deductions[i]?.componentName ?? ""}</td>
              <td className={styles.right}>
                {deductions[i] ? payslipAmount(deductions[i].amount) : ""}
              </td>
            </tr>
          ))}
          <tr className={styles.totals}>
            <td>Gross earnings</td>
            <td className={styles.right}>{payslipAmount(s.grossEarnings)}</td>
            <td>Gross deductions</td>
            <td className={styles.right}>{payslipAmount(s.grossDeductions)}</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.netBand}>
        <span className={styles.netLabel}>NET PAY</span>
        <span className={styles.netSymbol}>₹</span>
        <span className={styles.netAmount}>{payslipNetAmount(s.netPay)}</span>
        <span className={styles.netWords}>{payslipAmountInWords(s.netPay)}</span>
      </div>

      {s.showLeaveBalance !== false && (
        <table className={styles.leave}>
          <tbody>
            <tr>
              <th>Leave Balance (Days)</th>
              <td>Casual Leave&nbsp;&nbsp;&nbsp;{s.casualLeaveBalance ?? 0}</td>
            </tr>
          </tbody>
        </table>
      )}

      <div className={styles.footer}>{s.footerNote}</div>
    </div>
  );
};

export default PayslipRenderer;
