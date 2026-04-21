/**
 * India Post pincode verification helper.
 * Uses the free public endpoint at api.postalpincode.in.
 * Network/API failures never block form save — callers treat failure as
 * "unverified" rather than "invalid".
 */

export type PincodeVerificationStatus = 'idle' | 'loading' | 'success' | 'error' | 'network-error';

export interface PincodeVerificationResult {
  status: PincodeVerificationStatus;
  state?: string;
  city?: string;
  district?: string;
  message?: string;
}

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Country: string;
  Pincode: string;
}

interface PincodeApiEntry {
  Message: string;
  Status: 'Success' | 'Error' | '404';
  PostOffice: PostOffice[] | null;
}

const API_ENDPOINT = 'https://api.postalpincode.in/pincode/';
const cache = new Map<string, PincodeVerificationResult>();

export const isSixDigits = (pincode: string | undefined | null): boolean =>
  /^\d{6}$/.test((pincode ?? '').trim());

export const verifyPincode = async (
  pincodeRaw: string,
  signal?: AbortSignal
): Promise<PincodeVerificationResult> => {
  const pincode = (pincodeRaw ?? '').trim();
  if (!isSixDigits(pincode)) {
    return { status: 'error', message: 'Pincode must be exactly 6 digits' };
  }

  const cached = cache.get(pincode);
  if (cached) return cached;

  let response: Response;
  try {
    response = await fetch(`${API_ENDPOINT}${pincode}`, { signal });
  } catch {
    // Network failure — don't block save.
    return { status: 'network-error', message: 'Could not reach pincode service' };
  }

  if (!response.ok) {
    return { status: 'network-error', message: 'Pincode service unavailable' };
  }

  let payload: PincodeApiEntry[];
  try {
    payload = await response.json();
  } catch {
    return { status: 'network-error', message: 'Invalid response from pincode service' };
  }

  const entry = Array.isArray(payload) ? payload[0] : undefined;
  if (!entry || entry.Status !== 'Success' || !entry.PostOffice?.length) {
    const result: PincodeVerificationResult = {
      status: 'error',
      message: 'Pincode not found',
    };
    cache.set(pincode, result);
    return result;
  }

  const postOffice = entry.PostOffice[0];
  const result: PincodeVerificationResult = {
    status: 'success',
    state: postOffice.State,
    district: postOffice.District,
    city: postOffice.District,
    message: `${postOffice.District}, ${postOffice.State}`,
  };
  cache.set(pincode, result);
  return result;
};
