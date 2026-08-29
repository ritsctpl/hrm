/**
 * The auth token is stored as the *raw* Keycloak JWT: `AuthContext` writes
 * `keycloak.token` straight into the `token` cookie, and nothing in this app —
 * nor in fentames, which shares that cookie on this host — has ever called an
 * encrypt function on it.
 *
 * This module used to AES-encrypt it under `NEXT_PUBLIC_ENCRYPTION_KEY`: a key
 * shipped to every browser, both inlined into the client bundle and served
 * unauthenticated from `/hrm/api/config`. A key the attacker already holds
 * protects nothing, so it is gone, and the never-called `encryptToken` with it.
 *
 * `decryptToken` remains the single read path its callers already use, keeping
 * its tolerant contract: hand back whatever it was given, and null for empty.
 */
export const decryptToken = (encryptedToken: string): string | null => {
  if (!encryptedToken) {
    return null;
  }

  return encryptedToken;
};
