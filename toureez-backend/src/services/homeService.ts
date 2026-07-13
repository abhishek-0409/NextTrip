import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin, supabasePublic } from '../lib/supabase';
import { logger } from '../utils/logger';
import { getFeaturedPackages, getPackageListItemsByIds } from './packageService';
import type { PackageListItem } from '../types';

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `homeService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

export interface HomeFeedSection {
  key: 'for_you' | 'trending' | 'popular';
  title: string;
  packages: PackageListItem[];
}

export interface HomeFeed {
  sections: HomeFeedSection[];
  personalized: boolean;
}

interface AffinitySignals {
  categoryIds: string[];
  locationIds: string[];
}

const fetchUserAffinity = async (userId: string): Promise<AffinitySignals> => {
  const [wishlistResult, bookingsResult] = await Promise.all([
    supabaseAdmin
      .from('wishlists')
      .select('package:packages(category_id, location_id)')
      .eq('user_id', userId)
      .limit(50),
    supabaseAdmin
      .from('bookings')
      .select('package:packages(category_id, location_id)')
      .eq('user_id', userId)
      .limit(50),
  ]);

  if (wishlistResult.error !== null) throwDatabaseError('fetchUserAffinity.wishlist', wishlistResult.error);
  if (bookingsResult.error !== null) throwDatabaseError('fetchUserAffinity.bookings', bookingsResult.error);

  const categoryIds = new Set<string>();
  const locationIds = new Set<string>();

  const collect = (rows: unknown[] | null): void => {
    (rows ?? []).forEach((row) => {
      const record = row as Record<string, unknown>;
      const pkg = record.package as Record<string, unknown> | null;
      if (pkg === null || pkg === undefined) return;
      if (typeof pkg.category_id === 'string' && pkg.category_id !== '') categoryIds.add(pkg.category_id);
      if (typeof pkg.location_id === 'string' && pkg.location_id !== '') locationIds.add(pkg.location_id);
    });
  };

  collect(wishlistResult.data as unknown[] | null);
  collect(bookingsResult.data as unknown[] | null);

  return { categoryIds: Array.from(categoryIds), locationIds: Array.from(locationIds) };
};

const fetchPackagesByAffinity = async (affinity: AffinitySignals, excludeIds: string[]): Promise<PackageListItem[]> => {
  if (affinity.categoryIds.length === 0 && affinity.locationIds.length === 0) {
    return [];
  }

  let query = supabasePublic
    .from('packages')
    .select('id')
    .eq('status', 'active');

  if (affinity.categoryIds.length > 0 && affinity.locationIds.length > 0) {
    query = query.or(
      `category_id.in.(${affinity.categoryIds.join(',')}),location_id.in.(${affinity.locationIds.join(',')})`,
    );
  } else if (affinity.categoryIds.length > 0) {
    query = query.in('category_id', affinity.categoryIds);
  } else {
    query = query.in('location_id', affinity.locationIds);
  }

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query
    .order('avg_rating', { ascending: false })
    .limit(10);

  if (error !== null) throwDatabaseError('fetchPackagesByAffinity', error);

  const ids = ((data as unknown[] | null) ?? [])
    .map((row) => (row as Record<string, unknown>).id)
    .filter((id): id is string => typeof id === 'string');

  return getPackageListItemsByIds(ids, 'min');
};

export const getHomeFeed = async (userId: string | undefined): Promise<HomeFeed> => {
  const trending = await getFeaturedPackages();

  if (userId === undefined) {
    return {
      personalized: false,
      sections: [
        { key: 'trending', title: 'Trending Escapes', packages: trending },
      ],
    };
  }

  const affinity = await fetchUserAffinity(userId);
  const forYou = await fetchPackagesByAffinity(
    affinity,
    trending.map((item) => item.id),
  );

  if (forYou.length === 0) {
    return {
      personalized: false,
      sections: [
        { key: 'trending', title: 'Trending Escapes', packages: trending },
      ],
    };
  }

  return {
    personalized: true,
    sections: [
      { key: 'for_you', title: 'For You', packages: forYou },
      { key: 'trending', title: 'Trending Escapes', packages: trending },
    ],
  };
};
