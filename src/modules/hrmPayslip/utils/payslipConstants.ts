export const MONTHS = [
  { value: 1, label: "Jan", fullLabel: "January" },
  { value: 2, label: "Feb", fullLabel: "February" },
  { value: 3, label: "Mar", fullLabel: "March" },
  { value: 4, label: "Apr", fullLabel: "April" },
  { value: 5, label: "May", fullLabel: "May" },
  { value: 6, label: "Jun", fullLabel: "June" },
  { value: 7, label: "Jul", fullLabel: "July" },
  { value: 8, label: "Aug", fullLabel: "August" },
  { value: 9, label: "Sep", fullLabel: "September" },
  { value: 10, label: "Oct", fullLabel: "October" },
  { value: 11, label: "Nov", fullLabel: "November" },
  { value: 12, label: "Dec", fullLabel: "December" },
] as const;

export const PAYSLIP_STATUS_COLORS: Record<string, string> = {
  GENERATED: "green",
  FAILED: "red",
  REGENERATED: "blue",
};

export const TEMPLATE_SECTIONS = [
  { key: "showAttendanceSection", label: "Show Attendance Section" },
  { key: "showEarningsSection", label: "Show Earnings Section" },
  { key: "showDeductionsSection", label: "Show Deductions Section" },
  { key: "showTaxSection", label: "Show Tax Section" },
  { key: "showNetPayInWords", label: "Show Net Pay in Words" },
  { key: "showFooterSignature", label: "Show Footer Signature" },
] as const;

export const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
})();
