export const MEMBER_PALETTE = [
  '#E8654F', '#E89B4F', '#D4C34A', '#6BBF6A',
  '#4ABFBF', '#4A8FD4', '#7B68C8', '#C864C8',
  '#E86482', '#8B6B4A', '#6B8B6B', '#4A6B8B',
] as const;

export function assignColor(existingColors: string[]): string {
  const used = new Set(existingColors);
  for (const c of MEMBER_PALETTE) {
    if (!used.has(c)) return c;
  }
  return MEMBER_PALETTE[existingColors.length % MEMBER_PALETTE.length];
}
