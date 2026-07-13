

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ReviewCard } from '../components/reviews/ReviewCard';
import { EmptyState } from '../components/common/EmptyState';
import { useReviewFeed } from '../hooks/useReviews';
import { Colors } from '../constants/colors';
import type { Review } from '../types';

export default function CommunityScreen(): React.ReactElement {
  const {
    reviews,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useReviewFeed();

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderItem: ListRenderItem<Review> = useCallback(
    ({ item }) => <ReviewCard review={item} />,
    []
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

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
        <Text style={styles.title} numberOfLines={1}>
          Community
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load the community feed"
          subtitle="Pull to refresh or try again in a moment."
          ctaLabel="Retry"
          onCtaPress={() => refetch()}
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No stories yet"
          subtitle="Traveller reviews from completed trips will show up here."
        />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
        />
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
  title: {
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
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
