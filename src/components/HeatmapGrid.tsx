'use client';

import { useMemo } from 'react';
import type { AvailabilityEntry } from '@/lib/types';
import { getMonthDays, getStartDayOfWeek, getToday } from '@/lib/date-utils';
import DayCell from './DayCell';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

interface Props {
  ym: string;
  entries: AvailabilityEntry[];
  totalMembers: number;
  onDayClick: (date: string) => void;
}

export default function HeatmapGrid({ ym, entries, totalMembers, onDayClick }: Props) {
  const days = useMemo(() => getMonthDays(ym), [ym]);
  const startOffset = useMemo(() => getStartDayOfWeek(ym), [ym]);
  const today = getToday();

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-xs text-gray-500 py-1 font-medium">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(date => (
          <DayCell
            key={date}
            date={date}
            entries={entries}
            totalMembers={totalMembers}
            isToday={date === today}
            onClick={() => onDayClick(date)}
          />
        ))}
      </div>
    </div>
  );
}
