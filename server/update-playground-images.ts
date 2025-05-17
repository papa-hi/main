import { db } from "./db";
import { places } from "@shared/schema";
import { eq } from "drizzle-orm";

// Array of high-quality playground images
const playgroundImages = [
  "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1572571981886-11d52968eb11?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596724878582-76f4a7a73e77?q=80&w=500&auto=format&fit=crop"
];

// Get a random playground image
function getRandomPlaygroundImage(): string {
  return playgroundImages[Math.floor(Math.random() * playgroundImages.length)];
}

// Update all playground images in database
async function updateAllPlaygroundImages() {
  try {
    console.log("Starting playground image update...");
    
    // Get all playgrounds
    const playgrounds = await db
      .select()
      .from(places)
      .where(eq(places.type, "playground"));
    
    console.log(`Found ${playgrounds.length} playgrounds to update`);
    
    // Update each playground with a random image
    let updatedCount = 0;
    for (const playground of playgrounds) {
      const randomImage = getRandomPlaygroundImage();
      console.log(`Updating playground ${playground.id} (${playground.name}) with image: ${randomImage}`);
      
      await db
        .update(places)
        .set({ imageUrl: randomImage })
        .where(eq(places.id, playground.id));
      
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} playground images`);
  } catch (error) {
    console.error("Error updating playground images:", error);
  } finally {
    process.exit(0);
  }
}

// Run the update function
updateAllPlaygroundImages();