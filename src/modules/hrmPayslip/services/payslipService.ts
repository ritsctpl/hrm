import api from "@/services/api";
import type {
  PayslipSnapshot,
  PayslipListItem,
  PayslipTemplate,
  PayslipRenderData,
  PayslipGenerationResult,
} from "../types/domain.types";
import type {
  GeneratePayslipsRequest,
  RegeneratePayslipRequest,
  DownloadPayslipRequest,
  DownloadPayslipByHrRequest,
  DownloadAllZipRequest,
  PayslipSearchRequest,
  PayslipTemplateRequest,
  UpdatePayslipTemplateRequest,
  SetActiveTemplateRequest,
  EmailPayslipsRequest,
  SavePasswordConfigRequest,
  PasswordConfig,
  RevokePayslipRequest,
  UploadTemplateLogoRequest,
} from "../types/api.types";

const BASE = "/hrm-service/payslip";

export class HrmPayslipService {
  static async getActiveTemplate(organizationId: string): Promise<PayslipTemplate> {
    const res = await api.post<PayslipTemplate>(`${BASE}/getActivePayslipTemplate`, { organizationId });
    return res.data;
  }

  static async getAllTemplates(organizationId: string): Promise<PayslipTemplate[]> {
    const res = await api.post<PayslipTemplate[]>(`${BASE}/getAllPayslipTemplates`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async createTemplate(payload: PayslipTemplateRequest): Promise<PayslipTemplate> {
    const res = await api.post<PayslipTemplate>(`${BASE}/createPayslipTemplate`, payload);
    return res.data;
  }

  static async updateTemplate(payload: UpdatePayslipTemplateRequest): Promise<PayslipTemplate> {
    const res = await api.post<PayslipTemplate>(`${BASE}/updatePayslipTemplate`, payload);
    return res.data;
  }

  static async setActiveTemplate(payload: SetActiveTemplateRequest): Promise<void> {
    await api.post(`${BASE}/activatePayslipTemplate`, payload);
  }

  static async generatePayslips(
    payload: GeneratePayslipsRequest
  ): Promise<PayslipGenerationResult> {
    const res = await api.post<PayslipGenerationResult>(`${BASE}/generatePayslips`, payload);
    return res.data;
  }

  static async regeneratePayslip(
    payload: RegeneratePayslipRequest
  ): Promise<PayslipGenerationResult> {
    const res = await api.post<PayslipGenerationResult>(`${BASE}/regeneratePayslip`, payload);
    return res.data;
  }

  static async searchPayslips(payload: PayslipSearchRequest): Promise<PayslipListItem[]> {
    const res = await api.post<PayslipListItem[]>(`${BASE}/searchPayslips`, payload);
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getMyPayslips(organizationId: string, employeeId: string): Promise<PayslipListItem[]> {
    const res = await api.post<PayslipListItem[]>(`${BASE}/getMyPayslips`, { organizationId, employeeId });
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Returns the frozen payslip DATA, not a file. be-spec §15.2: the server stores no PDF, so the
   * browser renders it from this snapshot.
   */
  static async downloadMyPayslip(payload: DownloadPayslipRequest): Promise<PayslipSnapshot> {
    const res = await api.post(`${BASE}/downloadMyPayslip`, payload);
    return (res.data?.response ?? res.data) as PayslipSnapshot;
  }

  static async downloadPayslipByHr(payload: DownloadPayslipByHrRequest): Promise<PayslipSnapshot> {
    const res = await api.post(`${BASE}/downloadPayslipByHr`, payload);
    return (res.data?.response ?? res.data) as PayslipSnapshot;
  }

  /**
   * Returns every snapshot in the run. The browser renders each PDF and zips them — there is no
   * archive on the server to fetch. be-spec §15.2.
   */
  static async fetchRunSnapshots(payload: DownloadAllZipRequest): Promise<PayslipSnapshot[]> {
    const res = await api.post(`${BASE}/bulkDownload`, payload);
    const body = res.data?.response ?? res.data;
    return Array.isArray(body) ? (body as PayslipSnapshot[]) : [];
  }

  static async emailPayslips(payload: EmailPayslipsRequest): Promise<void> {
    await api.post(`${BASE}/emailPayslips`, payload);
  }

  static async uploadTemplateLogo(payload: UploadTemplateLogoRequest): Promise<PayslipTemplate> {
    const params = new URLSearchParams();
    params.append("templateId", payload.templateId);
    params.append("organizationId", payload.organizationId);
    params.append("logoUrl", payload.logoUrl);
    if (payload.updatedBy) params.append("updatedBy", payload.updatedBy);
    const res = await api.post<PayslipTemplate>(
      `${BASE}/uploadTemplateLogo`,
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return res.data;
  }

  static async savePasswordConfig(payload: SavePasswordConfigRequest): Promise<void> {
    await api.post(`${BASE}/passwordConfig`, payload);
  }

  static async getPasswordConfig(organizationId: string): Promise<PasswordConfig> {
    const res = await api.post<PasswordConfig>(`${BASE}/getPasswordConfig`, { organizationId });
    return res.data;
  }

  static async revokePayslip(
    organizationId: string,
    payslipId: string,
    revokedBy: string,
    reason: string
  ): Promise<void> {
    await api.post(`${BASE}/revokePayslip`, { organizationId, payslipId, revokedBy, reason });
  }
}

export default HrmPayslipService;
