/**
 * HRM Asset Module - Validation Rules
 */

export const assetFormRules = {
  categoryCode: [{ required: true, message: 'Category is required' }],
  assetName: [
    { required: true, message: 'Asset name is required' },
    { max: 120, message: 'Max 120 characters' },
  ],
  purchaseValueINR: [
    { required: true, message: 'Purchase value is required' },
    { type: 'number' as const, min: 0, message: 'Must be positive' },
  ],
  purchaseDate: [{ required: true, message: 'Purchase date is required' }],
  vendor: [{ required: true, message: 'Vendor is required' }],
  invoiceNo: [{ required: true, message: 'Invoice number is required' }],
  invoiceDate: [{ required: true, message: 'Invoice date is required' }],
};

export const requestFormRules = {
  categoryCode: [{ required: true, message: 'Category is required' }],
  quantity: [
    { required: true, message: 'Quantity is required' },
    { type: 'number' as const, min: 1, message: 'Min quantity is 1' },
  ],
  purpose: [
    { required: true, message: 'Purpose is required' },
    { max: 500, message: 'Max 500 characters' },
  ],
};

export const categoryFormRules = {
  categoryCode: [
    { required: true, message: 'Category code is required' },
    { pattern: /^[A-Z0-9_]+$/, message: 'Uppercase letters, digits and underscores only' },
    { max: 20, message: 'Max 20 characters' },
  ],
  categoryName: [
    { required: true, message: 'Category name is required' },
    { max: 60, message: 'Max 60 characters' },
  ],
  wdvRatePct: [
    { required: true, message: 'WDV rate is required' },
    { type: 'number' as const, min: 0, max: 100, message: 'Must be 0–100' },
  ],
};

export const maintenanceFormRules = {
  maintenanceDate: [{ required: true, message: 'Date is required' }],
  issue: [
    { required: true, message: 'Issue description is required' },
    { max: 256, message: 'Max 256 characters' },
  ],
};
