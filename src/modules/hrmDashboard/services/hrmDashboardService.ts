import api from "@/services/api";
import {
  GetEmployeeDashboardPayload,
  GetManagerDashboardPayload,
  GetHrDashboardPayload,
  GetAdminDashboardPayload,
  GetWidgetDataPayload,
  GetLayoutPayload,
  SaveLayoutPayload,
  ResetLayoutPayload,
  GetAlertsPayload,
  DismissAlertPayload,
  GenerateAlertsPayload,
  ListWidgetsPayload,
  WidgetDefinitionRequest,
  DeleteWidgetPayload,
  RefreshSnapshotPayload,
  GetSnapshotPayload,
  ScheduleSnapshotPayload,
} from "../types/api.types";
import type {
  DashboardResponse,
  DashboardWidget,
  DashboardAlert,
  DashboardLayoutResponse,
  WidgetDefinition,
  DashboardSnapshot,
  SnapshotScheduleResponse,
} from "../types/domain.types";

const BASE = "/hrm-service/dashboard";

export class HrmDashboardService {
  // --- Role-Specific Dashboards ---

  static async getEmployeeDashboard(payload: GetEmployeeDashboardPayload): Promise<DashboardResponse> {
    const res = await api.post(`${BASE}/getEmployeeDashboard`, payload);
    return res.data;
  }

  static async getManagerDashboard(payload: GetManagerDashboardPayload): Promise<DashboardResponse> {
    const res = await api.post(`${BASE}/getManagerDashboard`, payload);
    return res.data;
  }

  static async getHrDashboard(payload: GetHrDashboardPayload): Promise<DashboardResponse> {
    const res = await api.post(`${BASE}/getHrDashboard`, payload);
    return res.data;
  }

  static async getAdminDashboard(payload: GetAdminDashboardPayload): Promise<DashboardResponse> {
    const res = await api.post(`${BASE}/getAdminDashboard`, payload);
    return res.data;
  }

  // --- Widget Data ---

  static async getWidgetData(payload: GetWidgetDataPayload): Promise<DashboardWidget> {
    const res = await api.post(`${BASE}/getWidgetData`, payload);
    return res.data;
  }

  // --- Layout Configuration ---

  static async getLayout(payload: GetLayoutPayload): Promise<DashboardLayoutResponse> {
    const res = await api.post(`${BASE}/getLayout`, payload);
    return res.data;
  }

  static async saveLayout(payload: SaveLayoutPayload): Promise<DashboardLayoutResponse> {
    const res = await api.post(`${BASE}/saveLayout`, payload);
    return res.data;
  }

  static async resetLayout(payload: ResetLayoutPayload): Promise<DashboardLayoutResponse> {
    const res = await api.post(`${BASE}/resetLayout`, payload);
    return res.data;
  }

  // --- Alerts ---

  static async getAlerts(payload: GetAlertsPayload): Promise<DashboardAlert[]> {
    const res = await api.post(`${BASE}/getAlerts`, payload);
    return res.data;
  }

  static async dismissAlert(payload: DismissAlertPayload): Promise<DashboardAlert> {
    const res = await api.post(`${BASE}/dismissAlert`, payload);
    return res.data;
  }

  static async generateAlerts(payload: GenerateAlertsPayload): Promise<void> {
    await api.post(`${BASE}/generateAlerts`, payload);
  }

  // --- Widget Catalog ---

  static async listWidgets(payload: ListWidgetsPayload): Promise<WidgetDefinition[]> {
    const res = await api.post(`${BASE}/listWidgets`, payload);
    return res.data;
  }

  static async createWidget(payload: WidgetDefinitionRequest): Promise<WidgetDefinition> {
    const res = await api.post(`${BASE}/createWidget`, payload);
    return res.data;
  }

  static async updateWidget(payload: WidgetDefinitionRequest): Promise<WidgetDefinition> {
    const res = await api.post(`${BASE}/updateWidget`, payload);
    return res.data;
  }

  static async deleteWidget(payload: DeleteWidgetPayload): Promise<void> {
    await api.post(`${BASE}/deleteWidget`, payload);
  }

  // --- Snapshot ---

  static async refreshSnapshot(payload: RefreshSnapshotPayload): Promise<void> {
    await api.post(`${BASE}/refreshSnapshot`, payload);
  }

  static async getSnapshot(payload: GetSnapshotPayload): Promise<DashboardSnapshot> {
    const res = await api.post(`${BASE}/getSnapshot`, payload);
    return res.data;
  }

  static async scheduleSnapshot(payload: ScheduleSnapshotPayload): Promise<SnapshotScheduleResponse> {
    const res = await api.post(`${BASE}/scheduleSnapshot`, payload);
    return res.data;
  }
}
