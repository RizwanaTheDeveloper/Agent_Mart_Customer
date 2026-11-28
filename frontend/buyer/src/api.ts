import { sellerAddress } from './seller/config';
import { createReadCache } from './request-cache';
import type { BuyerListing } from './data/listings';

export type BuyerUser = { id: string; name: string; email: string };
export type BuyerSession = { token: string; user: BuyerUser; expires: number };
export type BuyerEnquiry = { id: string; propertyId: string; message: string; created: string; status: string; stage: string };
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function buyerApi<T>(path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const base = process.env.EXPO_PUBLIC_API_URL || sellerAddress().url;
    const response = await fetch(new URL(`/api/buyer/${path}`, base).toString(), {
      method: options.method || 'GET', signal: controller.signal,
      headers: { ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    let result;
    try { result = await response.json(); } catch { throw new ApiError('The backend did not return JSON. Check the API address and database setup.', response.status); }
    if (!response.ok) throw new ApiError(result.error || 'Request failed.', response.status);
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Cannot reach the backend. Keep the server running and connect your phone to the same Wi-Fi.');
  } finally { clearTimeout(timer); }
}
// Only simultaneous public catalogue reads are shared. Manual refresh stays fresh.
const readPublished = createReadCache<BuyerListing[]>(0, 1);
export function publishedListings() {
  const base = process.env.EXPO_PUBLIC_API_URL || sellerAddress().url;
  return readPublished(base, loadPublishedListings);
}

async function loadPublishedListings() {
  const listings: BuyerListing[] = [];
  let offset: number | null = 0;
  do {
    const page: { listings: BuyerListing[]; nextOffset: number | null } = await buyerApi(`listings?limit=100&offset=${offset}`);
    listings.push(...page.listings);
    offset = page.nextOffset;
  } while (offset !== null);
  return listings;
}
