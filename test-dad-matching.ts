#!/usr/bin/env tsx

import { db } from "./server/db";
import { runDadMatchingForAllUsers, runDadMatchingForUser } from "./server/dad-matching-service";

async function testDadMatching() {
  console.log("=== Dad Matching Test ===");
  
  try {
    // Test matching for all users
    console.log("Running dad matching for all users...");
    const result = await runDadMatchingForAllUsers();
    
    console.log(`\nResults:`);
    console.log(`- Users processed: ${result.usersProcessed}`);
    console.log(`- Total matches created: ${result.totalMatches}`);
    
    if (result.totalMatches > 0) {
      console.log("\n✅ Dad matching system is working!");
      console.log("Check the console logs above for detailed match information.");
    } else {
      console.log("\n⚠️ No matches were created.");
      console.log("This could be because:");
      console.log("- Users don't have complete profiles (city + children info)");
      console.log("- Users are too far apart");
      console.log("- Children's ages don't match within the flexibility range");
      console.log("- Matches already exist between eligible users");
    }
    
  } catch (error) {
    console.error("Error testing dad matching:", error);
  }
  
  process.exit(0);
}

testDadMatching().catch(console.error);