/**
 * HRM Holiday Module - Formatters
 */

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function isDatePast(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d < new Date(new Date().toDateString());
}

export function formatCompWindow(start?: string, end?: string): string {
  if (!start || !end) return '';
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

export function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return dateTimeStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getYearOptions(offset: number = 5): { value: number; label: string }[] {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - offset; y <= current + offset; y++) {
    years.push({ value: y, label: String(y) });
  }
  return years;
}
