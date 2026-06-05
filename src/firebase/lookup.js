import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Roept de lookupRelease Cloud Function aan.
 * @param {{ barcode?: string, catalogNumber?: string, query?: string }} params
 * @returns {Promise<{ found: boolean, result?: object }>}
 */
export async function lookupRelease(params) {
  const functions = getFunctions();
  const fn = httpsCallable(functions, 'lookupRelease');
  const res = await fn(params);
  return res.data;
}
