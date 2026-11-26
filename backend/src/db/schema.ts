import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('seller_workspaces', { id: text('id').primaryKey(), name: text('name').notNull(), created: text('created').notNull() });
export const members = sqliteTable('seller_members', { workspaceId: text('workspace_id').notNull(), userId: text('user_id').notNull(), email: text('email').notNull(), name: text('name').notNull(), role: text('role').notNull(), active: integer('active').notNull().default(1), joined: text('joined').notNull() }, t => [primaryKey({columns:[t.workspaceId,t.userId]})]);
export const records = sqliteTable('seller_records', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull(), kind: text('kind').notNull(), payload: text('payload').notNull(), version: integer('version').notNull().default(1), created: text('created').notNull(), updated: text('updated').notNull() });
export const invitations = sqliteTable('seller_invitations', { hash: text('hash').primaryKey(), workspaceId: text('workspace_id').notNull(), email: text('email').notNull(), role: text('role').notNull(), expires: text('expires').notNull(), used: integer('used').notNull().default(0) });
export const buyerUsers = sqliteTable('buyer_users', {
  id: text('id').primaryKey(), email: text('email').notNull().unique(), name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(), salt: text('salt').notNull(), created: text('created').notNull(),
});
export const buyerSessions = sqliteTable('buyer_sessions', {
  tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull().references(() => buyerUsers.id, { onDelete: 'cascade' }), expires: integer('expires').notNull(),
}, t => [index('buyer_sessions_user').on(t.userId)]);
export const buyerState = sqliteTable('buyer_state', {
  userId: text('user_id').primaryKey().references(() => buyerUsers.id, { onDelete: 'cascade' }), payload: text('payload').notNull(), version: integer('version').notNull().default(0),
});
export const buyerEnquiries = sqliteTable('buyer_enquiries', {
  id: text('id').primaryKey(), buyerId: text('buyer_id').notNull().references(() => buyerUsers.id, { onDelete: 'cascade' }), requestId: text('request_id').notNull(), propertyId: text('property_id').notNull(), created: text('created').notNull(),
}, t => [uniqueIndex('buyer_enquiries_request').on(t.buyerId, t.requestId), index('buyer_enquiries_user').on(t.buyerId, t.created)]);
export const buyerRateLimits = sqliteTable('buyer_rate_limits', {
  key: text('key').primaryKey(), attempts: integer('attempts').notNull(), expires: integer('expires').notNull(),
});
