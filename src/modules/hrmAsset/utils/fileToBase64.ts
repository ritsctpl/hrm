/**
 * Reads a File and resolves to a base64 data-URI string,
 * e.g. "data:application/pdf;base64,JVBERi0xLjQ...".
 *
 * The data-URI prefix is intentionally kept — the backend strips it. This
 * mirrors the Leave module's attachment upload contract (contentBase64).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
