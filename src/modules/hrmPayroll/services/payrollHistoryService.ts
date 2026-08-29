import api from '@/services/api';
import { getOrganizationId } from '@/utils/cookieUtils';
import type {
  PayrollHistoryPreview,
  PayrollHistoryCommitResult,
} from '../types/domain.types';

const BASE = '/hrm-service/payroll';

/**
 * Historical payroll back-load. be-spec §11.
 *
 * Two steps on purpose: preview parses and reports without writing anything, commit writes. A
 * spreadsheet is never committed sight-unseen.
 */
export class HrmPayrollHistoryService {
  /** The canonical CSV header, so HR fills the right columns rather than guessing. */
  static async downloadTemplate(): Promise<void> {
    const res = await api.post(
      `${BASE}/downloadPayrollHistoryTemplate`,
      { organizationId: getOrganizationId() },
      { responseType: 'blob' },
    );
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-history-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Parses and validates. Writes nothing — the response says so explicitly. */
  static async preview(file: File): Promise<PayrollHistoryPreview> {
    const form = new FormData();
    form.append('file', file);
    form.append('organizationId', getOrganizationId());
    const res = await api.post(`${BASE}/uploadPayrollHistory`, form);
    return (res.data?.response ?? res.data) as PayrollHistoryPreview;
  }

  static async commit(
    uploadRef: string,
    skipInvalidRows: boolean,
    performedBy: string,
  ): Promise<PayrollHistoryCommitResult> {
    const res = await api.post(`${BASE}/commitPayrollHistory`, {
      organizationId: getOrganizationId(),
      uploadRef,
      skipInvalidRows,
      performedBy,
    });
    return (res.data?.response ?? res.data) as PayrollHistoryCommitResult;
  }
}
