import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthResponse, LoginInput, RegisterInput, UserProfile } from './auth.types.js';

const PROFILE_SELECT = 'id, username, display_name, avatar_url, bio, created_at, updated_at';

export const authRepository = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username,
          display_name: input.display_name ?? input.username,
        },
      },
    });

    if (error || !data.user) {
      throw new AppError(error?.message ?? 'Unable to register user', 400, error);
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      username: input.username,
      display_name: input.display_name ?? input.username,
      avatar_url: input.avatar_url ?? null,
      bio: input.bio ?? null,
    });

    if (profileError) {
      throw new AppError('Unable to create user profile', 500, profileError);
    }

    const { data: profileData, error: profileFetchError } = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', data.user.id)
      .single();

    if (profileFetchError || !profileData) {
      throw new AppError('Unable to load user profile', 500, profileFetchError);
    }

    return {
      access_token: data.session?.access_token ?? '',
      refresh_token: data.session?.refresh_token ?? '',
      user: profileData as UserProfile,
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session || !data.user) {
      throw new AppError(error?.message ?? 'Invalid email or password', 401, error);
    }

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', data.user.id)
      .single();

    if (profileError || !profileData) {
      throw new AppError('Unable to load user profile', 500, profileError);
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profileData as UserProfile,
    };
  },

  async me(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new AppError('User profile not found', 404, error);
    }

    return data as UserProfile;
  },

  async healthCheck() {
    return { status: 'ok', feature: 'auth' };
  },
};
