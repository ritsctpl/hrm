/**
 * Formats a byte count for the attachment list (design §14.2.2 — "892 KB").
 * Returns an empty string when the backend omits the size, so callers can
 * render the label conditionally without a null check at every call site.
 */
export const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};
