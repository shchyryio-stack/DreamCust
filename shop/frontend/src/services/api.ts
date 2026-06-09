const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Products ───────────────────────────────────────────────

export async function fetchProducts(params: Record<string, string> = {}) {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProductBySlug(slug: string) {
  const res = await fetch(`${API_URL}/products/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

// ─── Filters (Schema-Driven) ────────────────────────────────

/**
 * Fetches the dynamic filter schema + aggregated values for a specific category.
 * Returns: { category, filters: [...], values: { minPrice, maxPrice, ... } }
 */
export async function fetchCategoryFilters(category: string) {
  const res = await fetch(`${API_URL}/filters/${category.toLowerCase()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch category filters');
  return res.json();
}

/**
 * Legacy filter aggregation for the general catalog page.
 * Returns: { brands: [...], minPrice, maxPrice }
 */
export async function fetchFilters(category?: string) {
  const url = category && category.toLowerCase() !== 'all'
    ? `${API_URL}/products/filters?category=${category}`
    : `${API_URL}/products/filters`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch filters');
  return res.json();
}

// ─── Configurator ───────────────────────────────────────────

export async function fetchCompatibleParts(category: string, currentBuildIds: string[]) {
  const res = await fetch(`${API_URL}/configurator/compatible`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, currentBuildIds }),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch compatible parts');
  return res.json();
}

export async function validateBuild(buildIds: string[]) {
  const res = await fetch(`${API_URL}/configurator/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buildIds }),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to validate build');
  return res.json();
}

// ─── Orders ─────────────────────────────────────────────────

export async function createOrder(orderData: any) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create order');
  }
  return res.json();
}

export async function getOrders() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/orders`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch orders');
  }
  return res.json();
}

export async function cancelOrder(orderId: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: 'PUT',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to cancel order');
  }
  return res.json();
}

// ─── Reviews ────────────────────────────────────────────────

export async function submitReview(productId: string, rating: number, comment: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/products/${productId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to submit review');
  }
  return res.json();
}

export async function submitReviewComment(productId: string, reviewId: string, text: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/products/${productId}/reviews/${reviewId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to add comment');
  }
  return res.json();
}
