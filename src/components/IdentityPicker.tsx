'use client';

import { useState } from 'react';
import type { Member } from '@/lib/types';
import { createMember } from '@/lib/actions';

interface Props {
  members: Member[];
  onSelect: (member: { id: number; name: string }) => void;
  onMemberCreated: () => void;
}

export default function IdentityPicker({ members, onSelect, onMemberCreated }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setError('');
    setSubmitting(true);
    const result = await createMember(newName.trim());
    setSubmitting(false);

    if ('error' in result) {
      if (result.error === 'DUPLICATE') {
        setError('该名字已存在，请从列表中选择');
      } else {
        setError('创建失败，请重试');
      }
      return;
    }

    if (result.member) {
      onSelect({ id: result.member.id, name: result.member.name });
      onMemberCreated();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-center mb-1">选择你的名字</h2>
          <p className="text-gray-500 text-center text-sm mb-5">
            选择已有名字，或创建新名字
          </p>

          {members.length > 0 && (
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => onSelect({ id: m.id, name: m.name })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-base">{m.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 text-green-600 font-medium rounded-lg border border-green-600 hover:bg-green-50 transition-colors"
              >
                + 创建新名字
              </button>
            ) : (
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="输入你的名字"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  autoFocus
                  disabled={submitting}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setError(''); setNewName(''); }}
                    className="flex-1 py-2.5 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newName.trim()}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? '创建中...' : '确认'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
