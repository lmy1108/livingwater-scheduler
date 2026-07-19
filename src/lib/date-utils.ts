import { parse, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

export function parseLocalDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatYearMonth(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function parseYearMonth(ym: string): Date {
  return parse(ym, 'yyyy-MM', new Date());
}

export function getMonthDays(ym: string): string[] {
  const monthStart = startOfMonth(parseYearMonth(ym));
  const monthEnd = endOfMonth(monthStart);
  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(formatDate);
}

export function getStartDayOfWeek(ym: string): number {
  return getDay(startOfMonth(parseYearMonth(ym)));
}

export function nextMonth(ym: string): string {
  return formatYearMonth(addMonths(parseYearMonth(ym), 1));
}

export function prevMonth(ym: string): string {
  return formatYearMonth(subMonths(parseYearMonth(ym), 1));
}

export function getToday(): string {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
}

export function formatMonthLabel(ym: string): string {
  const d = parseYearMonth(ym);
  return format(d, 'yyyy年M月');
}
