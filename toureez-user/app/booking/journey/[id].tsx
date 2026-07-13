

import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState';
import { useBookingDetail } from '../../../hooks/useBookings';
import { getPackageDetail } from '../../../lib/api/packages';
import { Colors } from '../../../constants/colors';
import type { Itinerary } from '../../../types';

function dateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

interface DayCardProps {
  item: Itinerary;
  state: 'past' | 'current' | 'upcoming';
}

function DayCard({ item, state }: DayCardProps): React.ReactElement {
  return (
    <View style={[styles.dayCard, state === 'current' && styles.dayCardCurrent]}>
      <View style={styles.dayHeaderRow}>
        <View
          style={[
            styles.dayBadge,
            state === 'past' && styles.dayBadgePast,
            state === 'current' && styles.dayBadgeCurrent,
          ]}
        >
          {state === 'past' ? (
            <Ionicons name="checkmark" size={16} color={Colors.white} />
          ) : (
            <Text style={styles.dayBadgeText}>{item.day_number}</Text>
          )}
        </View>
        <View style={styles.dayHeaderText}>
          <Text style={styles.dayTitle} numberOfLines={2}>
            Day {item.day_number} — {item.title}
          </Text>
          {state === 'current' ? <Text style={styles.dayTodayLabel}>Today</Text> : null}
        </View>
      </View>

      {item.description ? <Text style={styles.dayDescription}>{item.description}</Text> : null}

      {item.activities.length > 0 ? (
        <View style={styles.dayBlock}>
          {item.activities.map((activity, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{activity}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {item.accommodation ? (
        <View style={styles.inlineRow}>
          <Ionicons name="bed-outline" size={14} color={Colors.primary} />
          <Text style={styles.inlineText} numberOfLines={2}>{item.accommodation}</Text>
        </View>
      ) : null}

      {item.transport ? (
        <View style={styles.inlineRow}>
          <Ionicons name="car-outline" size={14} color={Colors.primary} />
          <Text style={styles.inlineText} numberOfLines={2}>{item.transport}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function LiveJourneyScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';

  const bookingQuery = useBookingDetail(id);
  const booking = bookingQuery.data;
  const packageId = booking?.package_id ?? '';

  const itineraryQuery = useQuery({
    queryKey: ['package-detail', packageId],
    queryFn: async () => {
      const { data, error } = await getPackageDetail(packageId);
      if (error || !data) throw new Error(error ?? 'Failed to load itinerary.');
      return data;
    },
    enabled: packageId.trim().length > 0,
  });

  const tripWindow = useMemo(() => {
    if (!booking?.package) return null;
    const start = dateOnly(booking.travel_date);
    const today = dateOnly(new Date().toISOString());
    const dayIndex = daysBetween(start, today) + 1; // 1-based
    const isActive = dayIndex >= 1 && dayIndex <= booking.package.duration_days;
    return { dayIndex, isActive, durationDays: booking.package.duration_days };
  }, [booking]);

  const handleAskAI = (): void => {
    router.push({
      pathname: '/chat' as never,
      params: {
        bookingId: id,
        prompt: tripWindow ? `What should I know about Day ${tripWindow.dayIndex}?` : 'What should I know about my trip?',
      },
    });
  };

  const isLoading = bookingQuery.isLoading || itineraryQuery.isLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Live Journey</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      ) : !booking || !booking.package ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Trip details unavailable"
          subtitle="We couldn't load this booking's itinerary."
        />
      ) : !tripWindow?.isActive ? (
        <EmptyState
          icon="time-outline"
          title="Your journey isn't live yet"
          subtitle={`Live Journey unlocks on your travel date and stays open for the ${tripWindow?.durationDays ?? booking.package.duration_days} days of your trip.`}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle} numberOfLines={2}>{booking.package.title}</Text>
            <Text style={styles.progressSubtitle}>
              Day {tripWindow.dayIndex} of {tripWindow.durationDays} · {booking.package.location.city}, {booking.package.location.state}
            </Text>
          </View>

          {(itineraryQuery.data?.itineraries ?? [])
            .slice()
            .sort((a, b) => a.day_number - b.day_number)
            .map((item) => (
              <DayCard
                key={item.id}
                item={item}
                state={
                  item.day_number < tripWindow.dayIndex
                    ? 'past'
                    : item.day_number === tripWindow.dayIndex
                      ? 'current'
                      : 'upcoming'
                }
              />
            ))}

          <Pressable
            style={styles.askAiButton}
            onPress={handleAskAI}
            accessibilityRole="button"
            accessibilityLabel="Ask AI about this trip"
          >
            <Ionicons name="sparkles-outline" size={18} color={Colors.white} />
            <Text style={styles.askAiButtonText}>Ask AI About This Trip</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
  },
  progressTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  progressSubtitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.9,
  },
  dayCard: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  dayCardCurrent: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  dayHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dayBadge: {
    alignItems: 'center',
    backgroundColor: Colors.textTertiary,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: 6,
  },
  dayBadgePast: {
    backgroundColor: Colors.textTertiary,
  },
  dayBadgeCurrent: {
    backgroundColor: Colors.primary,
  },
  dayBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  dayHeaderText: {
    flex: 1,
  },
  dayTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  dayTodayLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  dayDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  dayBlock: {
    marginBottom: 8,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    backgroundColor: Colors.primary,
    borderRadius: 3,
    height: 6,
    marginRight: 8,
    marginTop: 7,
    width: 6,
  },
  bulletText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  inlineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  inlineText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  askAiButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 14,
  },
  askAiButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
