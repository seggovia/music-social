export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_preference: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export interface AuthMeResponse {
  user: UserProfile;
}

export interface AuthHealthResponse {
  status: string;
  feature: string;
}
