/**
 * HRM Holiday Module - Validation Rules
 */

export const holidayFormRules = {
  name: [
    { required: true, message: 'Holiday name is required' },
    { max: 120, message: 'Name must be 120 characters or less' },
  ],
  date: [
    { required: true, message: 'Date is required' },
  ],
  category: [
    { required: true, message: 'Category is required' },
  ],
  reason: [
    { max: 256, message: 'Reason must be 256 characters or less' },
  ],
  notes: [
    { max: 500, message: 'Notes must be 500 characters or less' },
  ],
  compWindow: [
    { required: true, message: 'Compensatory window date is required' },
  ],
  locationScope: [
    { required: true, message: 'Location scope is required for Local holidays' },
  ],
};

export const groupFormRules = {
  groupName: [
    { required: true, message: 'Group name is required' },
    { max: 120, message: 'Group name must be 120 characters or less' },
  ],
  // Year is intentionally optional — multi-year / rolling groups don't
  // pin to a single calendar year, and individual holidays carry their
  // own date.
  year: [],
  description: [
    { max: 512, message: 'Description must be 512 characters or less' },
  ],
};

export const lockFormRules = {
  reason: [
    { required: true, message: 'Reason is required to lock the group' },
    { min: 10, message: 'Please provide a more detailed reason (min 10 characters)' },
  ],
};
