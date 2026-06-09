/**
 * Shared product image utilities.
 * Centralizes image resolution logic so Builder, Catalog, Product Page,
 * and sidebar all render the same image for a given product.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace(/\/api$/, '');

/**
 * Returns the best available image URL for a product, fully resolved.
 * Checks (in order):
 *   1. variants[0].gallery → primary image → first image
 *   2. product.thumbnail
 *   3. product.media?.images[0]
 *   4. product.images[0]
 *   5. null (no image available)
 */
export function getProductImageUrl(product: any): string | null {
  const raw = getProductImageRaw(product);
  if (!raw) return null;
  return resolveImageUrl(raw);
}

/**
 * Returns the raw (relative) image path for a product.
 */
export function getProductImageRaw(product: any): string | null {
  // 1. Try variant gallery (primary image first, then first image)
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    for (const variant of product.variants) {
      if (variant.gallery && Array.isArray(variant.gallery) && variant.gallery.length > 0) {
        // Look for primary image first
        const primary = variant.gallery.find((img: any) => img.isPrimary);
        if (primary) {
          const url = typeof primary === 'string' ? primary : primary.url;
          if (url) return url;
        }
        // Fall back to first gallery image
        const first = variant.gallery[0];
        const url = typeof first === 'string' ? first : first?.url;
        if (url) return url;
      }
    }
  }

  // 2. Try thumbnail
  if (product.thumbnail) return product.thumbnail;

  // 3. Try media.images
  if (product.media?.images && Array.isArray(product.media.images) && product.media.images.length > 0) {
    return product.media.images[0];
  }

  // 4. Try top-level images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }

  return null;
}

/**
 * Resolves a relative image path to a full URL.
 * If the path is already absolute (starts with http), returns it as-is.
 */
export function resolveImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * SVG fallback placeholder (base64-encoded) for missing images.
 */
export const IMAGE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxZjVmOSIgLz48dGV4dCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2QxZDVkYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKThjwvdGV4dD48L3N2Zz4=';

/**
 * onError handler for <img> tags — swaps to placeholder.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  e.currentTarget.src = IMAGE_PLACEHOLDER;
}
