/**
 * Helper to recursively remove undefined fields and convert unsupported values
 * before saving to Firebase Firestore.
 */
function isPlainObject(val: unknown): val is Record<string, any> {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) =>
        isPlainObject(item) || Array.isArray(item) ? cleanFirestoreData(item) : item
      ) as unknown as T;
  }

  if (!isPlainObject(obj)) {
    // Preserve Firestore FieldValue sentinels (increment, serverTimestamp, etc.), Date, and Timestamp
    return obj;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Firestore rejects undefined
    } else if (Array.isArray(value) || isPlainObject(value)) {
      result[key] = cleanFirestoreData(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
