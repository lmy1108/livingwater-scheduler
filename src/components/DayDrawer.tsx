'use client';

import { useState, useMemo } from 'react';
import type { Member, AvailabilityEntry, Period, Status } from '@/lib/types';
import { parseLocalDate } from '@/lib/date-utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import InlineEditor from './InlineEditor';

interface Props {
  date: string;
  members: Member[];
  entries: AvailabilityEntry[];
  currentMemberId: number | null;
  currentMemberName: string;
  onClose: () => void;
  onSave: (memberId: number, periods: Period[], status: Status, note?: string) => void;
  onClear: (memberId: number, periods: Period[]) => void;
}

type MemberGroup = 'BUSY' | 'UNSURE' | 'FREE' | 'NONE';

function getGroupLabel(group: MemberGroup): string {
  switch (group) {
    case 'BUSY': return '忙碌';
    case 'UNSURE': return '不确定';
    case 'FREE': return '有空';
    case 'NONE': return '未回应';
  }
}

function getGroupEmoji(group: MemberGroup): string {
  switch (group) {
    case 'BUSY': return '✗';
    case 'UNSURE': return '?';
    case 'FREE': return '✓';
    case 'NONE': return '—';
  }
}

function getMemberStatus(entries: AvailabilityEntry[], memberId: number, date: string): MemberGroup {
  const memberEntries = entries.filter(e => e.memberId === memberId && e.date === date);
  if (memberEntries.length === 0) return 'NONE';
  if (memberEntries.some(e => e.status === 'BUSY')) return 'BUSY';
  if (memberEntries.some(e => e.status === 'UNSURE')) return 'UNSURE';
  return 'FREE';
}

function getStatusBadge(entries: AvailabilityEntry[], memberId: number, date: string): string {
  const am = entries.find(e => e.memberId === memberId && e.date === date && e.period === 'AM');
  const pm = entries.find(e => e.memberId === memberId && e.date === date && e.period === 'PM');

  const parts: string[] = [];
  if (am) parts.push(`上午: ${am.status === 'FREE' ? '有空' : am.status === 'BUSY' ? '忙碌' : '不确定'}`);
  if (pm) parts.push(`下午: ${pm.status === 'FREE' ? '有空' : pm.status === 'BUSY' ? '忙碌' : '不确定'}`);
  return parts.join(' | ');
}

function getMemberNote(entries: AvailabilityEntry[], memberId: number, date: string): string | null {
  const notes = entries
    .filter(e => e.memberId === memberId && e.date === date && e.note)
    .map(e => e.note);
  return notes.length > 0 ? notes[0] : null;
}

export default function DayDrawer({ date, members, entries, currentMemberId, currentMemberName, onClose, onSave, onClear }: Props) {
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  const dateLabel = format(parseLocalDate(date), 'M月d日 EEEE', { locale: zhCN });

  const groupedMembers = useMemo(() => {
    const groups: Record<MemberGroup, Member[]> = { BUSY: [], UNSURE: [], FREE: [], NONE: [] };
    for (const m of members) {
      if (m.id === currentMemberId) continue;
      const status = getMemberStatus(entries, m.id, date);
      groups[status].push(m);
    }
    return groups;
  }, [members, entries, date, currentMemberId]);

  const currentMember = members.find(m => m.id === currentMemberId);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 md:static md:inset-auto md:z-auto">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl md:shadow-lg max-h-[80vh] md:max-h-none md:h-full overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b shrink-0">
            <div>
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 md:hidden" />
              <h3 className="text-lg font-semibold">{dateLabel}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {currentMember && (
              <div className="bg-green-50 rounded-xl p-3">
                <button
                  onClick={() => setEditingMemberId(editingMemberId === currentMember.id ? null : currentMember.id)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: currentMember.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{currentMember.name}</span>
                    <span className="text-xs text-green-700 ml-2">（我）</span>
                    {getMemberStatus(entries, currentMember.id, date) !== 'NONE' && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {getStatusBadge(entries, currentMember.id, date)}
                        {getMemberNote(entries, currentMember.id, date) && (
                          <span className="ml-1 text-gray-400">· {getMemberNote(entries, currentMember.id, date)}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{editingMemberId === currentMember.id ? '▲' : '▼'}</span>
                </button>

                {editingMemberId === currentMember.id && (
                  <InlineEditor
                    memberId={currentMember.id}

                    date={date}
                    entries={entries}

                    onSave={(periods, status, note) => {
                      onSave(currentMember.id, periods, status, note);
                      setEditingMemberId(null);
                    }}
                    onClear={(periods) => {
                      onClear(currentMember.id, periods);
                      setEditingMemberId(null);
                    }}
                  />
                )}
              </div>
            )}

            {(['FREE', 'UNSURE', 'BUSY', 'NONE'] as MemberGroup[]).map(group => {
              const groupMembers = groupedMembers[group];
              if (groupMembers.length === 0) return null;
              return (
                <div key={group}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <span>{getGroupEmoji(group)}</span>
                    <span>{getGroupLabel(group)}</span>
                    <span className="text-gray-400">({groupMembers.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {groupMembers.map(m => (
                      <div key={m.id}>
                        <button
                          onClick={() => setEditingMemberId(editingMemberId === m.id ? null : m.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: m.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{m.name}</span>
                            {group !== 'NONE' && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {getStatusBadge(entries, m.id, date)}
                                {getMemberNote(entries, m.id, date) && (
                                  <span className="ml-1 text-gray-400">· {getMemberNote(entries, m.id, date)}</span>
                                )}
                              </p>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs">{editingMemberId === m.id ? '▲' : '▼'}</span>
                        </button>

                        {editingMemberId === m.id && (
                          <div className="px-3 pb-2">
                            <InlineEditor
                              memberId={m.id}

                              date={date}
                              entries={entries}
          
                              onSave={(periods, status, note) => {
                                onSave(m.id, periods, status, note);
                                setEditingMemberId(null);
                              }}
                              onClear={(periods) => {
                                onClear(m.id, periods);
                                setEditingMemberId(null);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
