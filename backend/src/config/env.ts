import 'dotenv/config';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function readNonNegativeInteger(key: string, fallback: number): number {
  const rawValue = process.env[key];
  if (rawValue === undefined || rawValue === '') return fallback;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  TRUST_PROXY_HOPS: readNonNegativeInteger('TRUST_PROXY_HOPS', 0),
  SUPABASE_URL: requireEnv('SUPABASE_URL', 'http://localhost:54321'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'placeholder-key'),
};
