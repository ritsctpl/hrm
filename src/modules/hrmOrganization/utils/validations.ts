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
  if (!pan) return null; // Optional field
  if (!PAN_PATTERN.test(pan.toUpperCase())) {
    return 'PAN must be in format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)';
  }
  return null;
};

export const validateTAN = (tan: string): string | null => {
  if (!tan) return null; // Optional field
  if (!TAN_PATTERN.test(tan.toUpperCase())) {
    return 'TAN must be in format: 4 letters, 5 numbers, 1 letter (e.g., ABCD12345E)';
  }
  return null;
};

export const validateCIN = (cin: string): string | null => {
  if (!cin) return null; // Optional field
  if (!CIN_PATTERN.test(cin.toUpperCase())) {
    return 'CIN must be 21 characters (e.g., U12345MH2000PTC123456)';
  }
  return null;
};

export const validateGSTIN = (gstin: string): string | null => {
  if (!gstin) return null; // Optional field
  if (!GSTIN_PATTERN.test(gstin.toUpperCase())) {
    return 'GSTIN must be 15 characters (e.g., 33AABCA0633D1Z5)';
  }
  return null;
};

export const validatePrimaryContact = (contact: string): string | null => {
  if (!contact || !contact.trim()) {
    return 'Primary Contact is required';
  }
  return null;
};

export const validateCompanyProfile = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Optional fields with format validation
  if (data.pan) {
    const panError = validatePAN(data.pan);
    if (panError) errors.pan = panError;
  }

  if (data.tan) {
    const tanError = validateTAN(data.tan);
    if (tanError) errors.tan = tanError;
  }

  if (data.cin) {
    const cinError = validateCIN(data.cin);
    if (cinError) errors.cin = cinError;
  }

  if (data.gstin) {
    const gstinError = validateGSTIN(data.gstin);
    if (gstinError) errors.gstin = gstinError;
  }

  return errors;
};

export const validateBusinessUnit = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.buCode?.trim()) {
    errors.buCode = 'BU Code is required';
  }

  if (!data.buName?.trim()) {
    errors.buName = 'BU Name is required';
  }

  if (!data.state?.trim()) {
    errors.state = 'State is required';
  }

  if (!data.placeOfSupply?.trim()) {
    errors.placeOfSupply = 'Place of Supply is required';
  }

  if (!data.primaryContact?.trim()) {
    errors.primaryContact = 'Primary Contact is required';
  }

  // Optional fields with format validation
  if (data.gstin) {
    const gstinError = validateGSTIN(data.gstin);
    if (gstinError) errors.gstin = gstinError;
  }

  // Address validation
  if (data.address) {
    if (!data.address.line1?.trim()) {
      errors['address.line1'] = 'Address Line 1 is required';
    }
    if (!data.address.city?.trim()) {
      errors['address.city'] = 'City is required';
    }
    if (!data.address.state?.trim()) {
      errors['address.state'] = 'State is required';
    }
    if (!data.address.pincode?.trim()) {
      errors['address.pincode'] = 'Pincode is required';
    }
  }

  return errors;
};

export const validateLocation = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.code?.trim()) {
    errors.code = 'Location Code is required';
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

  if (!data.pincode?.trim()) {
    errors.pincode = 'PIN/ZIP Code is required';
  }

  return errors;
};
