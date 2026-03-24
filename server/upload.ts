import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'papa-hi-images';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── MIME allowlist ────────────────────────────────────────────────────────────
// First-pass filter: reject anything not on the explicit allowlist.
// This runs before the file hits memory, so it saves buffering cost for
// obvious rejects. It is NOT sufficient alone — MIME is client-supplied.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

// ── Magic-byte validation ─────────────────────────────────────────────────────
// Second-pass filter: inspect the actual file bytes in the buffer.
// A client can send any string as Content-Type, but cannot fake magic bytes.
//
// Signatures:
//   JPEG  FF D8 FF
//   PNG   89 50 4E 47 0D 0A 1A 0A
//   GIF   47 49 46 38  ("GIF8")
//   WebP  52 49 46 46 ?? ?? ?? ?? 57 45 42 50  ("RIFF....WEBP")
function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';

  // PNG
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'image/png';

  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';

  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';

  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadToSupabase(
  file: Express.Multer.File,
  category: 'profile' | 'place'
): Promise<string> {
  // Validate magic bytes — rejects spoofed MIME types regardless of the
  // Content-Type header the client sent.
  const detectedMime = detectImageMime(file.buffer);
  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    throw new Error('Invalid image file: content does not match an allowed image format');
  }

  // Use the detected MIME type, not the client-supplied one, when writing to storage.
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png':  '.png',
    'image/webp': '.webp',
    'image/gif':  '.gif',
  };
  const ext = mimeToExt[detectedMime];
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `${category}-${uniqueSuffix}${ext}`;
  const filePath = `${category}s/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: detectedMime,
      upsert: false,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export const getFileUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return url;
};

export async function deleteFromSupabase(publicUrl: string): Promise<void> {
  if (!publicUrl || !publicUrl.includes(BUCKET_NAME)) return;

  try {
    const parts = publicUrl.split(`${BUCKET_NAME}/`);
    if (parts.length < 2) return;
    const filePath = parts[1];

    await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
  } catch (err) {
    console.error('Error deleting from Supabase storage:', err);
  }
}
