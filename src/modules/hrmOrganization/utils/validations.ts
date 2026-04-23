/**
 * HRM Organization Module - Validation Utilities
 */

// PAN format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// TAN format: 4 letters, 5 numbers, 1 letter (e.g., ABCD12345E)
export const TAN_PATTERN = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

// CIN format: 21 characters (e.g., U12345MH2000PTC123456)
export const CIN_PATTERN = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

// GSTIN format: 15 characters (e.g., 33AABCA0633D1Z5)
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const validatePAN = (pan: string): string | null => {
  if (!pan || !pan.trim()) {
    return 'PAN is required';
  }
  if (!PAN_PATTERN.test(pan.toUpperCase())) {
    return 'PAN must be in format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)';
  }
  return null;
};

export const validateTAN = (tan: string): string | null => {
  if (!tan || !tan.trim()) {
    return 'TAN is required';
  }
  if (!TAN_PATTERN.test(tan.toUpperCase())) {
    return 'TAN must be in format: 4 letters, 5 numbers, 1 letter (e.g., ABCD12345E)';
  }
  return null;
};

export const validateCIN = (cin: string): string | null => {
  if (!cin || !cin.trim()) {
    return 'CIN is required';
  }
  if (!CIN_PATTERN.test(cin.toUpperCase())) {
    return 'CIN must be 21 characters (e.g., U12345MH2000PTC123456)';
  }
  return null;
};

/** GSTIN state code → state name */
const GSTIN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(GSTIN_STATE_CODES).map(([code, name]) => [name, code])
);

export const validateGSTIN = (gstin: string, pan?: string, state?: string): string | null => {
  if (!gstin || !gstin.trim()) {
    return null;
  }
  const g = gstin.toUpperCase();
  if (!GSTIN_PATTERN.test(g)) {
    return 'GSTIN must be 15 characters (e.g., 33AABCA0633D1Z5)';
  }

  // Validate state code (first 2 digits)
  const stateCode = g.substring(0, 2);
  if (!GSTIN_STATE_CODES[stateCode]) {
    return `Invalid state code "${stateCode}" in GSTIN`;
  }

  // Cross-validate with selected state
  if (state && state.trim()) {
    const expectedCode = STATE_NAME_TO_CODE[state];
    if (expectedCode && stateCode !== expectedCode) {
      return `GSTIN state code (${stateCode} = ${GSTIN_STATE_CODES[stateCode]}) doesn't match selected state (${state})`;
    }
  }

  // Cross-validate with PAN (characters 3-12)
  if (pan && pan.trim()) {
    const gstinPan = g.substring(2, 12);
    const enteredPan = pan.trim().toUpperCase();
    if (gstinPan !== enteredPan) {
      return `GSTIN contains PAN "${gstinPan}" which does not match entered PAN "${enteredPan}"`;
    }
  }

  return null;
};

export const validatePrimaryContact = (contact: string): string | null => {
  if (!contact || !contact.trim()) {
    return 'Primary Contact is required';
  }
  return null;
};

// Email pattern
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone pattern (basic - allows 10+ digits with optional +, -, spaces)
export const PHONE_PATTERN = /^[\+]?[\d\s\-\(\)]{10,}$/;

// Pincode pattern (6 digits for India only, must not start with 0)
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
// Overseas ZIP / postal code — alphanumeric, 3-12 chars, allow single space/hyphen.
// Fallback for any country not explicitly mapped below.
export const OVERSEAS_POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 \-]{1,10}[A-Za-z0-9]$/;

/**
 * Country-specific validation registry.
 *
 * Driving principle: tax IDs, postal codes, and VAT number formats are
 * country-scoped. Encoding them in a map (instead of scattered `if country
 * === 'India'` branches across validators + UI) keeps the logic discoverable
 * and easy to extend when a new country is added.
 *
 * Each entry provides:
 *   - postalLabel   → UI label (India: "PIN Code", US: "ZIP Code", else: "Postal Code")
 *   - postalPattern → regex enforced on save
 *   - postalHint    → user-facing error message when postalPattern fails
 *   - postalMax     → input maxLength (UX — prevents overtype)
 *   - taxIdLabel    → UI label (India: "GSTIN", US: "Tax ID", EU: "VAT Number", else: "Tax ID / VAT Number")
 *   - taxIdPattern  → strict regex (India only); overseas uses a loose length check
 *   - taxIdHint     → error message for bad tax id
 */
export interface CountryValidationSpec {
  postalLabel: string;
  postalPattern: RegExp;
  postalHint: string;
  postalMax: number;
  taxIdLabel: string;
  taxIdPattern?: RegExp;
  taxIdHint: string;
  taxIdMin: number;
  taxIdMax: number;
}

// US ZIP: 5 digits, optionally + dash + 4 digits (ZIP+4).
const US_ZIP_PATTERN = /^[0-9]{5}(?:-[0-9]{4})?$/;
// US Tax ID: 9 digits (EIN) or XX-XXXXXXX or XXX-XX-XXXX (SSN) — loose match.
const US_TAX_ID_PATTERN = /^[0-9]{2}-?[0-9]{7}$|^[0-9]{3}-?[0-9]{2}-?[0-9]{4}$|^[0-9]{9}$/;
// UK postcode: e.g. "SW1A 1AA", "EC1A 1BB", "M1 1AE" — flexible.
const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
// UK VAT: GB + 9 digits (+ optional 3 digits for branch) or GBGD xxx / GBHA xxx.
const UK_VAT_PATTERN = /^GB[0-9]{9}(?:[0-9]{3})?$|^GB(?:GD|HA)[0-9]{3}$/i;
// Singapore postal: 6 digits.
const SG_POSTAL_PATTERN = /^[0-9]{6}$/;
// Singapore UEN: 9-10 chars, digits + letter or letters.
const SG_UEN_PATTERN = /^[0-9]{8,9}[A-Z]$|^[TSR][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/i;
// UAE: PO Box is typed as plain digits; accept 3-8 digits to match common usage.
const UAE_POSTAL_PATTERN = /^[0-9]{3,8}$/;
// UAE TRN (Tax Registration Number): 15 digits.
const UAE_TRN_PATTERN = /^[0-9]{15}$/;

export const COUNTRY_VALIDATION: Record<string, CountryValidationSpec> = {
  India: {
    postalLabel: 'PIN Code',
    postalPattern: PINCODE_PATTERN,
    postalHint: 'PIN Code must be exactly 6 digits (and cannot start with 0)',
    postalMax: 6,
    taxIdLabel: 'GSTIN',
    taxIdPattern: GSTIN_PATTERN,
    taxIdHint: 'GSTIN must be 15 characters (e.g., 33AABCA0633D1Z5)',
    taxIdMin: 15,
    taxIdMax: 15,
  },
  'United States': {
    postalLabel: 'ZIP Code',
    postalPattern: US_ZIP_PATTERN,
    postalHint: 'ZIP must be 5 digits (12345) or ZIP+4 (12345-6789)',
    postalMax: 10,
    taxIdLabel: 'Tax ID (EIN/SSN)',
    taxIdPattern: US_TAX_ID_PATTERN,
    taxIdHint: 'Enter a 9-digit EIN (12-3456789) or SSN (123-45-6789)',
    taxIdMin: 9,
    taxIdMax: 11,
  },
  'United Kingdom': {
    postalLabel: 'Postcode',
    postalPattern: UK_POSTCODE_PATTERN,
    postalHint: 'Postcode must match UK format (e.g. SW1A 1AA)',
    postalMax: 8,
    taxIdLabel: 'VAT Number',
    taxIdPattern: UK_VAT_PATTERN,
    taxIdHint: 'VAT Number must start with GB and be 9-12 digits (e.g. GB123456789)',
    taxIdMin: 11,
    taxIdMax: 14,
  },
  Singapore: {
    postalLabel: 'Postal Code',
    postalPattern: SG_POSTAL_PATTERN,
    postalHint: 'Postal Code must be exactly 6 digits',
    postalMax: 6,
    taxIdLabel: 'UEN',
    taxIdPattern: SG_UEN_PATTERN,
    taxIdHint: 'UEN must follow Singapore ACRA format (e.g. 201912345A)',
    taxIdMin: 9,
    taxIdMax: 10,
  },
  'United Arab Emirates': {
    postalLabel: 'PO Box',
    postalPattern: UAE_POSTAL_PATTERN,
    postalHint: 'PO Box must be 3-8 digits',
    postalMax: 8,
    taxIdLabel: 'TRN (Tax Registration Number)',
    taxIdPattern: UAE_TRN_PATTERN,
    taxIdHint: 'TRN must be exactly 15 digits',
    taxIdMin: 15,
    taxIdMax: 15,
  },
};

/** Fallback spec for any country not in the map — loose alphanumeric checks. */
const GENERIC_VALIDATION: CountryValidationSpec = {
  postalLabel: 'Postal Code',
  postalPattern: OVERSEAS_POSTAL_PATTERN,
  postalHint: 'Enter a valid postal / ZIP code',
  postalMax: 12,
  taxIdLabel: 'Tax ID / VAT Number',
  taxIdPattern: undefined,
  taxIdHint: 'Tax ID must be 5-20 alphanumeric characters',
  taxIdMin: 5,
  taxIdMax: 20,
};

export function getCountryValidationSpec(country?: string): CountryValidationSpec {
  if (!country) return COUNTRY_VALIDATION.India;
  return COUNTRY_VALIDATION[country] ?? GENERIC_VALIDATION;
}

export const validateEmail = (email: string): string | null => {
  if (!email) return null; // Optional field
  if (!EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Optional field
  if (!PHONE_PATTERN.test(phone)) {
    return 'Please enter a valid phone number (at least 10 digits)';
  }
  return null;
};

export const validatePincode = (pincode: string, country?: string): string | null => {
  if (!pincode || !pincode.trim()) {
    const spec = getCountryValidationSpec(country);
    return `${spec.postalLabel} is required`;
  }
  const spec = getCountryValidationSpec(country);
  const value = pincode.trim();
  if (!spec.postalPattern.test(value)) {
    return spec.postalHint;
  }
  return null;
};

/**
 * Validate a tax identifier (GSTIN / EIN / VAT / TRN / UEN) according to the
 * country's spec. Empty values are allowed by default — the caller decides
 * whether required-ness applies (e.g., GSTIN is required in India).
 */
export const validateTaxId = (
  value: string | undefined,
  country?: string
): string | null => {
  if (!value || !value.trim()) return null;
  const spec = getCountryValidationSpec(country);
  const v = value.trim();
  if (v.length < spec.taxIdMin || v.length > spec.taxIdMax) {
    return spec.taxIdHint;
  }
  if (spec.taxIdPattern && !spec.taxIdPattern.test(v.toUpperCase())) {
    return spec.taxIdHint;
  }
  return null;
};

export function getTaxIdLabel(country?: string): string {
  return getCountryValidationSpec(country).taxIdLabel;
}

// Cross-validate an address block against the pincode-derived truth stamped
// by OrgAddressFields after a successful India Post verification. Only fires
// for India; no-op otherwise. Catches the "user pincode-verified, then
// manually changed state/city to mismatch" case.
function crossValidateAddress(
  prefix: string,
  addr: Record<string, any> | undefined | null,
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!addr) return errs;
  const country = (addr.country || 'India').trim();
  if (country.toLowerCase() !== 'india') return errs;
  const vPin = addr._verifiedPincode;
  const vState = addr._verifiedState;
  const vCity = addr._verifiedCity;
  if (!vPin) return errs;
  if (vState && addr.state && addr.state !== vState) {
    errs[`${prefix}.state`] = `State doesn't match PIN ${vPin} (expected ${vState})`;
  }
  if (vCity && addr.city && addr.city !== vCity) {
    errs[`${prefix}.city`] = `City doesn't match PIN ${vPin} (expected ${vCity})`;
  }
  return errs;
}

export const validateCompanyProfile = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.legalName?.trim()) {
    errors.legalName = 'Legal Name is required';
  }

  // Trade Name is NO LONGER required - REMOVED
  // Do NOT validate companyName or tradeName

  // Registration Number is NO LONGER required - REMOVED
  // Do NOT validate registrationNumber

  if (!data.industryType?.trim() && !data.industry?.trim()) {
    errors.industryType = 'Industry Type is required';
  }

  // Founded Date is NO LONGER required - REMOVED
  // Do NOT validate foundedDate or incorporationDate

  // PAN, TAN, CIN, GSTIN are India-only regulatory identifiers. Apply their
  // strict formats only when the registered office is in India. For overseas
  // companies, treat `gstIn` as a generic Tax ID with a permissive check.
  const registeredAddress = data.registeredOfficeAddress || data.registeredAddress;
  const companyCountry = registeredAddress?.country || 'India';
  const isIndianCompany = companyCountry.trim().toLowerCase() === 'india';

  if (isIndianCompany) {
    const panError = validatePAN(data.pan || '');
    if (panError) errors.pan = panError;

    const tanError = validateTAN(data.tan || '');
    if (tanError) errors.tan = tanError;

    const cinError = validateCIN(data.cin || '');
    if (cinError) errors.cin = cinError;

    // GSTIN (optional, but must match format + PAN + state if provided)
    if (data.gstIn && data.gstIn.trim()) {
      const registeredState = registeredAddress?.state;
      const gstinError = validateGSTIN(data.gstIn, data.pan, registeredState);
      if (gstinError) errors.gstIn = gstinError;
    }
  } else if (data.gstIn && data.gstIn.trim()) {
    // Non-India: loose tax-id validation against the country's spec.
    const taxError = validateTaxId(data.gstIn, companyCountry);
    if (taxError) errors.gstIn = taxError;
  }

  // Email validation
  if (data.officialEmail) {
    const emailError = validateEmail(data.officialEmail);
    if (emailError) errors.officialEmail = emailError;
  }

  // Phone validation
  if (data.officialPhone) {
    const phoneError = validatePhone(data.officialPhone);
    if (phoneError) errors.officialPhone = phoneError;
  }

  // ===== REGISTERED OFFICE ADDRESS - NOW REQUIRED =====
  if (!registeredAddress) {
    errors['registeredOfficeAddress'] = 'Registered Office Address is required';
  } else {
    if (!registeredAddress.line1?.trim()) {
      errors['registeredOfficeAddress.line1'] = 'Address Line 1 is required';
    }
    if (!registeredAddress.city?.trim()) {
      errors['registeredOfficeAddress.city'] = 'City is required';
    }
    if (!registeredAddress.state?.trim()) {
      errors['registeredOfficeAddress.state'] = 'State is required';
    }
    const pincodeError = validatePincode(registeredAddress.pincode || '', registeredAddress.country);
    if (pincodeError) {
      errors['registeredOfficeAddress.pincode'] = pincodeError;
    }
  }

  // ===== BANK ACCOUNTS - AT LEAST ONE WITH PRIMARY REQUIRED =====
  const bankAccounts = data.bankAccounts || [];
  if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) {
    errors.bankAccounts = 'At least one bank account is required';
  } else {
    // Check if at least one account is marked as primary
    const hasPrimaryAccount = bankAccounts.some((account: any) => account.isPrimary === true);
    if (!hasPrimaryAccount) {
      errors.bankAccounts = 'At least one bank account must be marked as primary';
    }

    // Validate each bank account
    bankAccounts.forEach((account: any, index: number) => {
      if (!account.bankName?.trim()) {
        errors[`bankAccounts[${index}].bankName`] = 'Bank Name is required';
      }
      if (!account.branch?.trim()) {
        errors[`bankAccounts[${index}].branch`] = 'Branch is required';
      }
      if (!account.ifsc?.trim()) {
        errors[`bankAccounts[${index}].ifsc`] = 'IFSC Code is required';
      }
      if (!account.accountNumber?.trim()) {
        errors[`bankAccounts[${index}].accountNumber`] = 'Account Number is required';
      }
      if (!account.accountType?.trim()) {
        errors[`bankAccounts[${index}].accountType`] = 'Account Type is required';
      }
    });
  }

  // ===== ADDRESS CROSS-VALIDATION (India only, requires prior pincode verify) =====
  Object.assign(errors, crossValidateAddress('registeredOfficeAddress', registeredAddress));
  const corporateAddress = data.corporateOfficeAddress || data.corporateAddress;
  Object.assign(errors, crossValidateAddress('corporateOfficeAddress', corporateAddress));

  // ===== FINANCIAL YEAR - NOW REQUIRED =====
  if (!data.financialYearStartMonth?.trim()) {
    errors.financialYearStartMonth = 'Financial Year Start Month is required';
  }

  if (!data.financialYearEndMonth?.trim()) {
    errors.financialYearEndMonth = 'Financial Year End Month is required';
  }

  // Enforce 12-month span when both months are set. Uses modular arithmetic:
  // (end - start + 12) % 12 === 11 iff the two months bracket exactly 12
  // calendar months (e.g. April → March ⇒ (2 - 3 + 12) % 12 === 11).
  const FY_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (data.financialYearStartMonth && data.financialYearEndMonth) {
    const s = FY_MONTHS.indexOf(data.financialYearStartMonth);
    const e = FY_MONTHS.indexOf(data.financialYearEndMonth);
    if (s === -1 || e === -1) {
      errors.financialYearEndMonth = 'Invalid month';
    } else if (((e - s + 12) % 12) !== 11) {
      errors.financialYearEndMonth = 'Financial year must span exactly 12 months (e.g. April – March)';
    }
  }

  return errors;
};

export const validateBusinessUnit = (data: any, existingCodes?: string[]): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.buCode?.trim()) {
    errors.buCode = 'BU Code is required';
  } else if (existingCodes?.includes(data.buCode.trim().toUpperCase())) {
    errors.buCode = 'A Business Unit with this code already exists';
  }

  if (!data.buName?.trim()) {
    errors.buName = 'BU Name is required';
  }

  if (!data.primaryContact?.trim()) {
    errors.primaryContact = 'Primary Contact is required';
  }

  // Tax ID: required only for India (where GSTIN is legally mandated for
  // registered businesses). Other countries may leave it blank; if supplied,
  // it must match that country's pattern.
  const buCountry = data.address?.country || 'India';
  const isIndia = buCountry.trim().toLowerCase() === 'india';
  const spec = getCountryValidationSpec(buCountry);
  if (isIndia) {
    if (!data.gstin?.trim()) {
      errors.gstin = `${spec.taxIdLabel} is required`;
    } else {
      // Use the India-aware validateGSTIN for cross-check with PAN + state.
      const gstinError = validateGSTIN(data.gstin, undefined, data.address?.state);
      if (gstinError) errors.gstin = gstinError;
    }
  } else if (data.gstin?.trim()) {
    const taxError = validateTaxId(data.gstin, buCountry);
    if (taxError) errors.gstin = taxError;
  }

  // Address validation - ALL FIELDS REQUIRED
  if (data.address) {
    if (!data.address.line1?.trim()) {
      errors['address.line1'] = 'Address Line 1 is required';
    }
    if (!data.address.city?.trim()) {
      errors['address.city'] = 'City is required';
    }
    if (!data.address.country?.trim()) {
      errors['address.country'] = 'Country is required';
    }
    if (!data.address.state?.trim()) {
      errors['address.state'] = 'State is required';
    }
    const pincodeError = validatePincode(data.address.pincode || '', data.address.country);
    if (pincodeError) {
      errors['address.pincode'] = pincodeError;
    }
  } else {
    errors['address'] = 'Address is required';
  }

  return errors;
};

export const validateLocation = (data: any, existingCodes?: string[]): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.code?.trim()) {
    errors.code = 'Location Code is required';
  } else if (existingCodes?.includes(data.code.trim().toUpperCase())) {
    errors.code = 'A Location with this code already exists';
  }

  if (!data.name?.trim()) {
    errors.name = 'Location Name is required';
  }

  if (!data.addressLine1?.trim()) {
    errors.addressLine1 = 'Address Line 1 is required';
  }

  if (!data.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!data.state?.trim()) {
    errors.state = 'State is required';
  }

  // Country has default value 'India', so only check if explicitly set to empty
  if (data.country === null || data.country === undefined || (typeof data.country === 'string' && !data.country.trim())) {
    errors.country = 'Country is required';
  }

  const pincodeError = validatePincode(data.pincode || '', data.country);
  if (pincodeError) {
    errors.pincode = pincodeError;
  }

  return errors;
};
