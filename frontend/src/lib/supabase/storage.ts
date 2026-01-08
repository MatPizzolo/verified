import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'sneakers'

/**
 * Resolves a relative storage path to a full public URL
 * 
 * @param path - Relative path from Supabase Storage (e.g., "products/nike-dunk-low.webp")
 * @returns Full public URL to access the image
 * 
 * @example
 * const imageUrl = getPublicUrl("products/nike-dunk-low.webp")
 * // Returns: https://[project-ref].supabase.co/storage/v1/object/public/sneakers/products/nike-dunk-low.webp
 */
export function getPublicUrl(path: string | null): string {
  if (!path) {
    return '/placeholder.svg'
  }

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const supabase = createClient()
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Helper to get optimized image URL with transformations
 * Supabase Storage supports image transformations via URL parameters
 * 
 * @param path - Relative path from Supabase Storage
 * @param options - Transformation options
 * @returns URL with transformation parameters
 */
export function getOptimizedImageUrl(
  path: string | null,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  }
): string {
  const baseUrl = getPublicUrl(path)
  
  if (baseUrl === '/placeholder.svg') {
    return baseUrl
  }

  // Build transformation parameters
  const params = new URLSearchParams()
  
  if (options?.width) params.append('width', options.width.toString())
  if (options?.height) params.append('height', options.height.toString())
  if (options?.quality) params.append('quality', options.quality.toString())
  if (options?.format) params.append('format', options.format)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}
