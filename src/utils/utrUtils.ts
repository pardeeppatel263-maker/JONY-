/**
 * Utility functions for generating and formatting UPI UTR (Unique Transaction Reference) numbers.
 * Ensures clean direct UTR display without internal prefixes like "PENDING_", "QO_", etc.
 */

export const formatDisplayUtr = (utr?: string | null): string => {
  if (!utr) return '';
  const trimmed = utr.trim();
  // Strip any PENDING_, QO_, or PENDING_QO_ prefixes and internal QO markers
  const cleaned = trimmed
    .replace(/^PENDING_QO_/i, '')
    .replace(/^PENDING_/i, '')
    .replace(/^QO_/i, '')
    .replace(/_QO_/gi, '_')
    .replace(/QO/gi, '')
    .replace(/^_+|_+$/g, '');

  return cleaned || trimmed;
};

/**
 * Generates a clean 12-digit Indian UPI Ref / UTR number.
 * Example: 414387604496 (standard 12-digit numeric bank UTR)
 */
export const generateDirectUtr = (): string => {
  const timeSlice = Date.now().toString().slice(-8); // 8 numeric digits
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(); // 4 numeric digits
  return `${timeSlice}${randomSuffix}`;
};
