/**
 * @file components/admin/ModerationToolbar.tsx
 * @description Fixed bottom toolbar for admin moderation actions.
 *
 * Shows 2–4 configurable action buttons. Each button can be styled
 * as primary, success, danger, or warning.
 *
 * Example — vendor detail screen:
 *   <ModerationToolbar
 *     actions={[
 *       { label: 'Approve', variant: 'success', onPress: handleApprove },
 *       { label: 'Reject', variant: 'danger', onPress: () => setRejectSheet(true) },
 *       { label: 'Verify', variant: 'primary', onPress: handleVerify, disabled: vendor.is_verified },
 *     ]}
 *   />
 */

import React from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';

export type ModerationActionVariant = 'primary' | 'success' | 'danger' | 'warning' | 'muted';

export interface ModerationAction {
  label: string;
  variant?: ModerationActionVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ModerationToolbarProps {
  actions: ModerationAction[];
}

const VARIANT_BG: Record<ModerationActionVariant, string> = {
  primary: Colors.primary,
  success: Colors.success,
  danger: Colors.error,
  warning: Colors.warning,
  muted: Colors.borderLight,
};

const VARIANT_TEXT: Record<ModerationActionVariant, string> = {
  primary: Colors.textWhite,
  success: Colors.textWhite,
  danger: Colors.textWhite,
  warning: Colors.text,
  muted: Colors.textSecondary,
};

export function ModerationToolbar({ actions }: ModerationToolbarProps): React.ReactElement {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.toolbar}>
        {actions.map((action, index) => {
          const variant = action.variant ?? 'primary';
          const bg = VARIANT_BG[variant];
          const textColor = VARIANT_TEXT[variant];
          const disabled = action.disabled || action.loading;

          return (
            <TouchableOpacity
              key={`${action.label}-${index}`}
              style={[
                styles.button,
                { backgroundColor: bg, flex: 1 },
                disabled && styles.buttonDisabled,
              ]}
              onPress={action.onPress}
              disabled={disabled}
              activeOpacity={0.8}
            >
              {action.loading ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Text style={[styles.buttonText, { color: textColor }]}>{action.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
