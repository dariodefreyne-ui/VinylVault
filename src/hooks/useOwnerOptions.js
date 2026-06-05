import { useMemo } from 'react';
import { useUsers } from './useUsers.js';
import { useRecords } from './useRecords.js';
import { buildOwnerOptions } from '../utils/owners.js';

/**
 * Levert de selecteerbare eigenaren voor formulieren: geregistreerde gebruikers
 * gecombineerd met legacy owner-labels die in records voorkomen (bv. 'Dario',
 * 'Papa'). Resultaat: [{ label, uid }].
 */
export function useOwnerOptions() {
  const { users } = useUsers();
  const { records } = useRecords();

  return useMemo(
    () => buildOwnerOptions(users, records),
    [users, records]
  );
}
