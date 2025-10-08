#!/usr/bin/env tsx
/**
 * Fix Supabase Storage RLS
 */

import { createClient } from '@supabase/supabase-js';

async function fixStorageRLS() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'images';

  if (!url || !key) {
    console.error('❌ Supabase env not configured');
    process.exit(1);
  }

  console.log('🔍 Fixing Supabase Storage RLS...\n');
  console.log('URL:', url);
  console.log('Bucket:', bucket);

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  // Check if bucket exists
  console.log('\n1️⃣ Checking bucket...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    process.exit(1);
  }

  console.log('📦 Existing buckets:', buckets?.map(b => b.name).join(', '));

  const existingBucket = buckets?.find(b => b.name === bucket);

  if (!existingBucket) {
    console.log('\n⚠️  Bucket not found, creating...');
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      process.exit(1);
    }
    console.log('✅ Bucket created:', data);
  } else {
    console.log('\n✅ Bucket exists:', existingBucket.name);
    console.log('   Public:', existingBucket.public);
    console.log('   File size limit:', existingBucket.file_size_limit);
  }

  // Update bucket to be public and disable RLS
  console.log('\n2️⃣ Updating bucket settings...');
  const { data: updateData, error: updateError } = await supabase.storage.updateBucket(
    bucket,
    {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    }
  );

  if (updateError) {
    console.error('⚠️  Error updating bucket:', updateError);
  } else {
    console.log('✅ Bucket updated');
  }

  // Test upload
  console.log('\n3️⃣ Testing upload...');
  const testData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
  const testKey = `test-${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(testKey, testData, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    console.error('\n🚨 STORAGE RLS IS STILL BLOCKING UPLOADS!');
    console.log('\n📋 Manual fix required:');
    console.log('1. Go to: ' + url + '/project/_/storage/buckets');
    console.log('2. Click on bucket: ' + bucket);
    console.log('3. Go to "Policies" tab');
    console.log('4. Disable RLS or add permissive policies');
  } else {
    console.log('✅ Upload succeeded:', uploadData);

    // Clean up test file
    await supabase.storage.from(bucket).remove([testKey]);
    console.log('✅ Test file cleaned up');
    console.log('\n🎉 Storage is working correctly!');
  }
}

fixStorageRLS().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
