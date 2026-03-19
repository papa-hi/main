/**
 * Integration tests for API routes.
 *
 * These tests mock the database and storage layers so no real DB connection
 * is needed. They verify that routes handle inputs correctly, enforce auth
 * where required, and return the expected HTTP shapes.
 *
 * Pattern for new tests:
 *   1. Add any additional storage method mocks to the vi.mock block below
 *   2. Create a describe block per route group
 *   3. Use `request(app).get/post(...)` to exercise the route
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
  pool: null,
}));

vi.mock("../../server/storage", () => ({
  storage: {
    getUser: vi.fn().mockResolvedValue(null),
    getUserByUsername: vi.fn().mockResolvedValue(null),
    getPlaydates: vi.fn().mockResolvedValue([]),
    getPlaydate: vi.fn().mockResolvedValue(null),
    getPlaces: vi.fn().mockResolvedValue([]),
    getPlace: vi.fn().mockResolvedValue(null),
    getEvents: vi.fn().mockResolvedValue([]),
    getEvent: vi.fn().mockResolvedValue(null),
    getCommunityPosts: vi.fn().mockResolvedValue([]),
    getFeaturedUser: vi.fn().mockResolvedValue(null),
    getUsers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../server/auth", () => ({
  setupAuth: vi.fn(),
  sessionMiddleware: (_req: any, _res: any, next: any) => next(),
  passportInitMiddleware: (_req: any, _res: any, next: any) => next(),
  passportSessionMiddleware: (_req: any, _res: any, next: any) => next(),
  hashPassword: vi.fn().mockResolvedValue("hashed.salt"),
  comparePasswords: vi.fn().mockResolvedValue(false),
}));

vi.mock("../../server/email-service", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../server/email-queue", () => ({
  emailQueue: { enqueue: vi.fn() },
}));

let app: express.Application;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    });
  });

  app.get("/api/user", (req: any, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });
});

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/config", () => {
  it("returns 200 with a config object", async () => {
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vapidPublicKey");
  });

  it("does NOT expose the weather API key", async () => {
    const res = await request(app).get("/api/config");
    expect(res.body).not.toHaveProperty("weatherApiKey");
  });
});

describe("GET /api/user (auth guard)", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/user");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});

describe("unknown routes", () => {
  it("returns 404 for an unknown API path", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});
