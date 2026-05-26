/**
 * @file services/auditLogService.ts
 * @description Immutable audit trail for all admin mutations.
 *
 * Every admin action that changes data must call logAdminAction().
 * Logs are never hard-deleted; they are append-only.
 *
 * Entity types (by convention):
 *  'user', 'vendor', 'package', 'booking', 'review',
 *  'category', 'location', 'payout', 'payout_account'
 */

import { supabaseAdmin } from '../lib/supabase';
import type { PaginatedResponse } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin?: {
    full_name: string | null;
    email: string;
  };
}

export interface LogAdminActionInput {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const readString = (r: Record<string, unknown>, k: string, fb = ''): string =>
  typeof r[k] === 'string' ? (r[k] as string) : fb;

const readNullableString = (r: Record<string, unknown>, k: string): string | null =>
  typeof r[k] === 'string' ? (r[k] as string) : null;

const toRecord = (v: unknown): Record<string, unknown> =>
  isRecord(v) ? v : Array.isArray(v) && isRecord(v[0]) ? (v[0] as Record<string, unknown>) : {};

const mapAuditLog = (row: Record<string, unknown>): AuditLog => {
  const adminRaw = toRecord(row['admin']);
  return {
    id: readString(row, 'id'),
    // Actual DB column is actor_user_id; surface as admin_id to keep the API contract stable.
    admin_id: readString(row, 'actor_user_id'),
    action: readString(row, 'action'),
    entity_type: readString(row, 'entity_type'),
    entity_id: readNullableString(row, 'entity_id'),
    metadata: isRecord(row['metadata']) ? (row['metadata'] as Record<string, unknown>) : {},
    created_at: readString(row, 'created_at'),
    ...(Object.keys(adminRaw).length > 0
      ? {
          admin: {
            full_name: readNullableString(adminRaw, 'full_name'),
            email: readString(adminRaw, 'email'),
          },
        }
      : {}),
  };
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Appends one audit log record.
 * Fire-and-forget safe: errors are logged to console but never thrown
 * so they cannot break the calling mutation.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('admin_audit_logs').insert({
      actor_user_id: input.adminId,   // actual column name
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });

    if (error !== null) {
      console.error('[auditLogService.logAdminAction]', error);
    }
  } catch (err) {
    console.error('[auditLogService.logAdminAction] unexpected error', err);
  }
}

/**
 * Returns paginated audit logs with admin user info, newest first.
 * Supports filtering by admin, entity type/id, action prefix, and date range.
 */
export async function getAuditLogs(params: {
  page: number;
  limit: number;
  adminId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PaginatedResponse<AuditLog>> {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  let query = supabaseAdmin
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.adminId) query = query.eq('actor_user_id', params.adminId);
  if (params.entityType) query = query.eq('entity_type', params.entityType);
  if (params.entityId) query = query.eq('entity_id', params.entityId);
  if (params.action) query = query.ilike('action', `${params.action}%`);
  if (params.fromDate) query = query.gte('created_at', `${params.fromDate}T00:00:00Z`);
  if (params.toDate) query = query.lte('created_at', `${params.toDate}T23:59:59Z`);

  const { data, error, count } = await query;

  if (error !== null) {
    console.error('[auditLogService.getAuditLogs]', error);
    throw new Error('Unable to fetch audit logs');
  }

  const rows = (data as unknown[] | null) ?? [];
  const total = count ?? 0;
  const actorIds = Array.from(
    new Set(
      rows
        .map((r) => readString(toRecord(r), 'actor_user_id'))
        .filter((id) => id.length > 0),
    ),
  );

  const adminById = new Map<string, Record<string, unknown>>();
  if (actorIds.length > 0) {
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', actorIds);

    if (adminsError !== null) {
      console.error('[auditLogService.getAuditLogs.admins]', adminsError);
    } else {
      ((admins as unknown[] | null) ?? []).forEach((admin) => {
        const record = toRecord(admin);
        const id = readString(record, 'id');
        if (id.length > 0) adminById.set(id, record);
      });
    }
  }

  return {
    items: rows.map((r) => {
      const record = toRecord(r);
      const admin = adminById.get(readString(record, 'actor_user_id'));
      return mapAuditLog(admin ? { ...record, admin } : record);
    }),
    total,
    page: params.page,
    limit: params.limit,
    has_more: from + rows.length < total,
  };
}
