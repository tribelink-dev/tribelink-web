import axios from 'axios';
import api from '@/lib/api';
import {
  isCloudinaryDirectUploadConfigured,
  uploadFileToCloudinary,
} from '@/lib/cloudinaryDirectUpload';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_ROOT = RAW_API_URL.replace(/\/api\/?$/, '');

/**
 * Upload photos for abode register/edit flows.
 *
 * Two modes (chosen automatically):
 *
 *  1. **Direct-to-Cloudinary** (preferred). Used when
 *     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 *     are set. Uploads go browser → Cloudinary edge in parallel (capped),
 *     bypassing Render's tiny dyno. Fast, reliable, real per-byte progress.
 *
 *  2. **Backend proxy** (fallback). Sequential one-at-a-time POSTs to our
 *     /abodes/upload-photo, with retry. Used only when Cloudinary direct
 *     env vars are absent — it's the legacy path and is slow on free tier.
 *
 * Either way, the call returns a list of {url, caption} that's safe to send
 * to the JSON register/update endpoint (backend already trusts cloudinary.com
 * URLs via routes/adobes.js#isTrustedAbodeImageUrl).
 */

export interface UploadedPhoto {
  url: string;
  caption: string;
}

export interface UploadProgress {
  current: number;
  total: number;
  attempt: number;
  fileName: string;
  /** 0..1 fraction for the current file (only direct-upload mode) */
  fileProgress?: number;
}

export interface UploadPhotosOptions {
  endpoint?: string;
  maxAttempts?: number;
  retryDelayMs?: number;
  /** Concurrency for direct-upload mode. Default 3. Backend mode is always 1. */
  parallel?: number;
  /** Cloudinary folder for direct uploads. Default 'triberoutes/abodes'. */
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
}

const DEFAULT_ENDPOINT = '/abodes/upload-photo';
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1500;
const DEFAULT_PARALLEL = 3;
const DEFAULT_FOLDER = 'triberoutes/abodes';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Hit a cheap GET to wake a sleeping Render dyno before doing heavy uploads.
 * Best-effort: failure is ignored; the actual upload still runs.
 *
 * Bypasses the api instance's baseURL because /ping and /health live at the
 * server root, not under /api.
 */
export async function prewarmBackend(timeoutMs = 60000): Promise<void> {
  try {
    await axios.get(`${BACKEND_ROOT}/ping`, { timeout: timeoutMs });
  } catch {
    try {
      await axios.get(`${BACKEND_ROOT}/health`, { timeout: timeoutMs });
    } catch {
      /* ignore — proceed with upload anyway */
    }
  }
}

function isRetriableError(err: unknown): boolean {
  const e = err as {
    code?: string;
    message?: string;
    isNetworkError?: boolean;
    response?: { status?: number };
  };
  if (!e) return false;
  // The global axios response interceptor in lib/api.ts wraps network/timeout
  // failures into a friendlier Error and sets isNetworkError=true. We honor
  // that flag explicitly so retry logic isn't fragile to message wording.
  if (e.isNetworkError) return true;
  if (e.code === 'ECONNABORTED') return true;
  if (e.code === 'ECONNREFUSED') return true;
  if (e.message === 'Network Error') return true;
  if (e.message?.includes('Network')) return true;
  const lowered = e.message?.toLowerCase();
  if (lowered?.includes('timeout') || lowered?.includes('timed out')) return true;
  const status = e.response?.status;
  if (!status) return true;
  if (status === 408 || status === 429) return true;
  if (status >= 500 && status < 600) return true;
  return false;
}

/**
 * Generic retry wrapper. Re-runs `fn` up to `maxAttempts` with linear backoff
 * for retriable errors (network blips, 5xx, 408/429, cold-start timeouts).
 *
 * Used by callers that need a non-photo POST/PUT to be resilient on Render
 * free tier — primarily the final abode register/update JSON request.
 */
export interface RetryOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  onAttempt?: (info: { attempt: number; willRetry: boolean; error: unknown }) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const willRetry = attempt < maxAttempts && isRetriableError(err);
      options.onAttempt?.({ attempt, willRetry, error: err });
      if (willRetry) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/** Upload one file via the backend route, with retry. Used by fallback path. */
async function uploadOneViaBackend(
  file: File,
  index: number,
  total: number,
  endpoint: string,
  maxAttempts: number,
  retryDelayMs: number,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadedPhoto> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onProgress?.({ current: index + 1, total, attempt, fileName: file.name });
    try {
      const fd = new FormData();
      fd.append('image', file);
      const response = await api.post(endpoint, fd);
      const url: string | undefined = response.data?.url;
      if (!url) throw new Error(response.data?.message || 'Upload did not return a URL');
      return { url, caption: file.name };
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetriableError(err)) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      break;
    }
  }
  const e = lastError as { response?: { data?: { message?: string } }; message?: string };
  const detail = e.response?.data?.message || e.message || 'Unknown error';
  throw new Error(`Failed to upload "${file.name}" after ${maxAttempts} attempt(s): ${detail}`);
}

/** Upload one file directly to Cloudinary, with retry + per-byte progress. */
async function uploadOneViaCloudinary(
  file: File,
  index: number,
  total: number,
  folder: string,
  maxAttempts: number,
  retryDelayMs: number,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadedPhoto> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onProgress?.({ current: index + 1, total, attempt, fileName: file.name, fileProgress: 0 });
    try {
      const result = await uploadFileToCloudinary(file, {
        folder,
        onProgress: (fraction) => {
          onProgress?.({
            current: index + 1,
            total,
            attempt,
            fileName: file.name,
            fileProgress: fraction,
          });
        },
      });
      return { url: result.url, caption: file.name };
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetriableError(err)) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      break;
    }
  }
  const e = lastError as { message?: string };
  throw new Error(
    `Failed to upload "${file.name}" after ${maxAttempts} attempt(s): ${e.message || 'Unknown error'}`
  );
}

/** Generic concurrency limiter. Preserves input order in the result array. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function uploadPhotosWithRetry(
  files: File[],
  options: UploadPhotosOptions = {}
): Promise<UploadedPhoto[]> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const folder = options.folder ?? DEFAULT_FOLDER;
  const onProgress = options.onProgress;

  if (isCloudinaryDirectUploadConfigured()) {
    const parallel = Math.max(1, options.parallel ?? DEFAULT_PARALLEL);
    return mapWithConcurrency(files, parallel, (file, i) =>
      uploadOneViaCloudinary(file, i, files.length, folder, maxAttempts, retryDelayMs, onProgress)
    );
  }

  // Legacy fallback: serial backend uploads.
  const results: UploadedPhoto[] = [];
  for (let i = 0; i < files.length; i++) {
    results.push(
      await uploadOneViaBackend(
        files[i],
        i,
        files.length,
        endpoint,
        maxAttempts,
        retryDelayMs,
        onProgress
      )
    );
  }
  return results;
}
