import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const profileImagesDir = path.join(uploadDir, 'profile-images');
const placeImagesDir = path.join(uploadDir, 'place-images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir);
}

if (!fs.existsSync(placeImagesDir)) {
  fs.mkdirSync(placeImagesDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profileImage') {
      cb(null, profileImagesDir);
    } else if (file.fieldname === 'placeImage') {
      cb(null, placeImagesDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Setup upload middleware
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB max file size
  }
});

// Get public URLs for files
export const getFileUrl = (filename: string, type: 'profile-image' | 'place-image' | 'other' = 'other'): string => {
  if (!filename) return '';
  
  // If the filename already starts with http or https, it's an external URL
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  const baseUrl = process.env.BASE_URL || '';
  let filepath = '';
  
  if (type === 'profile-image') {
    filepath = `${baseUrl}/uploads/profile-images/${filename}`;
    
    // Check if file exists (for profile images)
    const fullPath = path.join(process.cwd(), 'uploads', 'profile-images', path.basename(filename));
    if (!fs.existsSync(fullPath)) {
      console.log(`[FILE_SERVER] File not found: ${fullPath}, using default image`);
      // Return a default profile image
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(path.basename(filename, path.extname(filename)))}&background=random`;
    }
  } else if (type === 'place-image') {
    filepath = `${baseUrl}/uploads/place-images/${filename}`;
    
    // Check if file exists (for place images)
    const fullPath = path.join(process.cwd(), 'uploads', 'place-images', path.basename(filename));
    if (!fs.existsSync(fullPath)) {
      console.log(`[FILE_SERVER] File not found: ${fullPath}, using default image`);
      // Return a default place image
      return 'https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop';
    }
  } else {
    filepath = `${baseUrl}/uploads/${filename}`;
  }
  
  return filepath;
};

// Utility function to delete old profile image
export const deleteProfileImage = (filename: string): void => {
  if (!filename) return;
  
  const filePath = path.join(profileImagesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Utility function to delete old place image
export const deletePlaceImage = (filename: string): void => {
  if (!filename) return;
  
  const filePath = path.join(placeImagesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};