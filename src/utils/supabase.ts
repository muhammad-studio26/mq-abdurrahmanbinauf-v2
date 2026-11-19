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

const DEFAULT_LOGO_BUCKETS = ['assets', 'logo', 'logos', 'images', 'public', 'markaz'];
const IMAGE_FILE_REGEX = /\.(png|jpe?g|webp|svg|gif)$/i;

/**
 * Resolves a logo input into a valid public URL:
 * - Full http(s):// or data:image/ URLs are normalized and validated.
 * - Relative Supabase Storage paths (/storage/v1/object/public/...) are prefixed with the Supabase project URL.
 * - Bucket/object paths (e.g. "assets/logo.png" or "logo.png") are resolved via
 *   `supabase.storage.from(bucket).getPublicUrl(path)`.
 * Returns an empty string if the input is empty or malformed.
 */
export function resolveSupabaseLogoUrl(
  sbUrl: string,
  sbKey: string,
  rawLogoInput: string
): string {
  const trimmed = rawLogoInput.trim();
  if (!trimmed) return '';

  // Allow inline data URIs for images
  if (/^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  const cleanSbUrl = normalizeSupabaseUrl(sbUrl);

  // Full HTTP/HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      // Clean accidental /rest/v1/ before /storage/v1/
      parsed.pathname = parsed.pathname
        .replace(/\/rest\/v1\/storage\/v1\//i, '/storage/v1/')
        .replace(/\/{2,}/g, '/');
      return parsed.toString();
    } catch {
      return '';
    }
  }

  // Relative Supabase Storage path (e.g. /storage/v1/object/public/assets/logo.png)
  if (/^\/?storage\/v1\/object\//i.test(trimmed)) {
    if (!cleanSbUrl) return '';
    const cleanPath = trimmed.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
    return `${cleanSbUrl}/${cleanPath}`;
  }

  // Supabase Storage "bucket/path/to/logo.png" or bare "logo.png" (defaults to "assets" bucket)
  const cleanRelative = trimmed.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  if (!cleanRelative || cleanRelative.includes(' ')) return '';

  const segments = cleanRelative.split('/').filter(Boolean);
  const bucket = segments.length > 1 ? segments[0] : DEFAULT_LOGO_BUCKETS[0];
  const objectPath =
    segments.length > 1 ? segments.slice(1).join('/') : segments[0];

  if (!bucket || !objectPath) return '';

  const client = getSupabaseClient(sbUrl, sbKey);
  if (client) {
    const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  }

  if (cleanSbUrl) {
    return `${cleanSbUrl}/storage/v1/object/public/${encodeURIComponent(
      bucket
    )}/${objectPath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/')}`;
  }

  return '';
}

/**
 * Attempts to locate a public logo image in Supabase Storage buckets when
 * no custom logo URL has been saved locally.
 * Returns a valid public URL or '' if none is found/accessible.
 */
export async function discoverSupabaseStorageLogoUrl(
  sbUrl: string,
  sbKey: string
): Promise<string> {
  const client = getSupabaseClient(sbUrl, sbKey);
  if (!client) return '';

  const candidateBuckets = new Set<string>(DEFAULT_LOGO_BUCKETS);

  try {
    const { data: buckets } = await client.storage.listBuckets();
    if (Array.isArray(buckets)) {
      buckets.forEach((b) => {
        if (b?.name) candidateBuckets.add(b.name);
      });
    }
  } catch {
    // Anon key may not have listBuckets permission; fall back to probing known bucket names
  }

  for (const bucket of candidateBuckets) {
    try {
      const { data: files, error } = await client.storage
        .from(bucket)
        .list('', { limit: 50 });

      if (error || !Array.isArray(files) || files.length === 0) continue;

      const imageFiles = files.filter(
        (f) => f && typeof f.name === 'string' && IMAGE_FILE_REGEX.test(f.name)
      );
      if (imageFiles.length === 0) continue;

      const preferred =
        imageFiles.find((f) => /logo|markaz/i.test(f.name)) || imageFiles[0];

      const { data } = client.storage.from(bucket).getPublicUrl(preferred.name);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch {
      // Ignore inaccessible bucket and continue probing
    }
  }

  return '';
}

