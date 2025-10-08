import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { env } from './env';

function extFromContentType(ct: string) {
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('png')) return 'png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  return 'bin';
}

async function ensureBucketExists(supabase: any, bucket: string) {
  // Try create unconditionally; ignore conflict if it already exists
  const { error } = await supabase.storage.createBucket(bucket, { public: true });
  if (error && !String(error.message || '').toLowerCase().includes('exists')) {
    // non-conflict error can be ignored if bucket already exists; otherwise rethrow
    // As an extra check, attempt to getBucket
    const info = await supabase.storage.getBucket(bucket);
    if (info.error) throw error;
  }
}

export async function saveImage(tenantSlug: string, bytes: Uint8Array, contentType: string) {
  const e = env();
  const url = e.NEXT_PUBLIC_SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env not configured');
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  await ensureBucketExists(supabase, e.SUPABASE_STORAGE_BUCKET);
  const now = new Date();
  const ext = extFromContentType(contentType);
  const objectKey = `tenants/${tenantSlug}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${uuid()}.${ext}`;
  let { error } = await supabase
    .storage
    .from(e.SUPABASE_STORAGE_BUCKET)
    .upload(objectKey, bytes, { contentType, upsert: false });
  if (error && String(error.message || '').toLowerCase().includes('bucket not found')) {
    await ensureBucketExists(supabase, e.SUPABASE_STORAGE_BUCKET);
    ({ error } = await supabase.storage.from(e.SUPABASE_STORAGE_BUCKET).upload(objectKey, bytes, { contentType, upsert: false }));
  }
  if (error) throw error;
  const { data } = supabase.storage.from(e.SUPABASE_STORAGE_BUCKET).getPublicUrl(objectKey);
  return { key: objectKey, publicUrl: data.publicUrl };
}

export async function saveImageWebp(tenantSlug: string, webpBytes: Uint8Array) {
  return saveImage(tenantSlug, webpBytes, 'image/webp');
}
