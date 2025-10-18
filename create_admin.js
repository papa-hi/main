// Script to update an existing user to admin role using the database directly
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq } = require('drizzle-orm');
const { randomBytes, scrypt } = require('crypto');
const { promisify } = require('util');

// Promisify scrypt
const scryptAsync = promisify(scrypt);

// Function to hash password using the same method as in auth.ts
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ERROR: ADMIN_PASSWORD environment variable is not set!');
      console.error('Please set ADMIN_PASSWORD in Replit Secrets before running this script.');
      process.exit(1);
    }
    
    // Connect to database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    // Check if admin user exists
    const [existingAdmin] = await db.execute(
      `SELECT * FROM users WHERE username = 'admin'`
    );
    
    if (existingAdmin) {
      console.log('Admin user already exists, updating password and role...');
      // Hash the password
      const hashedPassword = await hashPassword(adminPassword);
      
      // Update the admin user
      await db.execute(
        `UPDATE users SET 
         password = $1, 
         role = 'admin'
         WHERE username = 'admin'`,
        [hashedPassword]
      );
      
      console.log('Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      // Hash the password
      const hashedPassword = await hashPassword(adminPassword);
      
      // Create admin user
      await db.execute(
        `INSERT INTO users 
         (username, password, email, first_name, last_name, role, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        ['admin', hashedPassword, 'admin@papahi.com', 'Admin', 'User', 'admin']
      );
      
      console.log('Admin user created successfully!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();