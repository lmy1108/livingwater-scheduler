'use client';

import { useState, useEffect } from 'react';
import type { AvailabilityEntry, Status, Period } from '@/lib/types';

interface Props {
  memberId: number;
  date: string;
  entries: AvailabilityEntry[];
  onSave: (periods: Period[], status: Status, note?: string) => void;
  onClear: (periods: Period[]) => void;
}

type PeriodMode = 'FULL' | 'AM' | 'PM';

export default function InlineEditor({ memberId, date, entries, onSave, onClear }: Props) {
  const amEntry = entries.find(e => e.memberId === memberId && e.date === date && e.period === 'AM');
  const pmEntry = entries.find(e => e.memberId === memberId && e.date === date && e.period === 'PM');

  const hasAm = !!amEntry;
  const hasPm = !!pmEntry;
  const sameStatus = hasAm && hasPm && amEntry.status === pmEntry.status;

  const initialPeriod: PeriodMode = (hasAm && hasPm) ? 'FULL' : hasAm ? 'AM' : hasPm ? 'PM' : 'FULL';
  const initialStatus: Status | null = sameStatus ? amEntry!.status : hasAm ? amEntry!.status : hasPm ? pmEntry!.status : null;
  const initialNote = amEntry?.note || pmEntry?.note || '';

  const [periodMode, setPeriodMode] = useState<PeriodMode>(initialPeriod);
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setPeriodMode(initialPeriod);
    setStatus(initialStatus);
    setNote(initialNote);
  }, [memberId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    if (!status) return;
    const periods: Period[] = periodMode === 'FULL' ? ['AM', 'PM'] : [periodMode];
    onSave(periods, status, note || undefined);
  }

  function handleClear() {
    const periods: Period[] = periodMode === 'FULL' ? ['AM', 'PM'] : [periodMode];
    onClear(periods);
  }

  const statusOptions: { value: Status; label: string; activeClass: string }[] = [
    { value: 'FREE', label: '有空', activeClass: 'bg-green-600 text-white' },
    { value: 'UNSURE', label: '不确定', activeClass: 'bg-yellow-500 text-white' },
    { value: 'BUSY', label: '忙碌', activeClass: 'bg-red-500 text-white' },
  ];

  const periodOptions: { value: PeriodMode; label: string }[] = [
    { value: 'FULL', label: '全天' },
    { value: 'AM', label: '上午' },
    { value: 'PM', label: '下午' },
  ];

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              status === opt.value ? opt.activeClass : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {periodOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriodMode(opt.value)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              periodMode === opt.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="原因（可选，最多50字）"
        maxLength={50}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!status}
          className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          保存
        </button>
        {(hasAm || hasPm) && (
          <button
            onClick={handleClear}
            className="px-4 py-2.5 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            清除
          </button>
        )}
      </div>
    </div>
  );
}
