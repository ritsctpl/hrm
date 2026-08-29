import api from '@/services/api';

const BASE = '/hrm-service/security';

export interface StepUpStatus {
  active: boolean;
  method?: string;
  ttlMinutes?: number;
  expiresAt?: string;
  secondsRemaining?: number;
}

/**
 * Step-up authentication for salary figures.
 *
 * The password is posted once and never held: it is not stored, cached, or put in a store, because the
 * only thing worth keeping is the grant the server issues in exchange for it.
 */
export class SalarySecurityService {
  static async status(organizationId: string): Promise<StepUpStatus> {
    const res = await api.post<StepUpStatus>(`${BASE}/stepUpStatus`, { organizationId });
    return res.data ?? { active: false };
  }

  static async stepUp(organizationId: string, password: string): Promise<StepUpStatus> {
    const res = await api.post<StepUpStatus>(`${BASE}/stepUp`, { organizationId, password });
    return res.data ?? { active: false };
  }

  static async lockNow(organizationId: string): Promise<StepUpStatus> {
    const res = await api.post<StepUpStatus>(`${BASE}/endStepUp`, { organizationId });
    return res.data ?? { active: false };
  }
}
