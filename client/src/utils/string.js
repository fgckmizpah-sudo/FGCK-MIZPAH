export function titleCase(value) {
  if (!value || typeof value !== 'string') return value;
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
