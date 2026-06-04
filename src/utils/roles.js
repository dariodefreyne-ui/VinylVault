export const ROLES = {
  PENDING: 'pending',
  LID: 'lid',
  BEHEERDER: 'beheerder',
  ADMIN: 'admin',
};

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

export function isBeheerder(role) {
  return role === ROLES.BEHEERDER || role === ROLES.ADMIN;
}

export function isActivated(role) {
  return role !== null && role !== undefined && role !== ROLES.PENDING;
}
