import { db } from "./db";
import { places } from "@shared/schema";
import { eq } from "drizzle-orm";

// Array of high-quality playground images
const playgroundImages = [
  "/assets/playground2.png",
  "/assets/playground3.png", 
  "/assets/playground4.png"
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