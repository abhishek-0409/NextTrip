/**
 * @file app/(admin)/audit-logs.tsx
 * @description Read-only admin audit log viewer with entity-type and action filtering.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { StatusFilterTabs } from '../../components/dashboard/StatusFilterTabs';
import { AuditLogItem } from '../../components/admin/AuditLogItem';
import { useAdminAuditLogs } from '../../hooks/admin/useAdminAuditLogs';

type EntityFilter = 'all' | 'vendor' | 'package' | 'booking' | 'review' | 'category' | 'location' | 'payout' | 'user';

const ENTITY_TABS = [
  { label: 'All', value: 'all' as EntityFilter },
  { label: 'Vendors', value: 'vendor' as EntityFilter },
  { label: 'Packages', value: 'package' as EntityFilter },
  { label: 'Bookings', value: 'booking' as EntityFilter },
  { label: 'Reviews', value: 'review' as EntityFilter },
  { label: 'Users', value: 'user' as EntityFilter },
  { label: 'Categories', value: 'category' as EntityFilter },
  { label: 'Locations', value: 'location' as EntityFilter },
  { label: 'Payouts', value: 'payout' as EntityFilter },
];

export default function AdminAuditLogsScreen(): React.ReactElement {
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [page, setPage] = useState(1);

  const queryParams = {
    entity_type: entityFilter === 'all' ? undefined : entityFilter,
    page,
    limit: 30,
  };

  const { data, isLoading, isError, refetch, isFetching } = useAdminAuditLogs(queryParams);

  const logs = data?.items ?? [];
  const hasMore = data?.has_more ?? false;

  // Reset to page 1 when filter changes
  const handleFilterChange = (val: EntityFilter) => {
    setEntityFilter(val);
    setPage(1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Audit Logs</Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          style={styles.refreshBtn}
          disabled={isFetching}
        >
          <Text style={[styles.refreshText, isFetching && { opacity: 0.4 }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>
          Read-only · Records every admin action across the platform
        </Text>
      </View>

      <StatusFilterTabs tabs={ENTITY_TABS} selected={entityFilter} onSelect={handleFilterChange} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load audit logs</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AuditLogItem log={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No audit logs found</Text>
              {entityFilter !== 'all' && (
                <Text style={styles.emptyHint}>Try selecting "All" to see all logs</Text>
              )}
            </View>
          }
          ListFooterComponent={
            logs.length > 0 ? (
              <View style={styles.footer}>
                {data && (
                  <Text style={styles.countText}>
                    Showing {logs.length} of {data.total} logs
                  </Text>
                )}
                {hasMore && (
                  <View style={styles.paginationRow}>
                    {page > 1 && (
                      <TouchableOpacity
                        style={styles.pageBtn}
                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={isFetching}
                      >
                        <Text style={styles.pageBtnText}>‹ Previous</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.pageBtn, styles.pageBtnPrimary]}
                      onPress={() => setPage((p) => p + 1)}
                      disabled={isFetching || !hasMore}
                    >
                      {isFetching ? (
                        <ActivityIndicator size="small" color={Colors.textWhite} />
                      ) : (
                        <Text style={styles.pageBtnPrimaryText}>Next ›</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                {!hasMore && page > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      style={styles.pageBtn}
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={isFetching}
                    >
                      <Text style={styles.pageBtnText}>‹ Previous</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.pageText}>Page {page}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ flexGrow: 1 }}
          backgroundColor={Colors.surface}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  refreshBtn: { width: 60, alignItems: 'flex-end' },
  refreshText: { fontSize: 20, color: Colors.primary, fontWeight: '700' },
  subtitleRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSoft,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subtitle: { fontSize: 11, color: Colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: Colors.textLight, fontSize: 14, marginBottom: 4 },
  emptyHint: { color: Colors.textLight, fontSize: 12 },
  footer: { padding: 16, gap: 10, backgroundColor: Colors.surface },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12 },
  paginationRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 100,
    alignItems: 'center',
  },
  pageBtnText: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  pageBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageBtnPrimaryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  pageText: { textAlign: 'center', color: Colors.textLight, fontSize: 11 },
});
