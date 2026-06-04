import { badgeStyle } from '../../styles/tokens.js';

const colorMap = {
  pending: 'orange',
  lid: 'blue',
  beheerder: 'green',
  admin: 'red',
};

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function RoleBadge({ role }) {
  const color = colorMap[role] || 'blue';
  return <span style={badgeStyle(color)}>{capitalize(role)}</span>;
}
