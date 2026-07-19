import type { AvailabilityEntry, DayAggregation, Period } from './types';

export function aggregatePeriod(
  entries: AvailabilityEntry[],
  date: string,
  period: Period,
  totalMembers: number,
): DayAggregation {
  const matching = entries.filter(e => e.date === date && e.period === period);
  const free = matching.filter(e => e.status === 'FREE').length;
  const busy = matching.filter(e => e.status === 'BUSY').length;
  const unsure = matching.filter(e => e.status === 'UNSURE').length;
  const responded = free + busy + unsure;
  const responseRatio = totalMembers > 0 ? responded / totalMembers : 0;
  const availRatio = responded > 0 ? free / responded : null;

  return {
    free,
    busy,
    unsure,
    responded,
    total: totalMembers,
    availRatio,
    responseRatio,
    ...getColorInfo(availRatio, responded, totalMembers),
  };
}

function getColorInfo(
  availRatio: number | null,
  responded: number,
  total: number,
): { colorClass: string; dashed: boolean } {
  if (responded === 0 || availRatio === null) {
    return { colorClass: 'bg-gray-200', dashed: false };
  }
  if (availRatio >= 0.8 && responded >= total * 0.5) {
    return { colorClass: 'bg-green-700 text-white', dashed: false };
  }
  if (availRatio >= 0.8) {
    return { colorClass: 'bg-green-200', dashed: true };
  }
  if (availRatio >= 0.5) {
    return { colorClass: 'bg-green-200', dashed: false };
  }
  if (availRatio >= 0.2) {
    return { colorClass: 'bg-yellow-200', dashed: false };
  }
  return { colorClass: 'bg-red-200', dashed: false };
}

export function aggregateDay(
  entries: AvailabilityEntry[],
  date: string,
  totalMembers: number,
): { am: DayAggregation; pm: DayAggregation } {
  return {
    am: aggregatePeriod(entries, date, 'AM', totalMembers),
    pm: aggregatePeriod(entries, date, 'PM', totalMembers),
  };
}
