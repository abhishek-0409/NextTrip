

import * as Linking from 'expo-linking';
import { supabase } from '../supabase';
import { apiClient } from './client';
import { friendlyError, friendlyThrown } from '../errors';
import type { ApiResponse, User } from '../../types';
const PROFILE_SELECT = 'id, full_name, avatar_url, phone, city, state, role, created_at';

type ActiveSession = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
>;

export interface OAuthCallbackParams {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error?: string;
  error_description?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────



function buildProfilePayload(session: ActiveSession): {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: null;
  city: null;
  state: null;
  role: 'traveler';
} {
  const fullName =
    typeof session.user.user_metadata?.full_name === 'string'
      ? session.user.user_metadata.full_name
      : null;

  const avatarUrl =
    typeof session.user.user_metadata?.avatar_url === 'string'
      ? session.user.user_metadata.avatar_url
      : null;

  return {
    id: session.user.id,
    full_name: fullName,
    avatar_url: avatarUrl,
    phone: null,
    city: null,
    state: null,
    role: 'traveler',
  };
}


async function fetchOrCreateProfile(
  session: ActiveSession
): Promise<ApiResponse<User>> {
  const profileResponse = await supabase
    .from('users')
    .select(PROFILE_SELECT)
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileResponse.error) {
    return {
      data: null,
      error: friendlyError(profileResponse.error.message),
    };
  }

  const existingProfile = profileResponse.data as User | null;

  if (existingProfile) {
    return { data: existingProfile, error: null };
  }

  const createProfileResponse = await supabase
    .from('users')
    .upsert(buildProfilePayload(session), { onConflict: 'id' })
    .select(PROFILE_SELECT)
    .single();

  if (createProfileResponse.error) {
    return {
      data: null,
      error: friendlyError(createProfileResponse.error.message),
    };
  }

  return { data: createProfileResponse.data as User, error: null };
}

// ── Public API ────────────────────────────────────────────────────────────────


export async function getProfile(): Promise<ApiResponse<User>> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { data: null, error: 'No active session. Please log in.' };
    }

    return await fetchOrCreateProfile(session);
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}


export type UpdateProfilePayload = Partial<
  Pick<User, 'full_name' | 'avatar_url' | 'phone' | 'city' | 'state'>
>;


export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<ApiResponse<User>> {
  try {
    if (Object.keys(payload).length === 0) {
      return { data: null, error: 'No fields provided to update.' };
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { data: null, error: 'No active session. Please log in.' };
    }

    const updateProfileResponse = await supabase
      .from('users')
      .update(payload)
      .eq('id', session.user.id)
      .select(PROFILE_SELECT)
      .single();

    if (updateProfileResponse.error) {
      return {
        data: null,
        error: friendlyError(updateProfileResponse.error.message),
      };
    }

    return { data: updateProfileResponse.data as User, error: null };
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}


export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: `Failed to sign out: ${error.message}`,
      };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}


export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse<User>> {
  try {
    if (!email || !password) {
      return { data: null, error: 'Email and password are required.' };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return {
        data: null,
        error: friendlyError(authError.message),
      };
    }

    if (!authData.user) {
      return { data: null, error: 'Sign in failed. Please try again.' };
    }

    // Try to fetch the public profile row.
    // If it fails (e.g. the users table hasn't been created yet, missing RLS
    // INSERT policy, or the trigger didn't fire), we fall back to a minimal
    // User object derived directly from the Supabase auth metadata.
    // This ensures login always succeeds as long as the credentials are correct —
    // the profile can be fetched / created later by the onAuthStateChange handler.
    const profileResponse = await getProfile();

    if (profileResponse.data) {
      return profileResponse;
    }

    // Profile fetch failed — build a minimal user from auth metadata so login
    // is not blocked by a missing or inaccessible profile row.
    const { user: authUser } = authData;
    const fallbackUser: User = {
      id: authUser.id,
      full_name:
        typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : null,
      avatar_url:
        typeof authUser.user_metadata?.avatar_url === 'string'
          ? authUser.user_metadata.avatar_url
          : null,
      phone: null,
      city: null,
      state: null,
      role: 'traveler',
      created_at: authUser.created_at,
    };

    return { data: fallbackUser, error: null };
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}

export const signInWithEmail = signIn;


export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  city?: string,
  state?: string,
): Promise<ApiResponse<User>> {
  try {
    if (!email || !password || !fullName) {
      return {
        data: null,
        error: 'Email, password, and full name are required.',
      };
    }

    if (password.length < 6) {
      return {
        data: null,
        error: 'Password must be at least 6 characters.',
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      return {
        data: null,
        error: friendlyError(authError.message),
      };
    }

    if (!authData.user) {
      return { data: null, error: 'Sign up failed. Please try again.' };
    }
    const newUser: User = {
      id: authData.user.id,
      full_name: fullName,
      avatar_url: null,
      phone: phone ?? null,
      city: city ?? null,
      state: state ?? null,
      role: 'traveler',
      created_at: authData.user.created_at,
    };
    const upsertProfileResponse = await supabase
      .from('users')
      .upsert(
        {
          id: authData.user.id,
          full_name: fullName,
          avatar_url: null,
          phone: phone ?? null,
          city: city ?? null,
          state: state ?? null,
          role: 'traveler',
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (upsertProfileResponse.data) {
      return { data: upsertProfileResponse.data as User, error: null };
    }

    return { data: newUser, error: null };
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}

export const signUpWithEmail = signUp;


export async function getGoogleOAuthUrl(
  redirectTo: string,
  state?: string
): Promise<ApiResponse<string>> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        // Only include state when provided — avoids appending &state= to the URL
        ...(state ? { queryParams: { state } } : {}),
      },
    });

    if (error) {
      return {
        data: null,
        error: `Google sign in failed: ${error.message}`,
      };
    }

    if (!data.url) {
      return {
        data: null,
        error: 'Google sign in failed: no OAuth URL returned.',
      };
    }

    return { data: data.url, error: null };
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}


export async function completeOAuthSignIn(
  params: OAuthCallbackParams
): Promise<ApiResponse<User>> {
  try {
    if (params.error) {
      return {
        data: null,
        error: params.error_description ?? params.error,
      };
    }

    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);

      if (error) {
        return {
          data: null,
          error: `Google sign in failed: ${error.message}`,
        };
      }
    } else if (params.access_token && params.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (error) {
        return {
          data: null,
          error: `Google sign in failed: ${error.message}`,
        };
      }
    } else {
      return {
        data: null,
        error: 'Google sign in did not return a usable session.',
      };
    }

    return await getProfile();
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}


export async function resetPassword(
  email: string
): Promise<ApiResponse<null>> {
  try {
    if (!email || email.trim().length === 0) {
      return { data: null, error: 'Email address is required.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/reset-password'),
    });

    if (error) {
      return {
        data: null,
        error: `Failed to send reset email: ${error.message}`,
      };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: friendlyThrown(err),
    };
  }
}

export const sendPasswordResetEmail = resetPassword;

// ── Device token (push notifications) ────────────────────────────────────────


export async function registerDeviceToken(
  token: string,
  platform: 'ios' | 'android',
): Promise<ApiResponse<{ saved: boolean }>> {
  const res = await apiClient.post<{ saved: boolean }>('/users/device-token', { token, platform });
  if (res.error || !res.data) return { data: null, error: res.error ?? 'Failed to register token.' };
  return { data: res.data, error: null };
}


export async function unregisterDeviceToken(
  token: string,
  platform: 'ios' | 'android',
): Promise<void> {
  await apiClient.delete<{ removed: boolean }>(`/users/device-token`);
  void token;
  void platform; // parameters kept for API symmetry; delete uses a body-less endpoint
}

// ── Account deletion ──────────────────────────────────────────────────────────


export async function deleteUserAccount(): Promise<ApiResponse<{ deleted: boolean }>> {
  const res = await apiClient.delete<{ deleted: boolean }>('/users/account');
  if (res.error || !res.data) return { data: null, error: res.error ?? 'Failed to delete account.' };
  return { data: res.data, error: null };
}
