import type { CapacityStatus } from '../types/domain.types';

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

export function computeUtilization(actualHours: number, estimateHours: number): number {
  if (!estimateHours || estimateHours === 0) return 0;
  return Math.round((actualHours / estimateHours) * 100);
}

export function getCapacityStatus(
  allocatedHours: number,
  baseCapacity: number
): CapacityStatus {
  if (baseCapacity === 0) return 'GREEN';
  const pct = (allocatedHours / baseCapacity) * 100;
  if (pct > 100) return 'RED';
  if (pct >= 90) return 'YELLOW';
  return 'GREEN';
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isoWeekDates(weekStartStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartStr, i));
}
