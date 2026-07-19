'use server';

import { z } from 'zod/v4';
import { db } from './db';
import { members, availability } from './db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { assignColor } from './colors';
import { verifyPassword, setSessionCookie, isAuthenticated } from './auth';

const loginSchema = z.string().min(1);

const createMemberSchema = z.string().min(1).max(20).transform(s => s.trim());

const setAvailabilitySchema = z.object({
  memberId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periods: z.array(z.enum(['AM', 'PM'])).min(1),
  status: z.enum(['BUSY', 'FREE', 'UNSURE']),
  note: z.string().max(50).optional(),
  actorName: z.string().min(1).max(40),
});

const clearAvailabilitySchema = z.object({
  memberId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periods: z.array(z.enum(['AM', 'PM'])).min(1),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= 10;
}

export async function login(password: string, ip?: string) {
  if (ip && !checkRateLimit(ip)) {
    return { error: 'RATE_LIMITED' as const };
  }

  const parsed = loginSchema.safeParse(password);
  if (!parsed.success) {
    return { error: 'INVALID' as const };
  }

  if (!verifyPassword(parsed.data)) {
    return { error: 'WRONG_PASSWORD' as const };
  }

  await setSessionCookie();
  return { success: true };
}

export async function createMember(name: string) {
  if (!(await isAuthenticated())) {
    return { error: 'UNAUTHORIZED' as const };
  }

  const parsed = createMemberSchema.safeParse(name);
  if (!parsed.success) {
    return { error: 'INVALID_NAME' as const };
  }

  const trimmedName = parsed.data;

  const existing = await db
    .select()
    .from(members)
    .where(sql`lower(trim(${members.name})) = lower(${trimmedName})`);

  if (existing.length > 0) {
    return { error: 'DUPLICATE' as const };
  }

  const allMembers = await db.select({ color: members.color }).from(members);
  const color = assignColor(allMembers.map(m => m.color));

  const [newMember] = await db
    .insert(members)
    .values({ name: trimmedName, color })
    .returning({ id: members.id, name: members.name, color: members.color });

  return { member: newMember };
}

export async function setAvailability(input: z.input<typeof setAvailabilitySchema>) {
  if (!(await isAuthenticated())) {
    return { error: 'UNAUTHORIZED' as const };
  }

  const parsed = setAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'INVALID_INPUT' as const };
  }

  const { memberId, date, periods, status, note, actorName } = parsed.data;

  for (const period of periods) {
    await db
      .insert(availability)
      .values({
        memberId,
        date,
        period,
        status,
        note: note || null,
        updatedBy: actorName,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [availability.memberId, availability.date, availability.period],
        set: {
          status,
          note: note || null,
          updatedBy: actorName,
          updatedAt: new Date(),
        },
      });
  }

  return { success: true };
}

export async function clearAvailability(input: z.input<typeof clearAvailabilitySchema>) {
  if (!(await isAuthenticated())) {
    return { error: 'UNAUTHORIZED' as const };
  }

  const parsed = clearAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'INVALID_INPUT' as const };
  }

  const { memberId, date, periods } = parsed.data;

  await db
    .delete(availability)
    .where(
      and(
        eq(availability.memberId, memberId),
        eq(availability.date, date),
        inArray(availability.period, periods),
      ),
    );

  return { success: true };
}
