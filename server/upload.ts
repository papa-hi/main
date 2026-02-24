import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'papa-hi-images';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

export async function uploadToSupabase(
  file: Express.Multer.File,
  category: 'profile' | 'place'
): Promise<string> {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const extension = path.extname(file.originalname);
  const filename = `${category}-${uniqueSuffix}${extension}`;
  const filePath = `${category}s/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
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
