import type { PayslipSnapshot } from "../types/domain.types";
import {
  payslipAmount,
  payslipAmountInWords,
  payslipDate,
  payslipFileName,
  payslipNetAmount,
  payslipPeriod,
} from "./payslipFormat";

/**
 * Builds the payslip PDF in the browser. be-spec §12.
 *
 * pdfmake rather than html2canvas+jsPDF: that route rasterises the page, producing a ~1 MB image
 * with no selectable text and only obsolete RC4 encryption — unfit for a document banks and
 * consulates read. pdfmake draws real vector text and supports a genuine user password.
 *
 * The document is built from the SAME snapshot object the on-screen preview renders, so the file
 * and the preview cannot drift apart.
 */

const BLUE = "#1F5C9E";
const BAND_TEXT = "#FFFFFF";
const LABEL = "#5A6B7B";
const ROW_ALT = "#F2F6FA";

type Line = { componentName: string; amount: number | null };

/** Both columns must have the same number of rows for the twin tables to line up. */
function padded(lines: Line[] | null | undefined, rows: number): Line[] {
  const list = [...(lines ?? [])];
  while (list.length < rows) list.push({ componentName: "", amount: null });
  return list;
}

function infoRow(leftLabel: string, leftValue: string, rightLabel: string, rightValue: string,
                 bold = false) {
  const value = (v: string) => ({
    text: v || "",
    bold,
    fontSize: bold ? 11 : 9,
    color: bold ? BLUE : "#1A1A1A",
    margin: [0, 2, 0, 2] as [number, number, number, number],
  });
  return [
    { text: leftLabel, color: LABEL, fontSize: 9, margin: [4, 2, 0, 2] },
    value(leftValue),
    { text: rightLabel, color: LABEL, fontSize: 9, margin: [4, 2, 0, 2] },
    value(rightValue),
  ];
}

export function buildPayslipDocDefinition(s: PayslipSnapshot, userPassword?: string) {
  const period = payslipPeriod(s.payrollYear, s.payrollMonth, s.payPeriodLabel);
  const rows = Math.max((s.earnings ?? []).length, (s.deductions ?? []).length, 1);
  const earnings = padded(s.earnings, rows);
  const deductions = padded(s.deductions, rows);

  const componentRows = earnings.map((e, i) => [
    { text: e.componentName, fontSize: 9, margin: [4, 3, 0, 3] },
    { text: payslipAmount(e.amount), fontSize: 9, alignment: "right", margin: [0, 3, 4, 3] },
    { text: deductions[i].componentName, fontSize: 9, margin: [4, 3, 0, 3] },
    { text: payslipAmount(deductions[i].amount), fontSize: 9, alignment: "right", margin: [0, 3, 4, 3] },
  ]);

  const content: any[] = [
    {
      columns: [
        s.companyLogoPath
          ? { image: s.companyLogoPath, width: 90, margin: [0, 0, 12, 0] }
          : { text: "", width: 90 },
        {
          stack: [
            { text: s.companyName ?? "", bold: true, fontSize: 14 },
            { text: s.companyAddress ?? "", fontSize: 8, color: LABEL, margin: [0, 2, 0, 0] },
          ],
        },
      ],
      margin: [0, 0, 0, 10],
    },
    {
      table: {
        widths: ["*"],
        body: [[{
          text: `Pay Slip  :  ${period}`,
          alignment: "center", bold: true, fontSize: 12, color: BAND_TEXT,
          fillColor: BLUE, margin: [0, 5, 0, 5],
        }]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 8],
    },
    {
      table: {
        widths: ["22%", "28%", "22%", "28%"],
        body: [
          infoRow("Employee Name", s.employeeName ?? "", "Employee ID", s.employeeId ?? "", true),
          infoRow("Designation", s.designation ?? "", "Department", s.department ?? ""),
          infoRow("Date of joining", payslipDate(s.dateOfJoining), "Gender", s.gender ?? ""),
          infoRow("PAN", s.panMasked ?? "", "UAN", s.uan ?? ""),
          infoRow("Payable days", String(s.payableDays ?? ""), "Bank IFSC", s.bankIfsc ?? ""),
          infoRow("LOP Days", String(s.lopDays ?? 0), "Account Number", s.accountNumberMasked ?? ""),
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#E3E9EF",
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? ROW_ALT : null),
      },
      margin: [0, 0, 0, 10],
    },
    {
      table: {
        widths: ["25%", "25%", "25%", "25%"],
        body: [
          [
            { text: "EARNINGS", colSpan: 2, bold: true, fontSize: 9, color: BAND_TEXT, fillColor: BLUE, margin: [4, 3, 0, 3] },
            {},
            { text: "DEDUCTIONS", colSpan: 2, bold: true, fontSize: 9, color: BAND_TEXT, fillColor: BLUE, margin: [4, 3, 0, 3] },
            {},
          ],
          [
            { text: "Component", fontSize: 8, color: LABEL, margin: [4, 3, 0, 3] },
            { text: "Amount", fontSize: 8, color: LABEL, alignment: "right", margin: [0, 3, 4, 3] },
            { text: "Component", fontSize: 8, color: LABEL, margin: [4, 3, 0, 3] },
            { text: "Amount", fontSize: 8, color: LABEL, alignment: "right", margin: [0, 3, 4, 3] },
          ],
          ...componentRows,
          [
            { text: "Gross earnings", bold: true, fontSize: 9, margin: [4, 3, 0, 3] },
            { text: payslipAmount(s.grossEarnings), bold: true, fontSize: 9, alignment: "right", margin: [0, 3, 4, 3] },
            { text: "Gross deductions", bold: true, fontSize: 9, margin: [4, 3, 0, 3] },
            { text: payslipAmount(s.grossDeductions), bold: true, fontSize: 9, alignment: "right", margin: [0, 3, 4, 3] },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#E3E9EF",
      },
      margin: [0, 0, 0, 10],
    },
    {
      table: {
        widths: ["22%", "8%", "25%", "45%"],
        body: [[
          { text: "NET PAY", bold: true, fontSize: 12, color: BAND_TEXT, fillColor: BLUE, margin: [4, 6, 0, 6] },
          { text: "₹", bold: true, fontSize: 12, color: BAND_TEXT, fillColor: BLUE, alignment: "right", margin: [0, 6, 0, 6] },
          { text: payslipNetAmount(s.netPay), bold: true, fontSize: 14, color: BAND_TEXT, fillColor: BLUE, alignment: "right", margin: [0, 5, 6, 5] },
          { text: payslipAmountInWords(s.netPay), italics: true, fontSize: 9, color: BAND_TEXT, fillColor: BLUE, margin: [6, 7, 4, 6] },
        ]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 8],
    },
  ];

  if (s.showLeaveBalance !== false) {
    content.push({
      table: {
        widths: ["30%", "70%"],
        body: [[
          { text: "Leave Balance (Days)", bold: true, fontSize: 9, margin: [4, 3, 0, 3] },
          {
            text: `Casual Leave   ${s.casualLeaveBalance ?? 0}`,
            fontSize: 9, margin: [4, 3, 0, 3],
          },
        ]],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => "#E3E9EF" },
      margin: [0, 0, 0, 8],
    });
  }

  content.push({
    text: s.footerNote ?? "",
    fontSize: 7.5, italics: true, color: LABEL, fillColor: ROW_ALT, margin: [4, 6, 4, 6],
  });

  const doc: any = {
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    content,
  };

  // A client-side password protects the file once it LEAVES the browser — in a Downloads folder, in
  // a forwarded mail. It is not access control: the employee already has the plaintext on screen.
  if (userPassword) {
    doc.userPassword = userPassword;
    doc.permissions = { printing: "highResolution", copying: false, modifying: false };
    // Without this pdfmake encrypts with RC4 40-bit — the obsolete cipher this design rejected
    // jsPDF for. PDF 1.7ext3 is what selects AES-256 (pdfmake Printer.js:58 maps `version` to
    // PDFKit's pdfVersion). Verified on the downloaded file: /AESV3 present, V=5 R=6.
    doc.version = "1.7ext3";
  }
  return doc;
}

/**
 * Derives the password the employee types to open the file.
 *
 * Pattern and inputs both come from the snapshot (be-spec §12): PAN's first four characters plus
 * date of birth `ddmm`, or employee id plus `ddmmyyyy` for anyone with no PAN on record. Returns
 * undefined when the site has password protection switched off, so the file downloads unencrypted
 * rather than with a password nobody was told about.
 */
export function buildPayslipPassword(snapshot: PayslipSnapshot): string | undefined {
  if (!snapshot.passwordEnabled) return undefined;
  if (snapshot.passwordPattern === "PAN_DOB"
      && snapshot.passwordPanPrefix && snapshot.passwordDobDdmm) {
    return `${snapshot.passwordPanPrefix.toUpperCase()}${snapshot.passwordDobDdmm}`;
  }
  if (snapshot.employeeId && snapshot.passwordDobDdmmyyyy) {
    return `${snapshot.employeeId}${snapshot.passwordDobDdmmyyyy}`;
  }
  return undefined;
}

/** The sentence shown beside the download button, matching whichever pattern applies. */
export function payslipPasswordHint(snapshot: PayslipSnapshot | null): string | null {
  if (!snapshot?.passwordEnabled) return null;
  return snapshot.passwordPattern === "PAN_DOB"
    ? "Opens with your PAN's first 4 letters followed by your date of birth (ddmm)."
    : "Opens with your employee ID followed by your date of birth (ddmmyyyy).";
}

/** Renders and saves the PDF. Imported lazily: pdfmake is browser-only and heavy. */
export async function downloadPayslipPdf(
  snapshot: PayslipSnapshot,
  password?: string,
): Promise<void> {
  const pdfMake = await loadPdfMake();
  const fileName = payslipFileName(snapshot.employeeId, snapshot.payrollYear, snapshot.payrollMonth);
  pdfMake.createPdf(buildPayslipDocDefinition(snapshot, password)).download(fileName);
}

/** Returns the PDF as a Blob, for the HR bulk download that zips many payslips. */
export async function payslipPdfBlob(
  snapshot: PayslipSnapshot,
  password?: string,
): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  return new Promise((resolve) => {
    pdfMake.createPdf(buildPayslipDocDefinition(snapshot, password)).getBlob(resolve);
  });
}

let pdfMakeCache: any = null;

async function loadPdfMake(): Promise<any> {
  if (pdfMakeCache) return pdfMakeCache;
  const pdfMakeModule: any = await import("pdfmake/build/pdfmake");
  const vfsModule: any = await import("pdfmake/build/vfs_fonts");
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
  // pdfmake has shipped the font table under three different shapes across versions; pick whichever
  // this build actually provides rather than assuming one.
  const vfs = vfsModule.pdfMake?.vfs ?? vfsModule.default?.pdfMake?.vfs ?? vfsModule.vfs
    ?? vfsModule.default;
  if (vfs) pdfMake.vfs = vfs;
  pdfMakeCache = pdfMake;
  return pdfMake;
}
