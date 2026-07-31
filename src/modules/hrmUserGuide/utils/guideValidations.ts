import { ACCEPTED_MIME, MAX_FILE_SIZE_BYTES } from './guideConstants';
import { formatFileSize } from './guideHelpers';

/**
 * Mirrors the server-side file rules so the user is told before a 20 MB
 * upload goes over the wire. Returns null when the file is acceptable.
 */
export function validateGuideFile(file: File): string | null {
  const isPdf =
    file.type === ACCEPTED_MIME || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return 'Only PDF files can be uploaded as user guides.';
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is ${formatFileSize(file.size)} — the limit is ${formatFileSize(
      MAX_FILE_SIZE_BYTES,
    )}.`;
  }
  if (file.size === 0) return 'That file is empty.';
  return null;
}

export function validateTitle(title: string): string | null {
  const t = (title ?? '').trim();
  if (!t) return 'Title is required.';
  if (t.length > 120) return 'Title must be 120 characters or fewer.';
  return null;
}
