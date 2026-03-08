export interface GetEmployeeDashboardPayload {
  site: string;
  employeeId: string;
  month?: string;
  year?: string;
}

export interface GetManagerDashboardPayload {
  site: string;
  managerId: string;
  cycleId?: string;
  month?: string;
}

export interface GetHrDashboardPayload {
  site: string;
  requestedBy: string;
  department?: string;
  businessUnit?: string;
  month?: string;
  year?: string;
  forceRefresh?: boolean;
}

export interface GetAdminDashboardPayload {
  site: string;
  requestedBy: string;
  department?: string;
  businessUnit?: string;
  month?: string;
  year?: string;
  forceRefresh?: boolean;
}

export interface GetWidgetDataPayload {
  site: string;
  widgetCode: string;
  viewerId: string;
  viewerRole: string;
  month?: string;
  [key: string]: unknown;
}

export interface GetLayoutPayload {
  site: string;
  ownerId: string;
  ownerType: string;
  roleType?: string;
}

export interface SaveLayoutPayload {
  site: string;
  ownerId: string;
  ownerType: string;
  roleType?: string;
  dashboardName?: string;
  theme?: string;
  panels?: PanelRequest[];
  allowCustomization?: boolean;
  updatedBy?: string;
}

export interface PanelRequest {
  panelId?: string;
  panelTitle: string;
  column?: number;
  row?: number;
  columnSpan?: number;
  rowSpan?: number;
  widgets?: WidgetPlacementRequest[];
  collapsed?: boolean;
}

export interface WidgetPlacementRequest {
  widgetDefinitionHandle: string;
  displayOrder?: number;
  visible?: boolean;
  customSettings?: Record<string, unknown>;
}

export interface ResetLayoutPayload {
  site: string;
  ownerId: string;
  ownerType: string;
  roleType?: string;
}

export interface GetAlertsPayload {
  site: string;
  userId: string;
  role: string;
}

export interface DismissAlertPayload {
  site: string;
  alertHandle: string;
  dismissedBy: string;
}

export interface GenerateAlertsPayload {
  site: string;
}

export interface ListWidgetsPayload {
  site: string;
  role?: string;
  category?: string;
}

export interface WidgetDefinitionRequest {
  site: string;
  widgetHandle?: string;
  widgetCode: string;
  widgetName: string;
  description?: string;
  category: string;
  widgetType: string;
  dataSourceMethod?: string;
  defaultSettings?: Record<string, unknown>;
  iconName?: string;
  colorScheme?: string;
  minColumnSpan?: number;
  minRowSpan?: number;
  resizable?: boolean;
  applicableRoles?: string[];
  systemWidget?: boolean;
  createdBy?: string;
}

export interface DeleteWidgetPayload {
  site: string;
  widgetId: string;
  deletedBy: string;
}

export interface RefreshSnapshotPayload {
  site: string;
  snapshotType: string;
  scopeId?: string;
}

export interface GetSnapshotPayload {
  site: string;
  snapshotType: string;
  scopeId?: string;
}

export interface ScheduleSnapshotPayload {
  site: string;
  cronExpression: string;
  enabled: boolean;
  updatedBy: string;
}
