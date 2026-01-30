import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();

// Security: Catch malformed URIs (like /%c0) to prevent crashes from bot attacks
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof URIError) {
    return res.status(400).send('Malformed URL');
  }
  next(err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ensure uploads directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const placeImagesDir = path.join(uploadsDir, 'place-images');
const profileImagesDir = path.join(uploadsDir, 'profile-images');
[uploadsDir, placeImagesDir, profileImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Serve files from the uploads directory (index: false prevents directory listing)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { index: false }));

// Serve static assets (playground images, etc.)
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

// Serve place images in multiple formats for maximum compatibility
// This allows images saved with any path format to work
app.use('/place-images', express.static(path.join(process.cwd(), 'uploads', 'place-images')));

// Serve profile images specifically
app.use('/profile-images', express.static(path.join(process.cwd(), 'uploads', 'profile-images')));

// Add special playground image handler that logs more information
app.get('/playground-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const possiblePaths = [
    path.join(process.cwd(), 'uploads', 'place-images', filename),
    path.join(process.cwd(), 'uploads', filename),
  ];

  // Try each possible path
  for (const filePath of possiblePaths) {
    console.log(`[IMAGE_DEBUG] Checking for playground image at: ${filePath}`);
    if (fs.existsSync(filePath)) {
      console.log(`[IMAGE_DEBUG] Found playground image at: ${filePath}`);
      return res.sendFile(filePath);
    }
  }

  // If image not found, return 404
  console.log(`[IMAGE_DEBUG] Playground image not found: ${filename}`);
  res.status(404).send('Image not found');
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  
  // Log request body for POST requests
  if (req.method === 'POST' && path.startsWith("/api")) {
    console.log(`REQUEST BODY for ${req.method} ${path}:`, JSON.stringify(req.body));
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      // Log all request headers for error status codes
      if (res.statusCode >= 400) {
        console.log(`ERROR HEADERS for ${req.method} ${path}:`, 
          JSON.stringify({
            'cookie': req.headers.cookie,
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
            'referer': req.headers.referer
          }));
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
    
    // Only send response if headers haven't been sent
    if (!res.headersSent) {
      res.status(status).json({ error: message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment (for Railway/other hosts) or default to 5000 (Replit)
  const port = Number(process.env.PORT) || 5000;
  console.log(`Starting server on 0.0.0.0:${port}...`);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server is up on port ${port}`);
    log(`serving on port ${port}`);
    
    // Start the weekly profile reminder scheduler
    if (process.env.NODE_ENV === "production") {
      const { weeklyScheduler } = require("./weekly-scheduler");
      weeklyScheduler.start();
      log("Weekly profile reminder scheduler started");
    }
  });
})();
