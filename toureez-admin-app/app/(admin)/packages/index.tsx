

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import {
  FontWeight,
  Radius,
  Spacing,
} from '../../../constants/theme';
import { ScreenLayout } from '../../../components/ui/ScreenLayout';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Caption } from '../../../components/ui/Typography';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { useAdminPackages } from '../../../hooks/admin/useAdminPackages';
import type { AdminPackageListItem } from '../../../types/admin';

type PkgStatus = 'draft' | 'pending' | 'active' | 'rejected';

const STATUS_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as PkgStatus },
  { label: 'Active', value: 'active' as PkgStatus },
  { label: 'Draft', value: 'draft' as PkgStatus },
  { label: 'Rejected', value: 'rejected' as PkgStatus },
];

function PackageRow({
  pkg,
}: {
  pkg: AdminPackageListItem;
}): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/packages/${pkg.id}`)}
      activeOpacity={0.78}
    >
      {pkg.cover_image ? (
        <Image source={{ uri: pkg.cover_image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <MaterialCommunityIcons name="image-off-outline" size={24} color={Colors.textLight} />
        </View>
      )}
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {pkg.title}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {pkg.location.city}, {pkg.location.state}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {pkg.duration_days}D / {pkg.duration_nights}N · ★ {pkg.avg_rating.toFixed(1)} · {pkg.total_bookings} bkgs
        </Text>
        <View style={styles.cardBadges}>
          <Badge status={pkg.status} size="sm" />
          {pkg.is_featured && (
            <Badge status="featured" size="sm" />
          )}
        </View>
      </View>
      <View style={styles.rowRight}>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

function PackageRowSkeleton(): React.ReactElement {
  return (
    <View style={styles.card}>
      <Skeleton width={68} height={68} radius={Radius.md} />
      <View style={styles.rowMain}>
        <Skeleton width={'80%'} height={14} />
        <Skeleton width={'55%'} height={11} style={{ marginTop: 6 }} />
        <Skeleton width={'70%'} height={11} style={{ marginTop: 6 }} />
        <Skeleton width={56} height={20} radius={10} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const PKG_STATUS_VALUES: PkgStatus[] = ['draft', 'pending', 'active', 'rejected'];

export default function AdminPackagesScreen(): React.ReactElement {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const initialStatus = PKG_STATUS_VALUES.includes(status as PkgStatus)
    ? (status as PkgStatus)
    : 'all';

  const [statusFilter, setStatusFilter] = useState<PkgStatus | 'all'>(initialStatus);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminPackages({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    limit: 30,
  });

  const items = data?.items ?? [];

  return (
    <ScreenLayout
      title="Packages"
      subtitle={data ? `${data.total} total` : undefined}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      error={isError ? (error?.message ?? 'Failed to load packages') : undefined}
      onRetry={() => void refetch()}
    >
      <View style={styles.toolbar}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search packages…"
        />
      </View>

      <StatusFilterTabs
        tabs={STATUS_TABS}
        selected={statusFilter}
        onSelect={setStatusFilter}
      />

      {isLoading ? (
        <View style={{ paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
          <PackageRowSkeleton />
          <PackageRowSkeleton />
          <PackageRowSkeleton />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AdminPackageListItem }) => <PackageRow pkg={item} />}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              icon="—"
              title="No packages found"
              subtitle={
                search ? 'Try a different search term.' : 'No packages match the current filter.'
              }
            />
          }
          ListFooterComponent={
            items.length > 0 && data ? (
              <View style={styles.footer}>
                <Caption color={Colors.textLight} align="center">
                  {data.total} {data.total === 1 ? 'package' : 'packages'} total
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
  thumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    lineHeight: 20,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowMeta: {
    fontSize: 11,
    color: Colors.textLight,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Spacing.xs,
  },
  footer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
