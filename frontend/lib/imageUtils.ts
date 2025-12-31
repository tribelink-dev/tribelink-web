/**
 * Utility functions for handling image URLs
 * 
 * This handles the conversion of relative image paths to full URLs,
 * with proper error handling and fallbacks for production deployments.
 */

/**
 * Get the base API URL without the /api suffix
 * This is used when we need to construct URLs from relative paths
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable
    return process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  }
  
  // Client-side: use environment variable or construct from current origin
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api', '');
  }
  
  // Fallback: try to construct from current origin (for same-domain deployments)
  if (window.location.origin) {
    return window.location.origin;
  }
  
  return 'http://localhost:5000';
}

/**
 * Convert a relative image URL to a full URL
 * Handles both relative paths and full URLs, as well as arrays
 * 
 * @param imageUrl - The image URL (can be relative like /uploads/xxx.webp, full URL, or array of URLs)
 * @returns Full URL or null if imageUrl is invalid
 */
export function getImageUrl(imageUrl?: string | string[] | null | any): string | null {
  if (!imageUrl) {
    return null;
  }
  
  // Handle array format - get first valid image
  if (Array.isArray(imageUrl)) {
    const firstImage = imageUrl.find(img => img) || imageUrl[0];
    if (!firstImage) return null;
    
    // Extract URL from object if needed
    if (typeof firstImage === 'object' && firstImage !== null) {
      imageUrl = firstImage.url || firstImage;
    } else {
      imageUrl = firstImage;
    }
  }
  
  // Handle object format
  if (typeof imageUrl === 'object' && imageUrl !== null) {
    imageUrl = imageUrl.url || imageUrl;
  }
  
  if (typeof imageUrl !== 'string') {
    return null;
  }
  
  // Already a full URL (http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Log in development to help debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[Frontend Image URL] Already full URL:', imageUrl);
    }
    return imageUrl;
  }
  
  // Handle relative paths
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const apiBase = getApiBaseUrl();
  
  // Remove double slashes
  const finalUrl = `${apiBase}${cleanUrl}`.replace(/([^:]\/)\/+/g, '$1');
  
  // Log in development to help debug
  if (process.env.NODE_ENV === 'development') {
    console.log('[Frontend Image URL] Constructed:', {
      original: imageUrl,
      apiBase: apiBase,
      final: finalUrl
    });
  }
  
  return finalUrl;
}

/**
 * Get image URL with error handling and fallback
 * Returns a placeholder image if the original fails to load
 * 
 * @param imageUrl - The image URL
 * @param fallbackUrl - Optional fallback image URL
 * @returns Full URL or fallback
 */
export function getImageUrlWithFallback(
  imageUrl?: string | null,
  fallbackUrl?: string
): string | null {
  const url = getImageUrl(imageUrl);
  if (url) {
    return url;
  }
  
  // Return fallback if provided
  if (fallbackUrl) {
    return getImageUrl(fallbackUrl) || fallbackUrl;
  }
  
  return null;
}

/**
 * Handle image load errors
 * Can be used as an onError handler for img tags
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string
): void {
  const img = event.currentTarget;
  
  // If there's a fallback and we haven't already tried it
  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }
  
  // Hide broken images or show placeholder
  img.style.display = 'none';
}

