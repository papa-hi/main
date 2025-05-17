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

// Update all playground images in database with different images
async function updatePlaygroundImagesWithVariety() {
  try {
    console.log("Starting playground image variety update...");
    
    // Get all playgrounds
    const playgrounds = await db
      .select()
      .from(places)
      .where(eq(places.type, "playground"));
    
    console.log(`Found ${playgrounds.length} playgrounds to update`);
    
    // Make a copy of the images array we can modify
    const availableImages = [...playgroundImages];
    
    // Update each playground with a different image when possible
    let updatedCount = 0;
    for (let i = 0; i < playgrounds.length; i++) {
      const playground = playgrounds[i];
      
      // Use modulo to cycle through images if we have more playgrounds than images
      const imageIndex = i % availableImages.length;
      const selectedImage = availableImages[imageIndex];
      
      console.log(`Updating playground ${playground.id} (${playground.name}) with image ${imageIndex+1}: ${selectedImage}`);
      
      await db
        .update(places)
        .set({ imageUrl: selectedImage })
        .where(eq(places.id, playground.id));
      
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} playground images with variety`);
  } catch (error) {
    console.error("Error updating playground images:", error);
  } finally {
    process.exit(0);
  }
}

// Run the update function
updatePlaygroundImagesWithVariety();