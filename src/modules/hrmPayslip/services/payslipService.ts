import api from "@/services/api";
import type {
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
  static async getActiveTemplate(site: string): Promise<PayslipTemplate> {
    const res = await api.post<PayslipTemplate>(`${BASE}/getActivePayslipTemplate`, { site });
    return res.data;
  }

  static async getAllTemplates(site: string): Promise<PayslipTemplate[]> {
    const res = await api.post<PayslipTemplate[]>(`${BASE}/getAllPayslipTemplates`, { site });
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

  static async getMyPayslips(site: string, employeeId: string): Promise<PayslipListItem[]> {
    const res = await api.post<PayslipListItem[]>(`${BASE}/getMyPayslips`, { site, employeeId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async downloadMyPayslip(payload: DownloadPayslipRequest): Promise<Blob> {
    const res = await api.post(`${BASE}/downloadMyPayslip`, payload, { responseType: "blob" });
    return res.data as Blob;
  }

  static async downloadPayslipByHr(payload: DownloadPayslipByHrRequest): Promise<Blob> {
    const res = await api.post(`${BASE}/downloadPayslipByHr`, payload, { responseType: "blob" });
    return res.data as Blob;
  }

  static async downloadAllPayslipsZip(payload: DownloadAllZipRequest): Promise<Blob> {
    const res = await api.post(`${BASE}/bulkDownload`, payload, { responseType: "blob" });
    return res.data as Blob;
  }

  static async emailPayslips(payload: EmailPayslipsRequest): Promise<void> {
    await api.post(`${BASE}/emailPayslips`, payload);
  }

  static async uploadTemplateLogo(payload: UploadTemplateLogoRequest): Promise<PayslipTemplate> {
    const params = new URLSearchParams();
    params.append("templateId", payload.templateId);
    params.append("site", payload.site);
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

  static async getPasswordConfig(site: string): Promise<PasswordConfig> {
    const res = await api.post<PasswordConfig>(`${BASE}/getPasswordConfig`, { site });
    return res.data;
  }

  static async revokePayslip(
    site: string,
    payslipId: string,
    revokedBy: string,
    reason: string
  ): Promise<void> {
    await api.post(`${BASE}/revokePayslip`, { site, payslipId, revokedBy, reason });
  }
}

export default HrmPayslipService;
