export interface GetEmployeeDashboardPayload {
  site: string;
  employeeId: string;
}

export interface GetManagerDashboardPayload {
  site: string;
  managerId: string;
}

export interface GetHrDashboardPayload {
  site: string;
  fiscalYear?: string;
}

export interface GetAdminDashboardPayload {
  site: string;
}

export interface SaveLayoutPayload {
  site: string;
  employeeId: string;
  role: string;
  layout: unknown[];
  widgets: string[];
}
