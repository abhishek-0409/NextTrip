/**
 * @file app/(admin)/vendors/[id].tsx
 * @description Admin vendor detail — approve, reject, verify.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { ModerationToolbar } from '../../../components/admin/ModerationToolbar';
import { ConfirmActionSheet } from '../../../components/dashboard/ConfirmActionSheet';
import {
  useAdminVendor,
  useApproveVendor,
  useRejectVendor,
  useVerifyVendor,
} from '../../../hooks/admin/useAdminVendors';

type ActionSheet = 'approve' | 'reject' | null;

function LabelRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.labelKey}>{label}</Text>
      <Text style={styles.labelVal}>{value as string}</Text>
    </View>
  );
}

export default function AdminVendorDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorId = id ?? '';
  const [sheet, setSheet] = useState<ActionSheet>(null);

  const { data: vendor, isLoading, isError, refetch } = useAdminVendor(vendorId);
  const approve = useApproveVendor();
  const reject = useRejectVendor();
  const verify = useVerifyVendor();

  const isMutating = approve.isPending || reject.isPending || verify.isPending;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (isError || !vendor) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Vendor not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleVerify = () => {
    verify.mutate(vendorId, {
      onSuccess: () => Alert.alert('Success', `${vendor.name} is now verified.`),
      onError: (e) => Alert.alert('Error', e.message),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{vendor.name}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: vendor.status === 'approved' ? Colors.successLight : vendor.status === 'rejected' ? Colors.errorLight : Colors.warningLight }]}>
            <Text style={[styles.statusText, { color: vendor.status === 'approved' ? Colors.success : vendor.status === 'rejected' ? Colors.error : Colors.warning }]}>
              {vendor.status.toUpperCase()}
            </Text>
          </View>
          {vendor.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        {/* Company info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Info</Text>
          <LabelRow label="Name" value={vendor.name} />
          <LabelRow label="Slug" value={vendor.slug} />
          <LabelRow label="About" value={vendor.about ?? '—'} />
          <LabelRow label="GST" value={vendor.gst_number ?? '—'} />
          <LabelRow label="Packages" value={String(vendor.total_packages)} />
          <LabelRow label="Rating" value={`⭐ ${vendor.avg_rating.toFixed(1)} (${vendor.total_reviews} reviews)`} />
          <LabelRow label="Joined" value={new Date(vendor.created_at).toLocaleDateString('en-IN')} />
        </View>

        {/* Owner info */}
        {vendor.owner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Owner</Text>
            <LabelRow label="Name" value={vendor.owner.full_name ?? '—'} />
            <LabelRow label="Email" value={vendor.owner.email} />
            <LabelRow label="Phone" value={vendor.owner.phone ?? '—'} />
          </View>
        )}
      </ScrollView>

      {/* Moderation toolbar */}
      <ModerationToolbar
        actions={[
          {
            label: vendor.status === 'approved' ? '✓ Approved' : 'Approve',
            variant: 'success',
            onPress: () => setSheet('approve'),
            disabled: vendor.status === 'approved' || isMutating,
            loading: approve.isPending,
          },
          {
            label: 'Reject',
            variant: 'danger',
            onPress: () => setSheet('reject'),
            disabled: vendor.status === 'rejected' || isMutating,
            loading: reject.isPending,
          },
          {
            label: vendor.is_verified ? '✓ Verified' : 'Verify',
            variant: 'primary',
            onPress: handleVerify,
            disabled: vendor.is_verified || isMutating,
            loading: verify.isPending,
          },
        ]}
      />

      {/* Approve sheet */}
      <ConfirmActionSheet
        visible={sheet === 'approve'}
        title="Approve Vendor?"
        description={`${vendor.name} will be notified and can start listing packages.`}
        confirmLabel="Approve"
        confirmVariant="success"
        onConfirm={() => {
          setSheet(null);
          approve.mutate(
            { vendorId },
            {
              onSuccess: () => Alert.alert('Approved', `${vendor.name} is now approved.`),
              onError: (e) => Alert.alert('Error', e.message),
            },
          );
        }}
        onCancel={() => setSheet(null)}
        loading={approve.isPending}
      />

      {/* Reject sheet */}
      <ConfirmActionSheet
        visible={sheet === 'reject'}
        title="Reject Vendor"
        description="A rejection reason is required. The vendor will be notified."
        confirmLabel="Reject"
        confirmVariant="danger"
        requireReason
        reasonPlaceholder="Reason for rejection (min 5 characters)…"
        onConfirm={(reason) => {
          setSheet(null);
          reject.mutate(
            { vendorId, reason: reason! },
            {
              onSuccess: () => Alert.alert('Rejected', `${vendor.name} has been rejected.`),
              onError: (e) => Alert.alert('Error', e.message),
            },
          );
        }}
        onCancel={() => setSheet(null)}
        loading={reject.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 12 },
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
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  statusRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  verifiedBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  verifiedText: { color: Colors.success, fontWeight: '600', fontSize: 12 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  labelRow: { flexDirection: 'row', gap: 8 },
  labelKey: { width: 80, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  labelVal: { flex: 1, fontSize: 13, color: Colors.text },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 14 },
});
