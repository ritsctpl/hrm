import api from '@services/api';

/**
 * Admin-configurable employee dropdown masters (Grade, Designation).
 * Backed by /hrm-service/lookup/* — one collection keyed by lookupType.
 */

export type LookupType = 'GRADE' | 'DESIGNATION';

export interface EmployeeLookup {
  handle: string;
  organizationId: string;
  lookupType: LookupType;
  value: string;
  displayOrder: number;
  active: number;
}

function unwrap<T>(data: unknown, fallback: T): T {
  // Backend replies with an HrmResponse envelope { success, data, ... }.
  const d = data as { data?: T } | T;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return ((d as { data?: T }).data ?? fallback);
  }
  return (d as T) ?? fallback;
}

export class EmployeeLookupService {
  private static readonly BASE = '/hrm-service/lookup';

  /** List active values for a lookup type (grade/designation). Lazily seeded server-side. */
  static async list(organizationId: string, lookupType: LookupType): Promise<EmployeeLookup[]> {
    const res = await api.post(`${this.BASE}/list`, { organizationId, lookupType });
    return unwrap<EmployeeLookup[]>(res.data, []);
  }

  /** Add (or reactivate) a value. */
  static async save(params: {
    organizationId: string;
    lookupType: LookupType;
    value: string;
    displayOrder?: number;
    createdBy?: string;
  }): Promise<void> {
    await api.post(`${this.BASE}/save`, {
      organizationId: params.organizationId,
      lookupType: params.lookupType,
      value: params.value,
      displayOrder: params.displayOrder ?? 0,
      createdBy: params.createdBy ?? 'system',
      modifiedBy: params.createdBy ?? 'system',
    });
  }

  /** Soft-delete a value by handle. */
  static async remove(organizationId: string, handle: string): Promise<void> {
    await api.post(`${this.BASE}/delete`, { organizationId, handle });
  }
}
