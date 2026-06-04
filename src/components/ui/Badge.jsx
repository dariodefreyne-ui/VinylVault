import { badgeStyle } from '../../styles/tokens.js';

export default function Badge({ color, children }) {
  return <span style={badgeStyle(color)}>{children}</span>;
}
