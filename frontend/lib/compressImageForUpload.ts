/**
 * Resize and re-encode photos before multipart upload to avoid proxy/API timeouts.
 * GIFs and non-images are returned unchanged.
 */

const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_QUALITY = 0.82;
/** Skip work for already-small files */
const DEFAULT_SKIP_BELOW = 350 * 1024;

export async function compressImageFile(
  file: File,
  options?: {
    maxEdge?: number;
    quality?: number;
    skipBelowBytes?: number;
  }
): Promise<File> {
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const skipBelow = options?.skipBelowBytes ?? DEFAULT_SKIP_BELOW;

  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }
  if (file.size <= skipBelow) {
    return file;
  }

  const img = await loadImageFromFile(file);

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) return file;

  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  if (file.type === 'image/png') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await canvasToJpegBlob(canvas, quality);
  if (!blob) return file;
  if (blob.size >= file.size * 0.95) {
    return file;
  }

  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    el.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });
}
