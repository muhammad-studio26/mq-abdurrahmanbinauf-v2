import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(sbUrl: string): string {
  return sbUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');
}

let cachedClientKey = '';
let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(
  sbUrl: string,
  sbKey: string
): SupabaseClient | null {
  const cleanUrl = normalizeSupabaseUrl(sbUrl);
  const cleanKey = sbKey.trim();
  if (!cleanUrl || !cleanKey) return null;

  const cacheKey = `${cleanUrl}::${cleanKey}`;
  if (cachedClient && cachedClientKey === cacheKey) {
    return cachedClient;
  }

  cachedClient = createClient(cleanUrl, cleanKey);
  cachedClientKey = cacheKey;
  return cachedClient;
}

export function formatSupabaseError(err: unknown): string {
  if (!err) return 'Terjadi kesalahan yang tidak diketahui.';
  if (typeof err === 'object') {
    const e = err as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    const parts = [
      e.code ? `[${e.code}]` : '',
      e.message || '',
      e.details ? `Detail: ${e.details}` : '',
      e.hint ? `Hint: ${e.hint}` : ''
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' — ');
  }
  return err instanceof Error ? err.message : String(err);
}

export async function supabaseFetch<T = unknown>(
  sbUrl: string,
  sbKey: string,
  table: string,
  options: RequestInit = {},
  query = ''
): Promise<T | null> {
  if (!sbUrl.trim() || !sbKey.trim()) return null;

  const cleanUrl = normalizeSupabaseUrl(sbUrl);
  const res = await fetch(`${cleanUrl}/rest/v1/${table}${query}`, {
    ...options,
    headers: {
      apikey: sbKey.trim(),
      Authorization: `Bearer ${sbKey.trim()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}
