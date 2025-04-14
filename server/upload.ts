import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const profileImagesDir = path.join(uploadDir, 'profile-images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profileImage') {
      cb(null, profileImagesDir);
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
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Get public URLs for files
export const getFileUrl = (filename: string, type: 'profile-image' | 'other' = 'other'): string => {
  if (!filename) return '';
  
  const baseUrl = process.env.BASE_URL || '';
  if (type === 'profile-image') {
    return `${baseUrl}/uploads/profile-images/${filename}`;
  } else {
    return `${baseUrl}/uploads/${filename}`;
  }
};

// Utility function to delete old profile image
export const deleteProfileImage = (filename: string): void => {
  if (!filename) return;
  
  const filePath = path.join(profileImagesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};