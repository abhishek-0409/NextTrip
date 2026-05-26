/**
 * @file app/(admin)/bookings/index.tsx
 * @description Admin bookings list with status filtering.
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
import { useAdminBookings } from '../../../hooks/admin/useAdminBookings';
import type { AdminBooking } from '../../../types/admin';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const STATUS_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as BookingStatus },
  { label: 'Confirmed', value: 'confirmed' as BookingStatus },
  { label: 'Completed', value: 'completed' as BookingStatus },
  { label: 'Cancelled', value: 'cancelled' as BookingStatus },
];

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.secondary,
  completed: Colors.success,
  cancelled: Colors.error,
};

const PAYMENT_COLOR: Record<string, string> = {
  pending: Colors.warning,
  paid: Colors.success,
  refunded: Colors.secondary,
  failed: Colors.error,
};

function BookingRow({ booking }: { booking: AdminBooking }): React.ReactElement {
  const statusColor = STATUS_COLOR[booking.status] ?? Colors.textLight;
  const payColor = PAYMENT_COLOR[booking.payment_status] ?? Colors.textLight;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/bookings/${booking.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.rowMain}>
        <Text style={styles.ref}>{booking.booking_reference}</Text>
        <Text style={styles.pkg} numberOfLines={1}>{booking.package?.title ?? 'Package'}</Text>
        <Text style={styles.meta}>
          {booking.user?.full_name ?? '—'} · {booking.num_travelers} pax · {new Date(booking.travel_date).toLocaleDateString('en-IN')}
        </Text>
        <Text style={styles.amount}>₹{booking.total_amount.toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: `${statusColor}18` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{booking.status}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${payColor}18` }]}>
          <Text style={[styles.badgeText, { color: payColor }]}>{booking.payment_status}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminBookingsScreen(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useAdminBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    limit: 30,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Bookings</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search by reference…" placeholderTextColor={Colors.textLight} value={search} onChangeText={setSearch} />
      </View>

      <StatusFilterTabs tabs={STATUS_TABS} selected={statusFilter} onSelect={setStatusFilter} />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load bookings</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookingRow booking={item} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No bookings found</Text></View>}
          ListFooterComponent={data ? <Text style={styles.countText}>{data.total} bookings total</Text> : null}
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
  row: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowMain: { flex: 1, gap: 3 },
  ref: { fontSize: 13, fontWeight: '700', color: Colors.navy, fontFamily: 'monospace' },
  pkg: { fontSize: 13, color: Colors.text },
  meta: { fontSize: 11, color: Colors.textSecondary },
  amount: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  chevron: { fontSize: 20, color: Colors.textLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
});
