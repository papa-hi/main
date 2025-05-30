import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
