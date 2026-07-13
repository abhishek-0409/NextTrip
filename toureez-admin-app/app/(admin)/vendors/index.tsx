

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../../constants/theme';
import { ScreenLayout } from '../../../components/ui/ScreenLayout';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Caption } from '../../../components/ui/Typography';
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

function VendorAvatar({
  vendor,
}: {
  vendor: AdminVendor;
}): React.ReactElement {
  const initial = (vendor.name ?? 'V').charAt(0).toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function VendorRow({ vendor }: { vendor: AdminVendor }): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/vendors/${vendor.id}`)}
      activeOpacity={0.78}
    >
      <VendorAvatar vendor={vendor} />
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {vendor.name}
          {vendor.is_verified && (
            <Text style={styles.verifiedInline}> ✓</Text>
          )}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {vendor.owner?.full_name ?? vendor.owner?.email ?? '—'}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {vendor.total_packages} pkgs · ★ {vendor.avg_rating.toFixed(1)} ({vendor.total_reviews})
        </Text>
        <View style={{ marginTop: 4 }}>
          <Badge status={vendor.status} size="sm" />
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function VendorRowSkeleton(): React.ReactElement {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} radius={24} />
      <View style={styles.rowMain}>
        <Skeleton width={'70%'} height={14} />
        <Skeleton width={'40%'} height={11} style={{ marginTop: 6 }} />
        <Skeleton width={'55%'} height={11} style={{ marginTop: 6 }} />
        <Skeleton width={64} height={20} radius={10} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const VENDOR_STATUS_VALUES: VendorStatus[] = ['pending', 'approved', 'rejected'];

export default function AdminVendorsScreen(): React.ReactElement {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const initialStatus = VENDOR_STATUS_VALUES.includes(status as VendorStatus)
    ? (status as VendorStatus)
    : 'all';

  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>(initialStatus);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminVendors({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    page: 1,
    limit: 30,
  });

  const items = data?.items ?? [];

  return (
    <ScreenLayout
      title="Vendors"
      subtitle={data ? `${data.total} total` : undefined}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      error={isError ? (error?.message ?? 'Failed to load vendors') : undefined}
      onRetry={() => void refetch()}
    >
      <View style={styles.toolbar}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search vendors by name or owner…"
        />
      </View>

      <StatusFilterTabs
        tabs={STATUS_TABS}
        selected={statusFilter}
        onSelect={setStatusFilter}
      />

      {isLoading ? (
        <View style={{ paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
          <VendorRowSkeleton />
          <VendorRowSkeleton />
          <VendorRowSkeleton />
          <VendorRowSkeleton />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AdminVendor }) => <VendorRow vendor={item} />}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              icon="—"
              title="No vendors found"
              subtitle={
                search
                  ? 'Try adjusting your search or filter.'
                  : 'No vendors match the current filter.'
              }
            />
          }
          ListFooterComponent={
            items.length > 0 && data ? (
              <View style={styles.footer}>
                <Caption color={Colors.textLight} align="center">
                  {data.total} {data.total === 1 ? 'vendor' : 'vendors'} total
                </Caption>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    shadowColor: '#1F2328',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  verifiedInline: {
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowMeta: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Spacing.xs,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textLight,
  },
  footer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
