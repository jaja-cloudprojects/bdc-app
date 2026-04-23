import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env variable: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',

  corsOrigin: (process.env.CORS_ORIGIN ?? '*').split(',').map((s) => s.trim()),

  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000',

  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,

  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@beauteducil.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'BDCAdmin',

  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseAvatarBucket: process.env.SUPABASE_AVATAR_BUCKET ?? 'avatars',
};
