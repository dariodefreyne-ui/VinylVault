import { getFunctions, httpsCallable } from 'firebase/functions';

const LOOKUP_TIMEOUT_MS = 20000;

/**
 * Roept de lookupRelease Cloud Function aan.
 * @param {{ barcode?: string, catalogNumber?: string, query?: string }} params
 * @returns {Promise<{ found: boolean, result?: object }>}
 */
export async function lookupRelease(params) {
  const functions = getFunctions();
  const fn = httpsCallable(functions, 'lookupRelease');
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('lookup-timeout')), LOOKUP_TIMEOUT_MS)
  );
  const res = await Promise.race([fn(params), timeout]);
  return res.data;
}
