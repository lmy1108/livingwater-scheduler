import { pgTable, serial, varchar, date, pgEnum, uniqueIndex, index, timestamp } from 'drizzle-orm/pg-core';

export const periodEnum = pgEnum('period_t', ['AM', 'PM']);
export const statusEnum = pgEnum('status_t', ['BUSY', 'FREE', 'UNSURE']);

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 40 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('members_name_uniq').on(table.name),
]);

export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  memberId: serial('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  period: periodEnum('period').notNull(),
  status: statusEnum('status').notNull(),
  note: varchar('note', { length: 80 }),
  updatedBy: varchar('updated_by', { length: 40 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('availability_member_date_period_uniq').on(table.memberId, table.date, table.period),
  index('availability_date_idx').on(table.date),
]);
