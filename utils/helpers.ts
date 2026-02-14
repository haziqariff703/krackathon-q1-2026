// Small, reusable helpers for UI and formatting.
export function formatShortDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function clampText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}\u2026`;
}
