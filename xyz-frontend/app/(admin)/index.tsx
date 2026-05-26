/**
 * @file app/(admin)/index.tsx
 * @description Admin dashboard — platform overview metrics.
 *
 * Shows:
 * - KPI tiles (users, vendors, packages, bookings, revenue)
 * - Quick-action cards for pending items
 */

import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { MetricTile } from '../../components/dashboard/MetricTile';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import { adminDashboardQueryKeys } from '../../hooks/admin/useAdminDashboard';
import { useAuthStore } from '../../store/authStore';

function formatINR(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

interface QuickActionCardProps {
  emoji: string;
  label: string;
  count: number;
  route: string;
  accent: string;
}

function QuickActionCard({ emoji, label, count, route, accent }: QuickActionCardProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { borderLeftColor: accent }]}
      onPress={() => router.push(route as `/${string}`)}
      activeOpacity={0.75}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <View style={styles.actionMeta}>
        <Text style={styles.actionCount}>{count}</Text>
        <Text style={styles.actionLabel}>{label}</Text>
      </View>
      <Text style={styles.actionChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboardScreen(): React.ReactElement {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, error, refetch } = useAdminDashboard();

  const onRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKeys.all });
  }, [queryClient]);

  const metrics = data;
  const loading = isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Welcome, {user?.full_name ?? 'Admin'}</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => router.push('/(admin)/audit-logs')}
        >
          <Text style={styles.signOutText}>Audit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Could not load dashboard. Pull to retry.</Text>
          </View>
        )}

        {/* ── User & Vendor metrics ── */}
        <Text style={styles.sectionLabel}>Users & Vendors</Text>
        <View style={styles.tilesRow}>
          <MetricTile
            label="Total Users"
            value={metrics?.total_users ?? 0}
            sublabel={`+${metrics?.new_users_this_month ?? 0} this month`}
            accent={Colors.secondary}
            loading={loading}
          />
          <MetricTile
            label="Total Vendors"
            value={metrics?.total_vendors ?? 0}
            accent={Colors.primary}
            loading={loading}
          />
        </View>

        {/* ── Package metrics ── */}
        <Text style={styles.sectionLabel}>Packages</Text>
        <View style={styles.tilesRow}>
          <MetricTile
            label="Total Packages"
            value={metrics?.total_packages ?? 0}
            accent={Colors.navy}
            loading={loading}
          />
          <MetricTile
            label="Active"
            value={metrics?.active_packages ?? 0}
            accent={Colors.success}
            loading={loading}
          />
        </View>

        {/* ── Booking & Revenue metrics ── */}
        <Text style={styles.sectionLabel}>Bookings & Revenue</Text>
        <View style={styles.tilesRow}>
          <MetricTile
            label="Total Bookings"
            value={metrics?.total_bookings ?? 0}
            sublabel={`${metrics?.bookings_this_month ?? 0} this month`}
            accent={Colors.accent}
            loading={loading}
          />
          <MetricTile
            label="Revenue"
            value={metrics?.total_revenue ?? 0}
            format={formatINR}
            sublabel={`${formatINR(metrics?.revenue_this_month ?? 0)} this month`}
            accent={Colors.success}
            loading={loading}
          />
        </View>

        {/* ── Pending actions ── */}
        <Text style={styles.sectionLabel}>Needs Attention</Text>
        <View style={styles.actionsColumn}>
          <QuickActionCard
            emoji="⏳"
            label="Vendors Awaiting Approval"
            count={metrics?.pending_vendors ?? 0}
            route="/(admin)/vendors"
            accent={Colors.warning}
          />
          <QuickActionCard
            emoji="📦"
            label="Packages Pending Review"
            count={metrics?.pending_packages ?? 0}
            route="/(admin)/packages"
            accent={Colors.primary}
          />
          <QuickActionCard
            emoji="⭐"
            label="Reviews to Moderate"
            count={metrics?.pending_reviews ?? 0}
            route="/(admin)/reviews"
            accent={Colors.accent}
          />
          <QuickActionCard
            emoji="💳"
            label="Payouts Pending"
            count={metrics?.pending_payouts ?? 0}
            route="/(admin)/payouts"
            accent={Colors.secondary}
          />
        </View>

        {/* ── Navigation grid ── */}
        <Text style={styles.sectionLabel}>Management</Text>
        <View style={styles.navGrid}>
          {[
            { emoji: '👥', label: 'Users', route: '/(admin)/users' },
            { emoji: '🏢', label: 'Vendors', route: '/(admin)/vendors' },
            { emoji: '📦', label: 'Packages', route: '/(admin)/packages' },
            { emoji: '📋', label: 'Bookings', route: '/(admin)/bookings' },
            { emoji: '⭐', label: 'Reviews', route: '/(admin)/reviews' },
            { emoji: '🏷️', label: 'Categories', route: '/(admin)/categories' },
            { emoji: '📍', label: 'Locations', route: '/(admin)/locations' },
            { emoji: '💳', label: 'Payouts', route: '/(admin)/payouts' },
          ].map(({ emoji, label, route }) => (
            <TouchableOpacity
              key={route}
              style={styles.navCell}
              onPress={() => router.push(route as `/${string}`)}
              activeOpacity={0.75}
            >
              <Text style={styles.navEmoji}>{emoji}</Text>
              <Text style={styles.navLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.navy,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textWhite },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  signOutText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 18,
  },
  tilesRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actionsColumn: { gap: 10 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.shadowNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionEmoji: { fontSize: 20, marginRight: 12 },
  actionMeta: { flex: 1 },
  actionCount: { fontSize: 20, fontWeight: '700', color: Colors.text },
  actionLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  actionChevron: { fontSize: 22, color: Colors.textLight, marginLeft: 8 },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  navCell: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  navEmoji: { fontSize: 22 },
  navLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
});
