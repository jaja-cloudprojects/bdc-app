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
      throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
    }
    _supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

// Signed URL TTL for document access: 1 hour
const SIGNED_URL_TTL = 3600;

export async function uploadDocument(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<string> {
  const supabase = getClient();
  const bucket = env.supabaseDocumentsBucket;

  // Ensure the bucket exists as PRIVATE (access via signed URLs only)
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, { public: false });
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Supabase document upload failed: ${error.message}`);

  // Return the storage path so we can generate fresh signed URLs on demand
  return storagePath;
}

export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(env.supabaseDocumentsBucket)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }
  return data.signedUrl;
}

export async function deleteDocument(storagePath: string): Promise<void> {
  const supabase = getClient();
  await supabase.storage.from(env.supabaseDocumentsBucket).remove([storagePath]);
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
