'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMonthData, useSetAvailability, useClearAvailability } from '@/hooks/useMonthData';
import { useIdentity } from '@/hooks/useIdentity';
import { formatYearMonth, nextMonth, prevMonth } from '@/lib/date-utils';
import type { Period, Status } from '@/lib/types';
import IdentityPicker from './IdentityPicker';
import MonthNav from './MonthNav';
import Legend from './Legend';
import HeatmapGrid from './HeatmapGrid';
import DayDrawer from './DayDrawer';

export default function CalendarPage() {
  const [ym, setYm] = useState(() => formatYearMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { identity, setIdentity, clearIdentity, loaded } = useIdentity();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useMonthData(ym);
  const setAvail = useSetAvailability(ym);
  const clearAvail = useClearAvailability(ym);

  const handlePrev = useCallback(() => {
    const prev = prevMonth(ym);
    setYm(prev);
    queryClient.prefetchQuery({ queryKey: ['month', prevMonth(prev)], queryFn: () => fetch(`/api/month?ym=${prevMonth(prev)}`).then(r => r.json()) });
  }, [ym, queryClient]);

  const handleNext = useCallback(() => {
    const next = nextMonth(ym);
    setYm(next);
    queryClient.prefetchQuery({ queryKey: ['month', nextMonth(next)], queryFn: () => fetch(`/api/month?ym=${nextMonth(next)}`).then(r => r.json()) });
  }, [ym, queryClient]);

  const handleSave = useCallback((memberId: number, periods: Period[], status: Status, note?: string) => {
    if (!identity || !selectedDate) return;
    setAvail.mutate({
      memberId,
      date: selectedDate,
      periods,
      status,
      note,
      actorName: identity.name,
    });
  }, [identity, selectedDate, setAvail]);

  const handleClear = useCallback((memberId: number, periods: Period[]) => {
    if (!selectedDate) return;
    clearAvail.mutate({ memberId, date: selectedDate, periods });
  }, [selectedDate, clearAvail]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!identity) {
    return (
      <IdentityPicker
        members={data?.members || []}
        onSelect={setIdentity}
        onMemberCreated={() => queryClient.invalidateQueries({ queryKey: ['month', ym] })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-green-700">活水日历</h1>
        <button
          onClick={clearIdentity}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data?.members.find(m => m.id === identity.id)?.color || '#888' }}
          />
          <span>{identity.name}</span>
          <span className="text-xs text-gray-400">切换</span>
        </button>
      </header>

      <main className="max-w-lg mx-auto px-3 pb-24 md:max-w-5xl md:flex md:gap-6 md:px-6">
        <div className="flex-1">
          <MonthNav ym={ym} onPrev={handlePrev} onNext={handleNext} />
          <Legend />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              加载失败，请刷新重试
            </div>
          ) : data ? (
            <>
              {data.members.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p>还没有任何成员</p>
                  <button
                    onClick={clearIdentity}
                    className="mt-2 text-green-600 underline"
                  >
                    创建第一个名字
                  </button>
                </div>
              ) : (
                <HeatmapGrid
                  ym={ym}
                  entries={data.entries}
                  totalMembers={data.members.length}
                  onDayClick={setSelectedDate}
                />
              )}

              {data.entries.length === 0 && data.members.length > 0 && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  还没有人标记本月，点击日期开始标记
                </p>
              )}
            </>
          ) : null}
        </div>

        {selectedDate && data && (
          <div className="md:w-96 md:shrink-0 md:pt-12">
            <DayDrawer
              date={selectedDate}
              members={data.members}
              entries={data.entries}
              currentMemberId={identity.id}
              currentMemberName={identity.name}
              onClose={() => setSelectedDate(null)}
              onSave={handleSave}
              onClear={handleClear}
            />
          </div>
        )}
      </main>
    </div>
  );
}
