import 'dotenv/config';

const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env variable: ${name}`);
  return v;
}

// Fails at startup in production if env var is absent — dev-only fallback allowed otherwise
function prodRequired(name: string, devFallback: string): string {
  const v = process.env[name];
  if (!v) {
    if (isProd) throw new Error(`Missing required env variable in production: ${name}`);
    return devFallback;
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: !isProd,

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: prodRequired('JWT_SECRET', 'dev-only-secret-do-not-use-in-production'),
  jwtRefreshSecret: prodRequired('JWT_REFRESH_SECRET', 'dev-only-refresh-do-not-use-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',

  // In production CORS_ORIGIN must be set explicitly — no wildcard fallback
  corsOrigin: prodRequired('CORS_ORIGIN', '*').split(',').map((s) => s.trim()),

  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000',

  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,

  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@beauteducil.com',
  adminPassword: prodRequired('ADMIN_PASSWORD', 'BDCDevAdmin'),

  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseAvatarBucket: process.env.SUPABASE_AVATAR_BUCKET ?? 'avatars',
  supabaseDocumentsBucket: process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'documents',
};
