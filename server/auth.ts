import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sendWelcomeEmail } from "./email-service";
import { emailQueue } from "./email-queue";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Setup session store with PostgreSQL
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true,
    tableName: 'user_sessions' 
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'papa-hi-session-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        // User not found in database, clear session
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialize error:", error);
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(req.body.password);
      
      // Set default role to user if not provided
      const role = req.body.role || 'user';
      
      // For security, only allow admin role if it's specifically for the admin user
      // or in development environment
      const finalRole = (req.body.username === 'admin' || process.env.NODE_ENV === 'development') 
                      ? role 
                      : 'user';
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: finalRole
      });

      // Send welcome email (don't wait for it to complete)
      if (user.email && user.firstName) {
        console.log(`Attempting to send welcome email to: ${user.email}`);
        sendWelcomeEmail({
          to: user.email,
          firstName: user.firstName,
          username: user.username
        }).then(success => {
          if (success) {
            console.log(`Welcome email sent successfully to: ${user.email}`);
          } else {
            console.error(`Failed to send welcome email to: ${user.email}`);
          }
        }).catch(error => {
          console.error('Welcome email error:', error);
          // Don't fail registration if email fails
        });
      } else {
        console.log('Skipping welcome email - missing email or firstName');
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const userWithoutPassword = { ...user } as Partial<SelectUser>;
        delete userWithoutPassword.password;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid username or password" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const userWithoutPassword = { ...user } as Partial<SelectUser>;
        delete userWithoutPassword.password;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const userWithoutPassword = { ...req.user } as Partial<SelectUser>;
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  });
  
  // Handle Firebase Google authentication
  app.post("/api/firebase-auth", async (req, res, next) => {
    try {
      console.log("Firebase auth request received:", req.body);
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!uid || !email) {
        console.log("Missing required Firebase data:", { uid, email });
        return res.status(400).json({ error: "Missing required Firebase user data" });
      }
      
      // Check if user exists with this email
      console.log("Checking if user exists with email:", email);
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("User not found, creating new user with email:", email);
        // Split display name into first and last name
        const names = displayName ? displayName.split(' ') : ['Google', 'User'];
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
        
        // Generate random password for Firebase users (they'll login with Google, not password)
        const randomPassword = randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);
        
        // Create a new user with default values for required fields
        const newUser = {
          username: `google_${uid.substring(0, 8)}`,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          profileImage: photoURL || null,
          phoneNumber: null,
          bio: null,
          city: null,
          badge: null,
          favoriteLocations: null,
          childrenInfo: [{ name: 'Child', age: 0 }] // Default child info
        };
        
        console.log("Creating new user:", newUser);
        
        // Create a new user
        try {
          user = await storage.createUser(newUser);
          console.log("New user created successfully:", user.id);
          
          // Send welcome email for new Firebase users
          if (user.email && user.firstName) {
            console.log(`🔥 FIREBASE NEW USER: Attempting to send welcome email to: ${user.email}`);
            console.log(`Firebase user details: ${user.firstName} ${user.lastName} (${user.username})`);
            
            // Send welcome email with immediate delivery and wait for completion
            // Capture user data for async email processing
            const emailData = {
              to: user.email,
              firstName: user.firstName,
              username: user.username
            };
            
            // Process email immediately after response
            setImmediate(async () => {
              try {
                console.log(`📧 FIREBASE EMAIL: Starting delivery process for ${emailData.to}`);
                const success = await sendWelcomeEmail(emailData);
                
                if (success) {
                  console.log(`✅ FIREBASE WELCOME EMAIL: Successfully sent to ${emailData.to}`);
                } else {
                  console.error(`❌ FIREBASE WELCOME EMAIL: Failed to send to ${emailData.to}`);
                }
              } catch (error) {
                console.error('❌ FIREBASE WELCOME EMAIL ERROR:', error);
                console.error('Email details:', emailData);
              }
            });
          } else {
            console.log(`⚠️  FIREBASE SIGNUP: Skipping welcome email - missing data. Email: ${user.email}, FirstName: ${user.firstName}`);
          }
        } catch (createError) {
          console.error("Error creating user:", createError);
          return res.status(500).json({ error: "Failed to create user account" });
        }
      } else {
        console.log("User found with email:", email);
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in user:", err);
          return res.status(500).json({ error: "Failed to log in" });
        }
        
        console.log("User logged in successfully:", user.id);
        const userWithoutPassword = { ...user } as Partial<SelectUser>;
        delete userWithoutPassword.password;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Firebase authentication error:", error);
      res.status(500).json({ error: "Internal server error during authentication" });
    }
  });
}