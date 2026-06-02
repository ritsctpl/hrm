/**
 * Utility functions for handling base64 data conversion
 */

/**
 * Validates if a string is valid base64
 */
export function isValidBase64(str: string): boolean {
  try {
    // Remove data URL prefix if present
    const base64String = str.replace(/^data:[^;]+;base64,/, '');
    
    // Check if it's valid base64
    return btoa(atob(base64String)) === base64String;
  } catch {
    return false;
  }
}

/**
 * Converts base64 string to blob with proper error handling
 */
export function base64ToBlob(base64Data: string, contentType: string = 'application/octet-stream'): Blob {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // Validate base64
    if (!isValidBase64(base64String)) {
      throw new Error('Invalid base64 string');
    }
    
    // Convert to binary
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: contentType });
  } catch (error) {
    console.error('Base64 to blob conversion failed:', error);
    throw new Error(`Failed to convert base64 to blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the MIME type from base64 data URL
 */
export function getMimeTypeFromBase64DataUrl(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}

/**
 * Checks if the base64 data represents an image
 */
export function isImageBase64(base64Data: string): boolean {
  const mimeType = getMimeTypeFromBase64DataUrl(base64Data);
  return mimeType ? mimeType.startsWith('image/') : false;
}

/**
 * Sniff the MIME type from the leading bytes of a base64 string by matching
 * well-known magic-byte prefixes. Used when the backend returns a wrong or
 * missing `contentType` (e.g. application/octet-stream) which causes the
 * browser to render image bytes as text inside an iframe.
 *
 * Returns null when nothing matches — callers should fall back to the
 * server-provided contentType.
 */
export function detectMimeFromBase64(base64Data: string): string | null {
  if (!base64Data) return null;
  // Strip data URL prefix and whitespace so the comparison is stable.
  const s = base64Data.replace(/^data:[^;]+;base64,/, "").trimStart();
  if (s.startsWith("/9j/")) return "image/jpeg";              // FF D8 FF
  if (s.startsWith("iVBORw0K")) return "image/png";           // 89 50 4E 47 0D 0A 1A 0A
  if (s.startsWith("R0lGOD")) return "image/gif";             // 47 49 46 38
  if (s.startsWith("UklGR")) return "image/webp";             // RIFF....WEBP
  if (s.startsWith("Qk")) return "image/bmp";                 // 42 4D
  if (s.startsWith("PD94bWwg") || s.startsWith("PHN2Zw")) return "image/svg+xml"; // "<?xml " or "<svg"
  if (s.startsWith("JVBERi0")) return "application/pdf";      // %PDF-
  if (s.startsWith("UEsDB")) return "application/zip";        // PK\x03\x04 — also xlsx/docx
  return null;
}