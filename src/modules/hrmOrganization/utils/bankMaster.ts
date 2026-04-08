/**
 * Indian Banks Master List for autocomplete
 */
export const INDIAN_BANKS = [
  'Axis Bank',
  'Bandhan Bank',
  'Bank of Baroda',
  'Bank of India',
  'Bank of Maharashtra',
  'Canara Bank',
  'Central Bank of India',
  'City Union Bank',
  'CSB Bank',
  'DCB Bank',
  'Dhanlaxmi Bank',
  'Federal Bank',
  'HDFC Bank',
  'ICICI Bank',
  'IDBI Bank',
  'IDFC First Bank',
  'Indian Bank',
  'Indian Overseas Bank',
  'IndusInd Bank',
  'Jammu & Kashmir Bank',
  'Karnataka Bank',
  'Karur Vysya Bank',
  'Kotak Mahindra Bank',
  'Nainital Bank',
  'Punjab & Sind Bank',
  'Punjab National Bank',
  'RBL Bank',
  'South Indian Bank',
  'State Bank of India',
  'Tamilnad Mercantile Bank',
  'UCO Bank',
  'Union Bank of India',
  'Yes Bank',
];

/**
 * Fetch bank details from IFSC code using Razorpay public API.
 * Returns bank name, branch, city, state, or null on failure.
 */
export async function lookupIFSC(ifscCode: string): Promise<{
  bank: string;
  branch: string;
  city: string;
  state: string;
  address: string;
} | null> {
  if (!ifscCode || ifscCode.length !== 11) return null;

  try {
    const res = await fetch(`https://ifsc.razorpay.com/${ifscCode.toUpperCase()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      bank: data.BANK || '',
      branch: data.BRANCH || '',
      city: data.CITY || '',
      state: data.STATE || '',
      address: data.ADDRESS || '',
    };
  } catch {
    return null;
  }
}
