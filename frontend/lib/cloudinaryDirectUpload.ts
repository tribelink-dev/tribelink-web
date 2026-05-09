/**
 * Direct browser → Cloudinary upload (bypasses our backend).
 *
 * Why this matters:
 *  - The previous flow streamed each photo through Render's tiny free-tier
 *    dyno (0.1 vCPU). Even a single 2MB photo could take 30-90s and often
 *    timed out.
 *  - Posting straight to https://api.cloudinary.com goes to Cloudinary's
 *    globally distributed edge — same path Airbnb / Discord / Notion use.
 *  - We get real per-byte upload progress, which the backend route never
 *    surfaced.
 *
 * Activation: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and
 * NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in Vercel. The preset must be
 * "Unsigned" mode in the Cloudinary dashboard. If either is missing the
 * caller should fall back to the legacy backend upload.
 *
 * Backend security: routes/adobes.js#isTrustedAbodeImageUrl already accepts
 * any *.cloudinary.com URL on the JSON register/update endpoints, so no
 * server-side change is needed.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryDirectUploadConfigured(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

export interface DirectUploadOptions {
  /** Cloudinary folder, e.g. 'triberoutes/abodes'. Optional if preset sets one. */
  folder?: string;
  /** 0..1 — fired multiple times during upload */
  onProgress?: (fraction: number) => void;
  /** AbortSignal to cancel mid-upload */
  signal?: AbortSignal;
}

export interface DirectUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Posts a single file to Cloudinary's unsigned upload endpoint.
 * Throws on network failure or non-2xx response.
 */
export function uploadFileToCloudinary(
  file: File,
  options: DirectUploadOptions = {}
): Promise<DirectUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return Promise.reject(
      new Error(
        'Cloudinary direct upload not configured (set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).'
      )
    );
  }

  // 'auto' resource_type lets Cloudinary detect images vs videos.
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  if (options.folder) fd.append('folder', options.folder);

  // We use XHR (not fetch) because fetch doesn't expose upload progress events.
  return new Promise<DirectUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        options.onProgress(Math.min(1, e.loaded / e.total));
      }
    };

    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error('Cloudinary returned an invalid response'));
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const msg = body?.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`;
        return reject(new Error(msg));
      }
      const url: string | undefined = body.secure_url || body.url;
      if (!url) {
        return reject(new Error('Cloudinary response did not include a URL'));
      }
      resolve({
        url,
        publicId: body.public_id,
        bytes: body.bytes,
        width: body.width,
        height: body.height,
      });
    };

    xhr.onerror = () => {
      // Mark this so retry helper recognises it as retriable.
      const err = new Error('Network error during Cloudinary upload') as Error & {
        isNetworkError?: boolean;
      };
      err.isNetworkError = true;
      reject(err);
    };
    xhr.ontimeout = () => {
      const err = new Error('Cloudinary upload timed out') as Error & { code?: string };
      err.code = 'ECONNABORTED';
      reject(err);
    };

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return reject(new Error('Upload aborted'));
      }
      options.signal.addEventListener(
        'abort',
        () => {
          xhr.abort();
          reject(new Error('Upload aborted'));
        },
        { once: true }
      );
    }

    // Generous timeout — direct uploads usually complete in seconds, but a
    // big photo on a slow uplink can take a minute or two.
    xhr.timeout = 5 * 60 * 1000;

    xhr.send(fd);
  });
}
