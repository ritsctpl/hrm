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

// Pincode pattern (6 digits for India)
export const PINCODE_PATTERN = /^[0-9]{6}$/;

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

export const validatePincode = (pincode: string): string | null => {
  if (!pincode || !pincode.trim()) {
    return 'Pincode is required';
  }
  if (!PINCODE_PATTERN.test(pincode.trim())) {
    return 'Pincode must be exactly 6 digits';
  }
  return null;
};

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

  // Required format validations for PAN, TAN, CIN
  const panError = validatePAN(data.pan || '');
  if (panError) errors.pan = panError;

  const tanError = validateTAN(data.tan || '');
  if (tanError) errors.tan = tanError;

  const cinError = validateCIN(data.cin || '');
  if (cinError) errors.cin = cinError;

  // GSTIN validation (optional field, but if provided must be valid format and match PAN and state)
  if (data.gstIn && data.gstIn.trim()) {
    // Get registered address state for validation
    const registeredAddress = data.registeredOfficeAddress || data.registeredAddress;
    const registeredState = registeredAddress?.state;
    
    const gstinError = validateGSTIN(data.gstIn, data.pan, registeredState);
    if (gstinError) errors.gstIn = gstinError;
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
  const registeredAddress = data.registeredOfficeAddress || data.registeredAddress;
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
    const pincodeError = validatePincode(registeredAddress.pincode || '');
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

  // ===== FINANCIAL YEAR - NOW REQUIRED =====
  if (!data.financialYearStartMonth?.trim()) {
    errors.financialYearStartMonth = 'Financial Year Start Month is required';
  }

  if (!data.financialYearEndMonth?.trim()) {
    errors.financialYearEndMonth = 'Financial Year End Month is required';
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

  // GSTIN is now REQUIRED (cross-checked with address state since BU-level state field was removed)
  if (!data.gstin?.trim()) {
    errors.gstin = 'GSTIN is required';
  } else {
    const gstinError = validateGSTIN(data.gstin, undefined, data.address?.state);
    if (gstinError) errors.gstin = gstinError;
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
    const pincodeError = validatePincode(data.address.pincode || '');
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

  const pincodeError = validatePincode(data.pincode || '');
  if (pincodeError) {
    errors.pincode = pincodeError;
  }

  return errors;
};
