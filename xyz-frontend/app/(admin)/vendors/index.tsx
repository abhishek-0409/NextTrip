/**
 * @file app/(admin)/vendors/index.tsx
 * @description Admin vendor list with status filtering and search.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { useAdminVendors } from '../../../hooks/admin/useAdminVendors';
import type { AdminVendor } from '../../../types/admin';

type VendorStatus = 'pending' | 'approved' | 'rejected';

const STATUS_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as VendorStatus },
  { label: 'Approved', value: 'approved' as VendorStatus },
  { label: 'Rejected', value: 'rejected' as VendorStatus },
];

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  approved: Colors.success,
  rejected: Colors.error,
};

function VendorRow({ vendor }: { vendor: AdminVendor }): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/vendors/${vendor.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>{vendor.name}</Text>
        <Text style={styles.rowOwner} numberOfLines={1}>
          {vendor.owner?.full_name ?? vendor.owner?.email ?? '—'}
        </Text>
        <Text style={styles.rowStats}>
          {vendor.total_packages} packages · ⭐ {vendor.avg_rating.toFixed(1)}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[vendor.status] ?? Colors.textLight}18` }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[vendor.status] ?? Colors.textLight }]}>
            {vendor.status}
          </Text>
        </View>
        {vendor.is_verified && (
          <Text style={styles.verifiedBadge}>✓ Verified</Text>
        )}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminVendorsScreen(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page] = useState(1);

  const { data, isLoading, isError, refetch } = useAdminVendors({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    page,
    limit: 30,
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vendors</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors…"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Filter tabs */}
      <StatusFilterTabs
        tabs={STATUS_TABS}
        selected={statusFilter}
        onSelect={setStatusFilter}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load vendors</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VendorRow vendor={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          }
          ListFooterComponent={
            data ? (
              <Text style={styles.countText}>{data.total} vendors total</Text>
            ) : null
          }
          contentContainerStyle={{ flexGrow: 1 }}
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
  searchRow: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowMain: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowOwner: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowStats: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  verifiedBadge: { fontSize: 10, color: Colors.success, fontWeight: '600' },
  chevron: { fontSize: 20, color: Colors.textLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
});
