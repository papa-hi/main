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
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email-service";
import { emailQueue } from "./email-queue";
import { passwordResetTokens } from "@shared/schema";
import rateLimit from "express-rate-limit";
import { sanitizeObject } from "./sanitize";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
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

  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'papa-hi-session-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: isProduction,
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

  passport.serializeUser((user, done) => {
    console.log(`[SESSION] Serializing user id=${user.id}, username=${user.username}`);
    done(null, user.id);
  });
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        console.log(`[SESSION] Deserialize failed: user id=${id} not found in database`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error(`[SESSION] Deserialize error for id=${id}:`, error);
      done(null, false);
    }
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many login attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "Too many registration attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many password reset attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  app.post("/api/register", registerLimiter, async (req, res, next) => {
    try {
      const sanitizedBody = sanitizeObject(req.body, ['username', 'firstName', 'lastName', 'bio', 'city', 'email']);
      const existingUser = await storage.getUserByUsername(sanitizedBody.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      if (sanitizedBody.username.toLowerCase() === 'admin') {
        return res.status(400).json({ error: "This username is reserved" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...sanitizedBody,
        password: hashedPassword,
        role: 'user'
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

  app.post("/api/login", loginLimiter, (req, res, next) => {
    console.log(`[LOGIN] Attempt for username="${req.body.username}"`);
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) {
        console.error(`[LOGIN] Auth error:`, err);
        return next(err);
      }
      if (!user) {
        console.log(`[LOGIN] Failed for username="${req.body.username}" - invalid credentials`);
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error(`[LOGIN] Session creation error for user id=${user.id}:`, loginErr);
          return next(loginErr);
        }
        console.log(`[LOGIN] Success for user id=${user.id}, username="${user.username}", session.id=${req.session?.id}`);
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

  // Password reset endpoints
  app.post("/api/forgot-password", passwordResetLimiter, async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success message (security - don't reveal if email exists)
      const successMessage = "If an account with that email exists, a password reset link has been sent.";
      
      if (!user) {
        return res.status(200).json({ message: successMessage });
      }

      // Generate secure reset token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });

      // Build reset link
      const resetLink = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000'}/reset-password/${token}`;

      // Send password reset email
      const emailSent = await sendPasswordResetEmail({
        to: email,
        firstName: user.firstName,
        resetLink
      });

      if (!emailSent) {
        console.error('Failed to send password reset email to:', email);
      }

      res.status(200).json({ message: successMessage });
    } catch (error) {
      console.error('Error in forgot-password:', error);
      next(error);
    }
  });

  app.get("/api/verify-reset-token/:token", async (req, res, next) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: "Invalid reset token", valid: false });
      }

      // Find token in database
      const resetToken = await storage.getPasswordResetToken(token);

      // Return generic error message - don't reveal if token exists, is expired, or was used
      if (!resetToken || new Date() > new Date(resetToken.expiresAt) || resetToken.used) {
        return res.status(400).json({ error: "Invalid or expired reset token", valid: false });
      }

      res.status(200).json({ valid: true });
    } catch (error) {
      console.error('Error in verify-reset-token:', error);
      // Return generic error on exception
      res.status(400).json({ error: "Invalid or expired reset token", valid: false });
    }
  });

  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      // Validate password length
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Check if token has been used
      if (resetToken.used) {
        return res.status(400).json({ error: "Reset token has already been used" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error('Error in reset-password:', error);
      next(error);
    }
  });

  // Change password for authenticated users
  app.post("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }

      const user = req.user as SelectUser;
      
      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(user.id, hashedPassword);

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Error in change-password:', error);
      next(error);
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
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

  // Password reset endpoints
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }

      // Generate a secure random token
      const token = randomBytes(32).toString("hex");
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Store the token in the database
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });

      // Create reset link
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      
      // Send password reset email
      const emailSent = await sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        resetLink
      });

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
      }

      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  app.get("/api/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Find the token in the database
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Check if token has already been used
      if (resetToken.used) {
        return res.status(400).json({ error: "Reset token has already been used" });
      }

      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ error: "Failed to verify reset token" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Find the token in the database
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Check if token has already been used
      if (resetToken.used) {
        return res.status(400).json({ error: "Reset token has already been used" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user's password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
}