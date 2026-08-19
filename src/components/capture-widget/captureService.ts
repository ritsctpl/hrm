// Capture widget — API layer. Minimal extract of the Manufacturing app's
// ticket_app/services/ticketService.ts (UF-12): only `captureIngest` plus the
// `ctx()` cookie spread and the `/devworkflow-service` base it needs.
//
// Uses HRM's shared axios client (@services/api). That client's response
// interceptor unwraps ONLY `/hrm-service/` URLs, so `/devworkflow-service/*`
// responses pass through raw — which is exactly what captureIngest reads.
import api from '@services/api';
import { parseCookies } from 'nookies';

const BASE = '/devworkflow-service';
const CT = `${BASE}/customer-tickets`;

/** `capture/ingest` opens a TRIAGE session, so give it room to breathe. */
const LONG = { timeout: 300000 };

const ctx = () => {
  const cookies = parseCookies();
  return { site: cookies.site, userId: cookies.rl_user_id };
};

/**
 * `capture/ingest` — JSON, NOT multipart: the bundle travels as a JSON STRING in
 * a JSON body, which is what the controller parses.
 */
export const captureIngest = async (payload: {
  description?: string;
  appId?: string;
  screenModule?: string;
  bundle: any;
  reporterEmail?: string;
  type?: 'PROBLEM' | 'CHANGE_REQUEST';
}) =>
  (await api.post(`${CT}/capture/ingest`, {
    ...ctx(),
    description: payload.description,
    appId: payload.appId,
    screenModule: payload.screenModule,
    reporterEmail: payload.reporterEmail,
    type: payload.type,
    bundle: typeof payload.bundle === 'string' ? payload.bundle : JSON.stringify(payload.bundle),
  }, LONG)).data;
