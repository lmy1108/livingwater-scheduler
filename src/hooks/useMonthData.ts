'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MonthData, AvailabilityEntry, Period, Status } from '@/lib/types';
import { setAvailability, clearAvailability } from '@/lib/actions';

async function fetchMonth(ym: string): Promise<MonthData> {
  const res = await fetch(`/api/month?ym=${ym}`);
  if (!res.ok) throw new Error('Failed to fetch month data');
  return res.json();
}

export function useMonthData(ym: string) {
  return useQuery({
    queryKey: ['month', ym],
    queryFn: () => fetchMonth(ym),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useSetAvailability(ym: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      memberId: number;
      date: string;
      periods: Period[];
      status: Status;
      note?: string;
      actorName: string;
    }) => setAvailability(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['month', ym] });
      const previous = queryClient.getQueryData<MonthData>(['month', ym]);

      queryClient.setQueryData<MonthData>(['month', ym], (old) => {
        if (!old) return old;
        const newEntries = [...old.entries];

        for (const period of input.periods) {
          const idx = newEntries.findIndex(
            e => e.memberId === input.memberId && e.date === input.date && e.period === period,
          );
          const entry: AvailabilityEntry = {
            memberId: input.memberId,
            date: input.date,
            period,
            status: input.status,
            note: input.note || null,
            updatedBy: input.actorName,
            updatedAt: new Date().toISOString(),
          };
          if (idx >= 0) {
            newEntries[idx] = entry;
          } else {
            newEntries.push(entry);
          }
        }

        return { ...old, entries: newEntries };
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['month', ym], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['month', ym] });
    },
  });
}

export function useClearAvailability(ym: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      memberId: number;
      date: string;
      periods: Period[];
    }) => clearAvailability(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['month', ym] });
      const previous = queryClient.getQueryData<MonthData>(['month', ym]);

      queryClient.setQueryData<MonthData>(['month', ym], (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.filter(
            e => !(e.memberId === input.memberId && e.date === input.date && input.periods.includes(e.period)),
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['month', ym], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['month', ym] });
    },
  });
}
