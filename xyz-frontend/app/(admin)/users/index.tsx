/**
 * @file app/(admin)/users/index.tsx
 * @description Admin user management list.
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
import { useAdminUsers } from '../../../hooks/admin/useAdminUsers';
import type { AdminUser } from '../../../types/admin';
import type { UserRole } from '../../../types';

type RoleFilter = UserRole | 'all';

const ROLE_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Traveler', value: 'traveler' as UserRole },
  { label: 'Vendor', value: 'company_owner' as UserRole },
  { label: 'Admin', value: 'admin' as UserRole },
];

const ROLE_COLOR: Record<string, string> = {
  traveler: Colors.secondary,
  company_owner: Colors.primary,
  admin: Colors.navy,
};

const ROLE_LABEL: Record<string, string> = {
  traveler: 'Traveler',
  company_owner: 'Vendor',
  admin: 'Admin',
};

function UserRow({ user }: { user: AdminUser }): React.ReactElement {
  const roleColor = ROLE_COLOR[user.role] ?? Colors.textLight;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/users/${user.id}`)}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, { backgroundColor: `${roleColor}22` }]}>
        <Text style={[styles.avatarText, { color: roleColor }]}>
          {(user.full_name ?? 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowName}>{user.full_name ?? 'No Name'}</Text>
        <Text style={styles.rowSub}>{user.city ?? '—'}{user.state ? `, ${user.state}` : ''}</Text>
        <Text style={styles.rowDate}>Joined {new Date(user.created_at).toLocaleDateString('en-IN')}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: `${roleColor}18` }]}>
          <Text style={[styles.badgeText, { color: roleColor }]}>{ROLE_LABEL[user.role] ?? user.role}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminUsersScreen(): React.ReactElement {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useAdminUsers({
    role: roleFilter === 'all' ? undefined : roleFilter,
    search: search.trim() || undefined,
    limit: 30,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone…"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <StatusFilterTabs tabs={ROLE_TABS} selected={roleFilter} onSelect={setRoleFilter} />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load users</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserRow user={item} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No users found</Text></View>}
          ListFooterComponent={data ? <Text style={styles.countText}>{data.total} users total</Text> : null}
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
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  rowMeta: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowDate: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  chevron: { fontSize: 20, color: Colors.textLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
});
