// ui.types.ts — Component prop types and UI state shapes

import { PayslipRenderData, PayslipTemplate, PayslipListItem } from "./domain.types";

export type PayslipTabKey = "generate" | "myPayslips" | "repository" | "templates";

export type UserRole = "ADMIN" | "HR" | "FINANCE" | "EMPLOYEE";

export interface PayslipRendererProps {
  data: PayslipRenderData;
  printMode?: boolean;
}

export interface MonthNavigatorProps {
  year: number;
  selectedMonth: number;
  availableMonths: number[];
  onYearChange: (year: number) => void;
  onMonthSelect: (month: number) => void;
}

export interface PayslipTemplateFormProps {
  template: PayslipTemplate | null;
  onSave: (template: PayslipTemplate) => Promise<void>;
  onCancel: () => void;
  onPreview: (template: PayslipTemplate) => void;
}

export interface EmployeeSelectorProps {
  employees: Array<{ employeeId: string; employeeName: string; department: string }>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export interface GenerationResultsCardProps {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  failedEmployeeIds: string[];
}

export interface PayslipRepositoryRowProps {
  item: PayslipListItem;
  onView: (item: PayslipListItem) => void;
  onDownload: (item: PayslipListItem) => void;
  onRegenerate: (item: PayslipListItem) => void;
}
