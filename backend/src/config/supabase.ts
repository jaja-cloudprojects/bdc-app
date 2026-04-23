import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { env } from './env';

// Avatar constraints: 400×400 px WebP, quality 82 → ~15-25 KB typically
const AVATAR_SIZE = 400;
const AVATAR_QUALITY = 82;

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour l\'upload d\'avatars.');
    }
    _supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

export async function uploadAvatar(
  userId: string,
  fileBuffer: Buffer,
  _mimeType: string,
): Promise<string> {
  const supabase = getClient();
  const compressed = await sharp(fileBuffer)
    .rotate()                          // auto-orient from EXIF before cropping
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: AVATAR_QUALITY, effort: 4 })
    .toBuffer();

  const storagePath = `${userId}/avatar.webp`;

  const { error } = await supabase.storage
    .from(env.supabaseAvatarBucket)
    .upload(storagePath, compressed, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(env.supabaseAvatarBucket)
    .getPublicUrl(storagePath);

  // Cache-bust so the app always fetches the latest version after update
  return `${data.publicUrl}?t=${Date.now()}`;
}
