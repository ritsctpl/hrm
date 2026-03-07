/**
 * Utility functions for auto-generating IDs based on names
 */

/**
 * Converts a name to a clean ID format
 * @param name - The input name to convert
 * @returns Cleaned ID in lowercase with underscores
 */
export const generateBaseId = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim() // Remove leading and trailing spaces
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

/**
 * Generates a unique ID based on name, checking against existing IDs
 * @param name - The input name to base the ID on
 * @param existingIds - Array of existing IDs to check for duplicates
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID with suffix if needed
 */
export const generateUniqueId = (
  name: string, 
  existingIds: string[], 
  prefix: string = ''
): string => {
  const baseId = generateBaseId(name);
  if (!baseId) return '';
  
  const fullBaseId = prefix ? `${prefix}${baseId}` : baseId;
  
  // If the base ID doesn't exist, return it
  if (!existingIds.includes(fullBaseId)) {
    return fullBaseId;
  }
  
  // Find the next available ID with suffix
  let counter = 1;
  let uniqueId = `${fullBaseId}_${counter.toString().padStart(2, '0')}`;
  
  while (existingIds.includes(uniqueId)) {
    counter++;
    uniqueId = `${fullBaseId}_${counter.toString().padStart(2, '0')}`;
  }
  
  return uniqueId;
};

/**
 * Generates a unique group ID based on group name
 * @param groupName - The group name to base the ID on
 * @param existingGroups - Array of existing groups to check for duplicates
 * @returns Unique group ID
 */
export const generateUniqueGroupId = (
  groupName: string, 
  existingGroups: { groupId: string }[]
): string => {
  const existingIds = existingGroups.map(group => group.groupId);
  return generateUniqueId(groupName, existingIds);
};

/**
 * Generates a unique field ID based on field label
 * @param label - The field label to base the ID on
 * @param existingFields - Array of existing fields to check for duplicates
 * @returns Unique field ID
 */
export const generateUniqueFieldId = (
  label: string, 
  existingFields: { fieldId: string }[]
): string => {
  const existingIds = existingFields.map(field => field.fieldId);
  return generateUniqueId(label, existingIds);
};