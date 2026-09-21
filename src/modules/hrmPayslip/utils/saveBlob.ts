/**
 * Saves a Blob to disk via a throwaway object URL and an invisible anchor click. Shared by every
 * upload-repository download path (error-report CSV, uploaded-payslip PDF, HR bulk download) so
 * the create-URL / anchor / revoke sequence exists exactly once.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
