import { supabase } from '../supabase';
import { friendlyError, friendlyThrown } from '../errors';
import type { AuthUser, UserRole } from '../../types';

const PROFILE_SELECT = 'id, full_name, avatar_url, phone, city, state, role, created_at';

function readRole(value: unknown): UserRole {
  return value === 'company_owner' || value === 'admin' ? value : 'traveler';
}

function toAuthUser(row: Record<string, unknown>, email: string): AuthUser {
  return {
    id: String(row.id),
    email,
    role: readRole(row.role),
    fullName: (row.full_name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
  };
}

export async function getProfile(): Promise<{ data: AuthUser | null; error: string | null }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { data: null, error: 'No active session. Please log in.' };
    }

    const profileResponse = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileResponse.error) {
      return { data: null, error: friendlyError(profileResponse.error.message) };
    }

    if (profileResponse.data) {
      return { data: toAuthUser(profileResponse.data, session.user.email ?? ''), error: null };
    }

    return {
      data: {
        id: session.user.id,
        email: session.user.email ?? '',
        role: 'traveler',
        fullName: (session.user.user_metadata?.full_name as string) ?? null,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: friendlyThrown(err) };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return { data: null, error: friendlyError(authError.message) };
    if (!authData.user) return { data: null, error: 'Sign in failed. Please try again.' };

    const profileResponse = await getProfile();
    return profileResponse;
  } catch (err) {
    return { data: null, error: friendlyThrown(err) };
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  city?: string,
  state?: string
) {
  try {
    if (password.length < 6) {
      return { data: null, error: 'Password must be at least 6 characters.' };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) return { data: null, error: friendlyError(authError.message) };
    if (!authData.user) return { data: null, error: 'Sign up failed. Please try again.' };

    const upsertResponse = await supabase
      .from('users')
      .upsert(
        {
          id: authData.user.id,
          full_name: fullName,
          phone: phone ?? null,
          city: city ?? null,
          state: state ?? null,
          role: 'traveler',
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (upsertResponse.data) {
      return { data: toAuthUser(upsertResponse.data, authData.user.email ?? ''), error: null };
    }

    return {
      data: {
        id: authData.user.id,
        email: authData.user.email ?? '',
        role: 'traveler' as UserRole,
        fullName,
        phone: phone ?? null,
        city: city ?? null,
        state: state ?? null,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: friendlyThrown(err) };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) return { error: friendlyError(error.message) };
  return { error: null };
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { error: friendlyError(error.message) };
    return { error: null };
  } catch (err) {
    return { error: friendlyThrown(err) };
  }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: friendlyError(error.message) };
  return { error: null };
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { error: friendlyError(error.message) };
  return { error: null };
}
