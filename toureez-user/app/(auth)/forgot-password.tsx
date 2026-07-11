

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { useForgotPassword } from '../../hooks/useAuth';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen(): React.ReactElement {
  const reset = useForgotPassword();

  // ── Success state ──────────────────────────────────────────────────────────
  if (reset.isSuccess) {
    return (
      <ScreenWrapper contentStyle={styles.successContent}>
        <View
          style={styles.successPanel}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {}
          <Text style={styles.successIcon} accessibilityElementsHidden>
            ✉️
          </Text>

          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successMessage}>
            We sent a password reset link to{' '}
            <Text style={styles.successEmail}>{reset.email.trim()}</Text>.
            {'\n\n'}
            Check your inbox and follow the link to reset your password.
          </Text>

          {}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity
              style={styles.backLinkButton}
              accessibilityRole="link"
              accessibilityLabel="Back to login"
            >
              <Text style={styles.backLinkText}>Back to login</Text>
            </TouchableOpacity>
          </Link>

          {}
          <Button
            label="Use a different email"
            onPress={reset.resetForm}
            variant="ghost"
            style={styles.useAnotherButton}
          />
        </View>
      </ScreenWrapper>
    );
  }

  // ── Default state ──────────────────────────────────────────────────────────
  return (
    <ScreenWrapper scrollable contentStyle={styles.screenContent}>
      {}
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link.
        </Text>
      </View>

      {}
      <View style={styles.form}>
        <Input
          label="Email"
          value={reset.email}
          onChangeText={reset.setEmail}
          placeholder="you@example.com"
          error={reset.emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="done"
          onSubmitEditing={reset.submit}
          editable={!reset.isPending}
        />

        {}
        {reset.formError ? (
          <View
            style={styles.errorPanel}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.errorText}>{reset.formError}</Text>
          </View>
        ) : null}

        <Button
          label="Send reset link"
          onPress={reset.submit}
          loading={reset.isPending}
          style={styles.primaryButton}
        />
      </View>

      {}
      <View style={styles.footer}>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Back to login"
            disabled={reset.isPending}
          >
            <Text style={styles.footerLink}>← Back to login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScreenWrapper>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Default state ──────────────────────────────────────────
  screenContent: {
    justifyContent: 'center',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    flexGrow: 1,
  },
  errorPanel: {
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    marginBottom: 14,
    padding: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 28,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Success state ──────────────────────────────────────────
  successContent: {
    justifyContent: 'center',
  },
  successPanel: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  successTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  successMessage: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  successEmail: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  backLinkButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    width: '100%',
  },
  backLinkText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  useAnotherButton: {
    marginTop: 10,
    width: '100%',
  },
});
