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
} from "../types/api.types";
import type { TravelRequest, TravelPolicy, CoTravellerDto } from "../types/domain.types";

export class HrmTravelService {
  private static readonly BASE = "/hrm-service/travel";

  // ── My Requests ──────────────────────────────────────────────────────
  static async getMyRequests(payload: TravelListRequest): Promise<TravelRequest[]> {
    const { data } = await api.post(`${this.BASE}/my-requests`, payload);
    return data;
  }

  static async getRequestByHandle(payload: GetTravelByHandleRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/get`, payload);
    return data;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────
  static async createDraft(payload: TravelRequestCreatePayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/create`, payload);
    return data;
  }

  static async updateDraft(payload: TravelRequestUpdatePayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/update`, payload);
    return data;
  }

  static async submitRequest(payload: TravelSubmitRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/submit`, payload);
    return data;
  }

  static async deleteRequest(payload: { site: string; handle: string }): Promise<void> {
    await api.post(`${this.BASE}/delete`, payload);
  }

  // ── Approval ─────────────────────────────────────────────────────────
  static async getApproverInbox(payload: TravelApproverInboxRequest): Promise<TravelRequest[]> {
    const { data } = await api.post(`${this.BASE}/approver-inbox`, payload);
    return data;
  }

  static async approveRequest(payload: TravelApprovalPayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/approve`, payload);
    return data;
  }

  static async rejectRequest(payload: TravelRejectPayload): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/reject`, payload);
    return data;
  }

  // ── Cancel / Recall ──────────────────────────────────────────────────
  static async cancelRequest(payload: TravelCancelRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/cancel`, payload);
    return data;
  }

  static async recallRequest(payload: TravelRecallRequest): Promise<TravelRequest> {
    const { data } = await api.post(`${this.BASE}/recall`, payload);
    return data;
  }

  // ── Co-Travellers ────────────────────────────────────────────────────
  static async searchCoTravellers(payload: CoTravellerSearchRequest): Promise<CoTravellerDto[]> {
    const { data } = await api.post(`${this.BASE}/eligible-cotravellers`, payload);
    return data;
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
    return data;
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
