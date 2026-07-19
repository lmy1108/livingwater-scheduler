'use client';

import { useMemo } from 'react';
import type { AvailabilityEntry } from '@/lib/types';
import { aggregateDay } from '@/lib/aggregation';
import { parseLocalDate } from '@/lib/date-utils';
import { format } from 'date-fns';

interface Props {
  date: string;
  entries: AvailabilityEntry[];
  totalMembers: number;
  isToday: boolean;
  onClick: () => void;
}

export default function DayCell({ date, entries, totalMembers, isToday, onClick }: Props) {
  const { am, pm } = useMemo(
    () => aggregateDay(entries, date, totalMembers),
    [entries, date, totalMembers],
  );

  const dayNum = format(parseLocalDate(date), 'd');
  const sameColor = am.colorClass === pm.colorClass;
  const sameDashed = am.dashed === pm.dashed;
  const uniform = sameColor && sameDashed;

  const dayCounts = useMemo(() => {
    const memberStatuses = new Map<number, Set<string>>();
    for (const e of entries) {
      if (e.date !== date) continue;
      if (!memberStatuses.has(e.memberId)) memberStatuses.set(e.memberId, new Set());
      memberStatuses.get(e.memberId)!.add(e.status);
    }
    let free = 0, busy = 0;
    for (const statuses of memberStatuses.values()) {
      if (!statuses.has('BUSY') && statuses.has('FREE')) free++;
      else if (statuses.has('BUSY') && !statuses.has('FREE')) busy++;
      else if (statuses.has('BUSY') && statuses.has('FREE')) busy++;
    }
    return { free, busy, responded: memberStatuses.size };
  }, [entries, date]);

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        min-h-[52px] rounded-lg transition-all
        hover:ring-2 hover:ring-green-400 active:scale-95
        ${isToday ? 'ring-2 ring-blue-500' : ''}
        ${uniform && am.dashed ? 'border border-dashed border-green-600' : ''}
        overflow-hidden
      `}
    >
      {uniform ? (
        <div className={`absolute inset-0 ${am.colorClass}`} />
      ) : (
        <>
          <div className={`absolute inset-x-0 top-0 h-1/2 ${am.colorClass} ${am.dashed ? 'border-b border-dashed border-green-600' : ''}`} />
          <div className={`absolute inset-x-0 bottom-0 h-1/2 ${pm.colorClass} ${pm.dashed ? 'border-t border-dashed border-green-600' : ''}`} />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-0.5 py-1">
        <span className="text-sm font-medium leading-none">{dayNum}</span>
        {totalMembers > 0 && dayCounts.responded > 0 && (
          <span className="text-[10px] leading-none opacity-80">
            {dayCounts.free > 0 && <>{dayCounts.free}&#10003;</>}
            {dayCounts.busy > 0 && <>{dayCounts.free > 0 ? ' ' : ''}{dayCounts.busy}&#10007;</>}
          </span>
        )}
        {totalMembers > 0 && (
          <div className="w-6 h-0.5 bg-gray-300/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-600/60 rounded-full"
              style={{ width: `${(dayCounts.responded / totalMembers) * 100}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
}
