import api from "@/services/api";
import type {
  TravelListRequest,
  TravelApproverInboxRequest,
  GetTravelByHandleRequest,
  TravelRequestCreatePayload,
  TravelRequestUpdatePayload,
  TravelSubmitRequest,
  TravelApprovalPayload,
  TravelRejectPayload,
  TravelCancelRequest,
  TravelRecallRequest,
  CoTravellerSearchRequest,
  TravelPolicyUpdatePayload,
  SiteRequest,
  TravelAdvanceRequestPayload,
  TravelAdvanceApproveRequest,
  TravelAdvanceSettleRequest,
  TravelAdvanceRetrieveRequest,
  TravelAdvance,
  TravelCatalogSaveRequest,
  TravelCatalogGetRequest,
  TravelCatalogModesRequest,
  TravelReportByTypeDateRequest,
  TravelReportPendingAgingRequest,
} from "../types/api.types";
import type { TravelRequest, TravelPolicy, TravelModeCatalog, CoTravellerDto, TravelAction } from "../types/domain.types";

// ── Response Mapping ────────────────────────────────────────────────
// Backend returns field names that differ from frontend domain types.
// This mapper normalises backend responses to the frontend's expected shape.

function mapAction(raw: any): TravelAction {
  return {
    actionId: raw.actionId ?? "",
    actorId: raw.actorId ?? raw.actorEmpId ?? "",
    actorName: raw.actorName ?? "",
    actorRole: raw.actorRole ?? "",
    action: raw.action ?? "",
    fromStatus: raw.fromStatus ?? "",
    toStatus: raw.toStatus ?? "",
    remarks: raw.remarks,
    escalationLevel: raw.escalationLevel ?? 0,
    actionDateTime: raw.actionDateTime ?? raw.actionAt ?? "",
  };
}

function mapTravelRequest(raw: any): TravelRequest {
  if (!raw) return raw;
  return {
    handle: raw.handle,
    requestId: raw.requestId ?? "",
    site: raw.site ?? "",
    employeeId: raw.employeeId ?? raw.requesterEmpId ?? "",
    employeeName: raw.employeeName ?? raw.requesterName ?? "",
    travelType: raw.travelType,
    purpose: raw.purpose,
    destinationCity: raw.destinationCity,
    destinationState: raw.destinationState,
    destinationCountry: raw.destinationCountry,
    travelMode: raw.travelMode,
    travelDate: raw.travelDate,
    startHour: raw.startHour,
    endHour: raw.endHour,
    startDate: raw.startDate,
    endDate: raw.endDate,
    remarks: raw.remarks,
    onDutyApplied: raw.onDutyApplied ?? false,
    status: raw.status,
    currentApproverId: raw.currentApproverId,
    currentApproverName: raw.currentApproverName,
    escalationLevel: raw.escalationLevel ?? 0,
    slaDeadline: raw.slaDeadline,
    slaBreached: raw.slaBreached ?? false,
    rejectionReason: raw.rejectionReason,
    cancellationReason: raw.cancellationReason,
    coTravellers: Array.isArray(raw.coTravellers) ? raw.coTravellers : [],
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    actionHistory: Array.isArray(raw.actionHistory)
      ? raw.actionHistory.map(mapAction)
      : Array.isArray(raw.approvalHistory)
        ? raw.approvalHistory.map(mapAction)
        : [],
    submittedAt: raw.submittedAt,
    createdDateTime: raw.createdDateTime ?? "",
    createdBy: raw.createdBy ?? "",
    active: raw.active ?? 1,
  };
}

function mapTravelRequestArray(raw: any): TravelRequest[] {
  return Array.isArray(raw) ? raw.map(mapTravelRequest) : [];
}

export class HrmTravelService {
  private static readonly BASE = "/hrm-service/travel";

  // ── My Requests ──────────────────────────────────────────────────────
  static async getMyRequests(payload: TravelListRequest): Promise<TravelRequest[]> {
    const { data } = await api.post(`${this.BASE}/my-requests`, payload);
    return mapTravelRequestArray(data);
  }

  static async getRequestByHandle(payload: GetTravelByHandleRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/get`, payload);
    return mapTravelRequest(data);
  }

  // ── Catalog ─────────────────────────────────────────────────────────
  static async saveCatalog(payload: TravelCatalogSaveRequest): Promise<any> {
    const { data } = await api.post(`${this.BASE}/catalog/save`, payload);
    return data;
  }

  static async getCatalogModes(payload: TravelCatalogModesRequest): Promise<TravelModeCatalog> {
    const { data } = await api.post(`${this.BASE}/catalog/modes`, payload);
    return data;
  }

  static async getCatalogItem(payload: TravelCatalogGetRequest): Promise<any> {
    const { data } = await api.post(`${this.BASE}/catalog/get`, payload);
    return data;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────
  static async createDraft(payload: TravelRequestCreatePayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/create`, payload);
    return mapTravelRequest(data);
  }

  static async updateDraft(payload: TravelRequestUpdatePayload): Promise<TravelRequest> {
    // Backend expects: { handle, data: { ...fields } }
    const { handle, ...rest } = payload;
    const { data } = await api.post(`${this.BASE}/update`, { handle, data: rest });
    return mapTravelRequest(data);
  }

  static async submitRequest(payload: TravelSubmitRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/submit`, payload);
    return mapTravelRequest(data);
  }

  static async deleteRequest(payload: { site: string; requestId: string; deletedBy: string }): Promise<void> {
    await api.post(`${this.BASE}/delete`, payload);
  }

  // ── Approval ─────────────────────────────────────────────────────────
  static async getApproverInbox(payload: TravelApproverInboxRequest): Promise<TravelRequest[]> {
    const { data } = await api.post(`${this.BASE}/approver-inbox`, payload);
    return mapTravelRequestArray(data);
  }

  static async approveRequest(payload: TravelApprovalPayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/approve`, payload);
    return mapTravelRequest(data);
  }

  static async rejectRequest(payload: TravelRejectPayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/reject`, payload);
    return mapTravelRequest(data);
  }

  // ── Cancel / Recall ──────────────────────────────────────────────────
  static async cancelRequest(payload: TravelCancelRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/cancel`, payload);
    return mapTravelRequest(data);
  }

  static async recallRequest(payload: TravelRecallRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/recall`, payload);
    return mapTravelRequest(data);
  }

  // ── Co-Travellers ────────────────────────────────────────────────────
  static async searchCoTravellers(payload: CoTravellerSearchRequest): Promise<CoTravellerDto[]> {
    const { data } = await api.post(`${this.BASE}/eligible-cotravellers`, payload);
    return Array.isArray(data) ? data : [];
  }

  // ── List (admin/all) ─────────────────────────────────────────────────
  static async listAll(payload: TravelListRequest): Promise<TravelRequest[]> {
    const { data } = await api.post(`${this.BASE}/list`, payload);
    return mapTravelRequestArray(data);
  }

  // ── Attachments ──────────────────────────────────────────────────────
  static async uploadAttachment(handle: string, file: File, site: string): Promise<{ attachmentId: string; fileName: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("handle", handle);
    form.append("site", site);
    const { data } = await api.post(`${this.BASE}/attachments/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  static async deleteAttachment(payload: { site: string; handle: string; attachmentId: string }): Promise<void> {
    await api.post(`${this.BASE}/attachments/delete`, payload);
  }

  // ── Policy ───────────────────────────────────────────────────────────
  static async getPolicies(payload: SiteRequest): Promise<TravelPolicy[]> {
    const { data } = await api.post(`${this.BASE}/policy/retrieve`, payload);
    return Array.isArray(data) ? data : [];
  }

  static async updatePolicy(payload: TravelPolicyUpdatePayload): Promise<TravelPolicy> {
    const { data } = await api.post(`${this.BASE}/policy/update`, payload);
    return data;
  }

  // ── Export ───────────────────────────────────────────────────────────
  static async exportRequests(payload: TravelListRequest): Promise<Blob> {
    const response = await api.post(`${this.BASE}/export`, payload, {
      responseType: "blob",
    });
    return response.data;
  }

  // ── Reports ────────────────────────────────────────────────────────
  static async reportByTypeDate(payload: TravelReportByTypeDateRequest): Promise<any> {
    const { data } = await api.post(`${this.BASE}/report/by-type-date`, payload);
    return data;
  }

  static async reportPendingAging(payload: TravelReportPendingAgingRequest): Promise<any> {
    const { data } = await api.post(`${this.BASE}/report/pending-aging`, payload);
    return data;
  }

  // ── Travel Advance ────────────────────────────────────────────────

  static async requestAdvance(payload: TravelAdvanceRequestPayload): Promise<TravelAdvance> {
    const { data } = await api.post(`${this.BASE}/advance/request`, payload);
    return data;
  }

  static async approveAdvance(payload: TravelAdvanceApproveRequest): Promise<TravelAdvance> {
    const { data } = await api.post(`${this.BASE}/advance/approve`, payload);
    return data;
  }

  static async settleAdvance(payload: TravelAdvanceSettleRequest): Promise<TravelAdvance> {
    const { data } = await api.post(`${this.BASE}/advance/settle`, payload);
    return data;
  }

  static async retrieveAdvance(payload: TravelAdvanceRetrieveRequest): Promise<TravelAdvance | null> {
    const { data } = await api.post(`${this.BASE}/advance/retrieve`, payload);
    return data ?? null;
  }
}
