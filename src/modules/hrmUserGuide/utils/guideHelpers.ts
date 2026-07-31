import type { GuideGroup, UserGuide } from '../types/domain.types';
import { moduleLabel } from './guideConstants';

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Reads a File as a raw base64 string, stripping the `data:<mime>;base64,` prefix. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      resolve(dataUri.replace(/^data:[^;]*;base64,/, ''));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Turn raw base64 into a Blob. Large `data:` URLs can't be opened directly in
 * a tab, so the viewer and the download action both go through a blob URL.
 */
export function base64ToBlob(base64: string, mime = 'application/pdf'): Blob {
  const clean = base64.replace(/^data:[^;]*;base64,/, '');
  const byteString = atob(clean);
  const buffer = new ArrayBuffer(byteString.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

/** Saves a blob to disk under `fileName`. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Client-side search over the loaded list. The backend also supports
 * `searchText`, but filtering locally keeps typing responsive and lets the
 * module rail counts stay stable while the user narrows down.
 */
export function filterGuides(
  guides: UserGuide[],
  searchText: string,
  moduleCode: string,
): UserGuide[] {
  const q = searchText.trim().toLowerCase();
  return guides.filter((g) => {
    if (moduleCode && g.moduleCode !== moduleCode) return false;
    if (!q) return true;
    return (
      g.title?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.version?.toLowerCase().includes(q) ||
      moduleLabel(g.moduleCode).toLowerCase().includes(q) ||
      (g.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Groups guides by target module, ordered by module label then displayOrder. */
export function groupByModule(guides: UserGuide[]): GuideGroup[] {
  const byModule = new Map<string, UserGuide[]>();
  guides.forEach((g) => {
    const list = byModule.get(g.moduleCode) ?? [];
    list.push(g);
    byModule.set(g.moduleCode, list);
  });
  return Array.from(byModule.entries())
    .map(([moduleCode, list]) => ({
      moduleCode,
      moduleName: list[0]?.moduleName || moduleLabel(moduleCode),
      guides: [...list].sort(
        (a, b) =>
          (a.displayOrder ?? 999) - (b.displayOrder ?? 999) ||
          (a.title ?? '').localeCompare(b.title ?? ''),
      ),
    }))
    .sort((a, b) => a.moduleName.localeCompare(b.moduleName));
}
