#!/usr/bin/env node

/**
 * Product Image Upload Utility
 * Downloads images from URLs and uploads to Supabase Storage
 * Images are named using product slugs for easy reference
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const STORAGE_BUCKET = 'sneakers';
const TEMP_DIR = '/tmp/product-images-temp';

/**
 * Download image from URL to local file
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        file.close();
        fs.unlinkSync(filepath);
        return downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Check if image already exists in storage
 */
async function imageExists(storagePath) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list('products', {
      search: path.basename(storagePath)
    });

  if (error) {
    return false;
  }

  return data && data.length > 0;
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(filepath, storagePath) {
  const fileBuffer = fs.readFileSync(filepath);
  const contentType = 'image/jpeg'; // Most product images are JPEG
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return publicUrl;
}

/**
 * Process and upload a product image
 */
async function processProductImage(product, imageUrl) {
  const slug = `${product.name}-${product.colorway}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${slug}.jpg`;
  const tempPath = path.join(TEMP_DIR, filename);
  const storagePath = `products/${filename}`;

  try {
    // Check if image already exists in storage
    const exists = await imageExists(storagePath);
    if (exists) {
      console.log(`  ✓ Already exists: ${product.name} - ${product.colorway}`);
      // Return public URL without re-uploading
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);
      return publicUrl;
    }

    // Download image
    console.log(`  Downloading: ${product.name} - ${product.colorway}`);
    await downloadImage(imageUrl, tempPath);

    // Upload to Supabase Storage
    console.log(`  Uploading to storage: ${storagePath}`);
    const publicUrl = await uploadToStorage(tempPath, storagePath);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return publicUrl;
  } catch (error) {
    console.error(`  ⚠️  Failed to download ${product.name}: ${error.message}`);
    console.log(`  → Using placeholder image instead`);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    // Return placeholder image URL (placehold.co is reliable)
    return `https://placehold.co/800x800/e5e5e5/666666?text=${encodeURIComponent(product.name)}`;
  }
}

/**
 * Ensure storage bucket exists and is configured
 */
async function ensureBucketExists() {
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

  if (!bucketExists) {
    console.log(`Creating storage bucket: ${STORAGE_BUCKET}`);
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (error) {
      console.error('Failed to create bucket:', error);
      throw error;
    }
  }
}

/**
 * Create temp directory if it doesn't exist
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Clean up temp directory
 */
function cleanupTempDir() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

module.exports = {
  processProductImage,
  ensureBucketExists,
  ensureTempDir,
  cleanupTempDir,
  imageExists,
  STORAGE_BUCKET
};
