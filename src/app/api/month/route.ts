import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, availability } from '@/lib/db/schema';
import { and, gte, lte } from 'drizzle-orm';
import { getMonthDays } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const ym = request.nextUrl.searchParams.get('ym');
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: 'Invalid ym parameter' }, { status: 400 });
  }

  const days = getMonthDays(ym);
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const [allMembers, entries] = await Promise.all([
    db.select({
      id: members.id,
      name: members.name,
      color: members.color,
    }).from(members).orderBy(members.id),
    db.select({
      memberId: availability.memberId,
      date: availability.date,
      period: availability.period,
      status: availability.status,
      note: availability.note,
      updatedBy: availability.updatedBy,
      updatedAt: availability.updatedAt,
    }).from(availability)
      .where(and(
        gte(availability.date, firstDay),
        lte(availability.date, lastDay),
      )),
  ]);

  return NextResponse.json(
    {
      members: allMembers,
      entries: entries.map(e => ({
        ...e,
        updatedAt: e.updatedAt.toISOString(),
      })),
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
