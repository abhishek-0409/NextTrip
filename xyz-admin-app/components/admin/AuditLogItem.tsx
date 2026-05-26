/**
 * @file components/admin/AuditLogItem.tsx
 * Compact audit log row with action, entity, actor, metadata, and timestamp.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
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
  update: Colors.secondary,
  feature: Colors.accent,
  unfeature: Colors.textSecondary,
  set_bestseller: Colors.accent,
  unset_bestseller: Colors.textSecondary,
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.startsWith(k));
  return key ? (ACTION_COLORS[key] ?? Colors.textSecondary) : Colors.textSecondary;
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(isoDate: string): string {
  const ts = new Date(isoDate).getTime();
  if (!Number.isFinite(ts)) return 'Unknown time';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AuditLogItem({ log }: AuditLogItemProps): React.ReactElement {
  const actionColor = getActionColor(log.action);
  const adminName = log.admin?.full_name ?? log.admin?.email ?? log.admin_id.slice(0, 8);
  const metaKeys = Object.keys(log.metadata ?? {}).filter((k) => k !== 'note');
  const entityId = log.entity_id ? log.entity_id.slice(0, 8) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.actionRail, { backgroundColor: actionColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.actionBadge, { backgroundColor: `${actionColor}18` }]}>
            <Text style={[styles.actionText, { color: actionColor }]}>
              {titleCase(log.action)}
            </Text>
          </View>
          <Text style={styles.timeText}>{relativeTime(log.created_at)}</Text>
        </View>

        <Text style={styles.entityText} numberOfLines={1}>
          {titleCase(log.entity_type)}
          {entityId ? <Text style={styles.entityId}> / {entityId}</Text> : null}
        </Text>

        <Text style={styles.actorText} numberOfLines={1}>
          By {adminName}
        </Text>

        {metaKeys.length > 0 && (
          <Text style={styles.metaText} numberOfLines={1}>
            {metaKeys.map((k) => `${k}: ${String(log.metadata[k])}`).join('  |  ')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  actionRail: {
    width: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  actionText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: FontWeight.medium,
  },
  entityText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  entityId: {
    color: Colors.textLight,
    fontWeight: FontWeight.medium,
    fontSize: 12,
  },
  actorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 17,
  },
});
