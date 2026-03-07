/**
 * HRM Asset Module - Helper utilities
 */

export function formatCurrency(amount: number): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isWarrantyExpiringSoon(expiryDate: string, days: number = 90): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return expiry <= threshold && expiry >= new Date();
}

export function computeStatusColor(status: string): string {
  const map: Record<string, string> = {
    IN_STORE: '#595959',
    WORKING: '#52c41a',
    UNDER_REPAIR: '#faad14',
    DAMAGED: '#ff4d4f',
    LOST: '#ff4d4f',
    RETIRED: '#bfbfbf',
  };
  return map[status] ?? '#595959';
}
