export function generateSessionID(prefix = "PEACE") {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}
