/**
 * @file components/admin/AuditLogItem.tsx
 * @description Single audit log row for the audit logs screen.
 *
 * Renders action badge, entity type, admin name, and relative timestamp.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { AdminAuditLog } from '../../types/admin';

interface AuditLogItemProps {
  log: AdminAuditLog;
}

const ACTION_COLORS: Record<string, string> = {
  approve: Colors.success,
  reject: Colors.error,
  verify: Colors.secondary,
  publish: Colors.success,
  unpublish: Colors.warning,
  delete: Colors.error,
  create: Colors.primary,
  update: Colors.accent,
  feature: Colors.accent,
  unfeature: Colors.textSecondary,
  set_bestseller: Colors.accent,
  unset_bestseller: Colors.textSecondary,
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.startsWith(k));
  return key ? (ACTION_COLORS[key] ?? Colors.textSecondary) : Colors.textSecondary;
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AuditLogItem({ log }: AuditLogItemProps): React.ReactElement {
  const actionColor = getActionColor(log.action);
  const adminName = log.admin?.full_name ?? log.admin?.email ?? log.admin_id.slice(0, 8);
  const metaKeys = Object.keys(log.metadata).filter((k) => k !== 'note');

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.actionBadge, { backgroundColor: `${actionColor}18` }]}>
          <Text style={[styles.actionText, { color: actionColor }]}>
            {formatAction(log.action)}
          </Text>
        </View>
        <Text style={styles.entityText}>
          {log.entity_type}
          {log.entity_id ? (
            <Text style={styles.entityId}> · {log.entity_id.slice(0, 8)}…</Text>
          ) : null}
        </Text>
        {metaKeys.length > 0 && (
          <Text style={styles.metaText} numberOfLines={1}>
            {metaKeys.map((k) => `${k}: ${String(log.metadata[k])}`).join('  ·  ')}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.adminText}>{adminName}</Text>
        <Text style={styles.timeText}>{relativeTime(log.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entityText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  entityId: {
    color: Colors.textLight,
    fontWeight: '400',
    fontSize: 12,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  adminText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    maxWidth: 100,
    textAlign: 'right',
  },
  timeText: {
    fontSize: 11,
    color: Colors.textLight,
  },
});
