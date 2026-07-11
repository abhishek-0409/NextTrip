

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Shadows, Spacing } from '../../constants/theme';
import { Skeleton } from '../ui/Skeleton';

export interface MetricTileProps {
  label: string;
  value: number | string;

  sublabel?: string;

  delta?: number;

  accent?: string;

  loading?: boolean;

  format?: (v: number | string) => string;

  onPress?: () => void;
}

function defaultFormat(v: number | string): string {
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return v;
}

export function MetricTile({
  label,
  value,
  sublabel,
  delta,
  accent = Colors.primary,
  loading = false,
  format,
  onPress,
}: MetricTileProps): React.ReactElement {
  const display = (format ?? defaultFormat)(value);
  const hasDelta = delta !== undefined;
  const positive = (delta ?? 0) >= 0;

  const inner = loading ? (
    <View style={styles.body}>
      <Skeleton width={70} height={26} />
      <Skeleton width={90} height={10} style={{ marginTop: Spacing.sm }} />
      {sublabel !== undefined && (
        <Skeleton width={70} height={10} style={{ marginTop: Spacing.xs }} />
      )}
    </View>
  ) : (
    <View style={styles.body}>
      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {display}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {(hasDelta || sublabel !== undefined) && (
        <View style={styles.footer}>
          {hasDelta && (
            <Text
              style={[
                styles.delta,
                { color: positive ? Colors.success : Colors.error },
              ]}
            >
              {positive ? '↑' : '↓'} {Math.abs(delta ?? 0).toLocaleString('en-IN')}
            </Text>
          )}
          {sublabel !== undefined && (
            <Text style={styles.sublabel} numberOfLines={1}>
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const containerStyle = [styles.tile, Shadows.sm];

  if (onPress !== undefined) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={containerStyle}
      >
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  body: { gap: 4 },
  value: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  delta: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  sublabel: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
  },
});
