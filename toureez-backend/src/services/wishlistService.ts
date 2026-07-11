import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { PackageListItem } from '../types';
import { getPackageListItemsByIds } from './packageService';

type WishlistMutationResult = { wishlisted: boolean; package_id: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  return typeof value === 'string' ? value : '';
};

const throwDatabaseError = (operation: string, dbError: unknown): never => {
  logger.error({ err: dbError, op: `wishlistService.${operation}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

const ensureActivePackageExists = async (packageId: string): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('id')
    .eq('id', packageId)
    .eq('status', 'active')
    .maybeSingle();

  if (error !== null) {
    throwDatabaseError('ensureActivePackageExists', error);
  }

  if (data === null) {
    throw new AppError('Package not found', 404);
  }
};


export const getUserWishlist = async (userId: string): Promise<PackageListItem[]> => {
  const { data, error } = await supabaseAdmin
    .from('wishlists')
    .select('package_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error !== null) {
    throwDatabaseError('getUserWishlist', error);
  }

  const packageIds = ((data as unknown[] | null) ?? [])
    .filter(isRecord)
    .map((row) => readString(row, 'package_id'))
    .filter((packageId) => packageId !== '');

  return getPackageListItemsByIds(packageIds, 'min');
};
export const addPackageToWishlist = async (
  userId: string,
  packageId: string,
): Promise<WishlistMutationResult> => {
  await ensureActivePackageExists(packageId);

  const { error } = await supabaseAdmin.from('wishlists').upsert(
    {
      user_id: userId,
      package_id: packageId,
    },
    {
      onConflict: 'user_id,package_id',
    },
  );

  if (error !== null) {
    throwDatabaseError('addPackageToWishlist', error);
  }

  return {
    wishlisted: true,
    package_id: packageId,
  };
};
export const removePackageFromWishlist = async (
  userId: string,
  packageId: string,
): Promise<WishlistMutationResult> => {
  const { error } = await supabaseAdmin
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('package_id', packageId);

  if (error !== null) {
    throwDatabaseError('removePackageFromWishlist', error);
  }

  return {
    wishlisted: false,
    package_id: packageId,
  };
};


export const toggleWishlist = async (
  userId: string,
  packageId: string,
): Promise<WishlistMutationResult> => {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('package_id', packageId)
    .maybeSingle();

  if (lookupError !== null) {
    throwDatabaseError('toggleWishlist.lookup', lookupError);
  }

  if (existing !== null) {
    return removePackageFromWishlist(userId, packageId);
  }
  return addPackageToWishlist(userId, packageId);
};
