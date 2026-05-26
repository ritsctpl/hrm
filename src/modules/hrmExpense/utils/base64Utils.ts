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