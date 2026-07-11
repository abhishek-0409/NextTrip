import type { RequestHandler } from 'express';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabaseAdmin, supabasePublic } from '../lib/supabase';
import { VENDOR_ROLE, type AuthenticatedUser, type UserRole } from '../types';
import { ERROR_MESSAGES } from '../constants/errors';
import { error as errorResponse } from '../utils/response';

const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (authorizationHeader === undefined) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || token === undefined || token.trim() === '') {
    return null;
  }

  return token.trim();
};

const readRole = (value: unknown): UserRole => {
  return value === VENDOR_ROLE || value === 'admin' ? value : 'traveler';
};

const fetchDatabaseRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error !== null) {
    throw error;
  }

  return readRole((data as { role?: unknown } | null)?.role);
};

const toAuthenticatedUser = (
  user: SupabaseAuthUser,
  role: UserRole
): AuthenticatedUser => {
  return {
    id: user.id,
    email: user.email ?? '',
    role,
  };
};


export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token === null) {
      return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, 401);
    }
    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error !== null || data.user === null) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, 401);
    }

    const role = await fetchDatabaseRole(data.user.id);
    req.user = toAuthenticatedUser(data.user, role);
    return next();
  } catch (caughtError) {
    return next(caughtError);
  }
};


export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token === null) {
      return next();
    }
    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error === null && data.user !== null) {
      const role = await fetchDatabaseRole(data.user.id);
      req.user = toAuthenticatedUser(data.user, role);
    }

    return next();
  } catch (caughtError) {
    return next(caughtError);
  }
};
