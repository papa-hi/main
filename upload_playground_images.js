import fs from 'fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { imageStorage, places } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function uploadPlaygroundImages() {
  try {
    const playgroundImages = [
      { filename: 'playground1.png', path: './playground1.png' },
      { filename: 'playground2.png', path: './playground2.png' },
      { filename: 'playground3.png', path: './playground3.png' },
      { filename: 'playground4.png', path: './playground4.png' }
    ];

    for (const img of playgroundImages) {
      if (fs.existsSync(img.path)) {
        const imageBuffer = fs.readFileSync(img.path);
        const dataBase64 = imageBuffer.toString('base64');
        
        // Insert or update image in database
        await db.insert(imageStorage).values({
          filename: img.filename,
          originalName: img.filename,
          mimeType: 'image/png',
          size: imageBuffer.length,
          dataBase64: dataBase64,
          uploadedBy: 1, // System user
          category: 'playground'
        }).onConflictDoUpdate({
          target: imageStorage.filename,
          set: {
            dataBase64: dataBase64,
            size: imageBuffer.length
          }
        });
        
        console.log(`Uploaded ${img.filename} to database`);
      }
    }

    // Update playground places to use database images
    const playgroundPlaces = await db.select().from(places).where(eq(places.type, 'playground'));
    
    for (let i = 0; i < playgroundPlaces.length; i++) {
      const imageNumber = (i % 4) + 1;
      const imageUrl = `/api/images/playground${imageNumber}.png`;
      
      await db.update(places)
        .set({ imageUrl: imageUrl })
        .where(eq(places.id, playgroundPlaces[i].id));
      
      console.log(`Updated playground ${playgroundPlaces[i].name} with ${imageUrl}`);
    }

    console.log('All playground images uploaded and assigned successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading playground images:', error);
    process.exit(1);
  }
}

uploadPlaygroundImages();