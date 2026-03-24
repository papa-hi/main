import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import helmet from "helmet";

const app = express();

// Security headers via Helmet
const isDev = process.env.NODE_ENV !== 'production';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      // In production, Vite emits only external <script src="..."> tags — no inline scripts.
      // 'unsafe-inline' is kept for development only, where Vite HMR injects inline scripts.
      // replit.com is allowed for the dev banner embedded in the HTML template.
      scriptSrc:   [
        "'self'",
        ...(isDev ? ["'unsafe-inline'"] : []),
        "https://apis.google.com",
        "https://www.gstatic.com",
        "https://replit.com",
      ],
      // Inline styles are used by Vite's theme injection (<style data-vite-theme>)
      // in both dev and production, so 'unsafe-inline' stays in styleSrc.
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // User photos can come from Supabase Storage, Unsplash, Google profile photos, etc.
      imgSrc:      ["'self'", "data:", "blob:", "https:"],
      fontSrc:     ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc:  [
        "'self'",
        // Supabase (database / storage bucket)
        "https://*.supabase.co",
        // Google / Firebase APIs
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://oauth2.googleapis.com",
        // Weather API
        "https://api.openweathermap.org",
        // OpenStreetMap geocoding & Overpass API
        "https://nominatim.openstreetmap.org",
        "https://overpass-api.de",
      ],
      // Firebase Auth popup uses an iframe on firebaseapp.com
      frameSrc:    ["'self'", "https://*.firebaseapp.com"],
      workerSrc:   ["'self'", "blob:"],
      objectSrc:   ["'none'"],
      // Upgrade insecure requests in production
      ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
  // same-origin-allow-popups keeps Google Sign-In popup working
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // frameguard left off: Firebase Auth redirect flow uses iframes on our domain
  frameguard: false,
}));

// Security: Catch malformed URIs (like /%c0) to prevent crashes from bot attacks
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof URIError) {
    return res.status(400).send('Malformed URL');
  }
  next(err);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Reverse proxy Firebase Auth handler to support custom domain auth
// When authDomain is papa-hi.com, Firebase redirects to /__/auth/handler on our domain
// We proxy these requests to papa-hi.firebaseapp.com where the handler actually lives
app.use('/__', async (req: Request, res: Response) => {
  try {
    const firebaseProject = process.env.VITE_FIREBASE_PROJECT_ID || 'papa-hi';
    const targetUrl = `https://${firebaseProject}.firebaseapp.com/__${req.url}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': req.headers.accept || '*/*',
        'User-Agent': req.headers['user-agent'] || '',
      },
      redirect: 'manual',
    });

    // Forward status code
    res.status(response.status);

    // Forward relevant headers
    const headersToForward = ['content-type', 'location', 'cache-control', 'set-cookie'];
    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    // Forward body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('Firebase auth proxy error:', error);
    res.status(502).send('Auth proxy error');
  }
});

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

// Serve robots.txt explicitly (before SPA catch-all)
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
});

// Note: sitemap.xml is handled dynamically in routes.ts to include current playdates/events

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
      
      if (res.statusCode >= 400 && res.statusCode !== 401) {
        console.log(`[ERROR] ${req.method} ${path} ${res.statusCode}`, 
          JSON.stringify({
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

    // Start availability matching cron jobs
    import("./availability-cron-jobs")
      .then(({ setupAvailabilityCronJobs }) => {
        setupAvailabilityCronJobs();
        log("Availability matching cron jobs started");
      })
      .catch((error) => {
        console.error("Failed to start availability cron jobs:", error);
      });
  });
})();
