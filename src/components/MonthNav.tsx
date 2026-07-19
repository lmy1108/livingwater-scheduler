'use client';

import { formatMonthLabel } from '@/lib/date-utils';

interface Props {
  ym: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNav({ ym, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="上一月"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 className="text-lg font-semibold">{formatMonthLabel(ym)}</h2>
      <button
        onClick={onNext}
        className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="下一月"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
