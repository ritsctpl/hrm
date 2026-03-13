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

export const validateGSTIN = (gstin: string): string | null => {
  if (!gstin || !gstin.trim()) {
    return 'GSTIN is required';
  }
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

// Email pattern
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone pattern (basic - allows 10+ digits with optional +, -, spaces)
export const PHONE_PATTERN = /^[\+]?[\d\s\-\(\)]{10,}$/;

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

export const validateCompanyProfile = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  console.log('Validating company profile:', data);

  // Required fields
  if (!data.legalName?.trim()) {
    errors.legalName = 'Legal Name is required';
  }

  if (!data.companyName?.trim() && !data.tradeName?.trim()) {
    errors.companyName = 'Company Name or Trade Name is required';
  }

  // Registration Number is NO LONGER required - REMOVED
  // Do NOT validate registrationNumber

  if (!data.industryType?.trim() && !data.industry?.trim()) {
    errors.industryType = 'Industry Type is required';
  }

  if (!data.foundedDate?.trim() && !data.incorporationDate?.trim()) {
    errors.foundedDate = 'Founded Date or Incorporation Date is required';
  }

  // Required format validations for PAN, TAN, CIN, GSTIN
  const panError = validatePAN(data.pan || '');
  if (panError) errors.pan = panError;

  const tanError = validateTAN(data.tan || '');
  if (tanError) errors.tan = tanError;

  const cinError = validateCIN(data.cin || '');
  if (cinError) errors.cin = cinError;

  const gstinError = validateGSTIN(data.gstin || '');
  if (gstinError) errors.gstin = gstinError;

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
    if (!registeredAddress.pincode?.trim()) {
      errors['registeredOfficeAddress.pincode'] = 'Pincode is required';
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

  console.log('Validation errors:', errors);
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
