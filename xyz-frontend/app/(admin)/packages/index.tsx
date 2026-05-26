/**
 * @file app/(admin)/packages/index.tsx
 * @description Admin package moderation list.
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
  Image,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { useAdminPackages } from '../../../hooks/admin/useAdminPackages';
import type { AdminPackageListItem } from '../../../types/admin';

type PkgStatus = 'draft' | 'pending' | 'active' | 'rejected';

const STATUS_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as PkgStatus },
  { label: 'Active', value: 'active' as PkgStatus },
  { label: 'Rejected', value: 'rejected' as PkgStatus },
];

const STATUS_COLOR: Record<string, string> = {
  draft: Colors.textLight,
  pending: Colors.warning,
  active: Colors.success,
  rejected: Colors.error,
};

function PackageRow({ pkg }: { pkg: AdminPackageListItem }): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/packages/${pkg.id}`)}
      activeOpacity={0.75}
    >
      {pkg.cover_image ? (
        <Image source={{ uri: pkg.cover_image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbEmoji}>🖼️</Text>
        </View>
      )}
      <View style={styles.rowMeta}>
        <Text style={styles.rowTitle} numberOfLines={1}>{pkg.title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{pkg.company.name} · {pkg.location.city}</Text>
        <Text style={styles.rowStats}>
          {pkg.duration_days}D · ⭐ {pkg.avg_rating.toFixed(1)} · {pkg.total_bookings} bkgs
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[pkg.status] ?? Colors.textLight}18` }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[pkg.status] ?? Colors.textLight }]}>
            {pkg.status}
          </Text>
        </View>
        {pkg.is_featured && <Text style={styles.featuredTag}>⭐ Featured</Text>}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminPackagesScreen(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<PkgStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useAdminPackages({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    limit: 30,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Packages</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search packages…"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <StatusFilterTabs tabs={STATUS_TABS} selected={statusFilter} onSelect={setStatusFilter} />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load packages</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PackageRow pkg={item} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No packages found</Text></View>}
          ListFooterComponent={data ? <Text style={styles.countText}>{data.total} packages total</Text> : null}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  searchRow: { padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { backgroundColor: Colors.backgroundSoft, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 20 },
  rowMeta: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  rowStats: { fontSize: 11, color: Colors.textLight, marginTop: 3 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  featuredTag: { fontSize: 10, color: Colors.accent, fontWeight: '600' },
  chevron: { fontSize: 20, color: Colors.textLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
});
