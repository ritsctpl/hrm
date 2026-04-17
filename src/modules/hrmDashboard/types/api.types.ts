export interface GetEmployeeDashboardPayload {
  organizationId: string;
  employeeId: string;
  month?: string;
  year?: string;
}

export interface GetManagerDashboardPayload {
  organizationId: string;
  managerId: string;
  cycleId?: string;
  month?: string;
}

export interface GetHrDashboardPayload {
  organizationId: string;
  requestedBy: string;
  department?: string;
  businessUnit?: string;
  month?: string;
  year?: string;
  forceRefresh?: boolean;
}

export interface GetAdminDashboardPayload {
  organizationId: string;
  requestedBy: string;
  department?: string;
  businessUnit?: string;
  month?: string;
  year?: string;
  forceRefresh?: boolean;
}

export interface GetWidgetDataPayload {
  organizationId: string;
  widgetCode: string;
  viewerId: string;
  viewerRole: string;
  month?: string;
  [key: string]: unknown;
}

export interface GetLayoutPayload {
  organizationId: string;
  ownerId: string;
  ownerType: string;
  roleType?: string;
}

export interface SaveLayoutPayload {
  organizationId: string;
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
  organizationId: string;
  ownerId: string;
  ownerType: string;
  roleType?: string;
}

export interface GetAlertsPayload {
  organizationId: string;
  userId: string;
  role: string;
}

export interface DismissAlertPayload {
  organizationId: string;
  alertHandle: string;
  dismissedBy: string;
}

export interface GenerateAlertsPayload {
  organizationId: string;
}

export interface ListWidgetsPayload {
  organizationId: string;
  role?: string;
  category?: string;
}

export interface WidgetDefinitionRequest {
  organizationId: string;
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
  organizationId: string;
  widgetId: string;
  deletedBy: string;
}

export interface RefreshSnapshotPayload {
  organizationId: string;
  snapshotType: string;
  scopeId?: string;
}

export interface GetSnapshotPayload {
  organizationId: string;
  snapshotType: string;
  scopeId?: string;
}

export interface ScheduleSnapshotPayload {
  organizationId: string;
  cronExpression: string;
  enabled: boolean;
  updatedBy: string;
}
