import axios from 'axios';
import api from '@/lib/api';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_ROOT = RAW_API_URL.replace(/\/api\/?$/, '');

/**
 * Upload photos one-at-a-time with retry. Used by abode register/edit flows.
 *
 * Why sequential and not Promise.all:
 *  - Render free tier (shared 0.5 CPU) chokes on N concurrent multipart streams,
 *    causing some uploads to time out or fail with "Network Error". Promise.all
 *    rejects on the first failure, killing the entire submission and leaving the
 *    user staring at "Cannot connect to server" even though the backend is fine.
 *  - Sequential uploads + per-photo retry are dramatically more reliable on free
 *    hosting tiers, at the cost of slightly higher wall-clock time.
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
}

export interface UploadPhotosOptions {
  endpoint?: string;
  maxAttempts?: number;
  retryDelayMs?: number;
  onProgress?: (progress: UploadProgress) => void;
}

const DEFAULT_ENDPOINT = '/abodes/upload-photo';
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1500;

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

export async function uploadPhotosWithRetry(
  files: File[],
  options: UploadPhotosOptions = {}
): Promise<UploadedPhoto[]> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const onProgress = options.onProgress;

  const results: UploadedPhoto[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      onProgress?.({
        current: i + 1,
        total: files.length,
        attempt,
        fileName: file.name,
      });

      try {
        const fd = new FormData();
        fd.append('image', file);
        const response = await api.post(endpoint, fd);
        const url: string | undefined = response.data?.url;
        if (!url) {
          throw new Error(response.data?.message || 'Upload did not return a URL');
        }
        results.push({ url, caption: file.name });
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts && isRetriableError(err)) {
          await sleep(retryDelayMs * attempt);
          continue;
        }
        break;
      }
    }

    if (lastError) {
      const e = lastError as { response?: { data?: { message?: string } }; message?: string };
      const detail = e.response?.data?.message || e.message || 'Unknown error';
      throw new Error(
        `Failed to upload "${file.name}" after ${maxAttempts} attempt(s): ${detail}`
      );
    }
  }

  return results;
}
