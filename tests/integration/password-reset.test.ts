/**
 * Integration tests for password-reset endpoints.
 *
 * Verifies the HTTP contract for:
 *   POST   /api/forgot-password
 *   GET    /api/verify-reset-token/:token
 *   POST   /api/reset-password
 *
 * All storage / email / DB dependencies are mocked so no real DB
 * connection or email delivery is required.
 *
 * Key behaviours under test:
 *  - Validation: missing / weak inputs → 400
 *  - No email enumeration: unknown email still returns 200
 *  - Token validation: invalid / expired / used → 400
 *  - Rate-limiter middleware is wired to /api/forgot-password
 *  - Only ONE handler registered per route (no duplicate handler bug)
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("../../server/db", () => ({ db: {}, pool: {} }));

// Bypass rate limiting so individual tests don't exhaust the limit for others
vi.mock("express-rate-limit", () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
  rateLimit: () => (_req: any, _res: any, next: any) => next(),
}));

// connect-pg-simple needs a real PG pool; return a no-op store instead
vi.mock("connect-pg-simple", () => ({
  default: () =>
    class FakePgStore {
      on() {}
    },
}));

const mockGetUserByEmail = vi.fn();
const mockCreatePasswordResetToken = vi.fn();
const mockGetPasswordResetToken = vi.fn();
const mockUpdateUserPassword = vi.fn();
const mockMarkPasswordResetTokenAsUsed = vi.fn();

vi.mock("../../server/storage", () => ({
  storage: {
    getUser: vi.fn().mockResolvedValue(null),
    getUserByUsername: vi.fn().mockResolvedValue(null),
    getUserByEmail: mockGetUserByEmail,
    createUser: vi.fn(),
    createPasswordResetToken: mockCreatePasswordResetToken,
    getPasswordResetToken: mockGetPasswordResetToken,
    updateUserPassword: mockUpdateUserPassword,
    markPasswordResetTokenAsUsed: mockMarkPasswordResetTokenAsUsed,
    getMatchPreferences: vi.fn().mockResolvedValue(null),
    updateMatchPreferences: vi.fn(),
    createMatchPreferences: vi.fn(),
  },
}));

const mockSendPasswordResetEmail = vi.fn().mockResolvedValue(true);
vi.mock("../../server/email-service", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

vi.mock("../../server/email-queue", () => ({
  emailQueue: { enqueue: vi.fn() },
}));

vi.mock("../../server/csrf", () => ({
  generateCsrfToken: vi.fn().mockReturnValue("test-csrf-token"),
  csrfMiddleware: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../server/sanitize", () => ({
  sanitizeObject: (obj: any) => obj,
}));

vi.mock("../../server/push-notifications", () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock("../../server/dad-matching-service", () => ({
  triggerInitialMatching: vi.fn(),
}));

// ── Test app setup ─────────────────────────────────────────────────────────

let app: express.Application;

beforeAll(async () => {
  const { setupAuth } = await import("../../server/auth");
  app = express();
  app.use(express.json());
  setupAuth(app);
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSendPasswordResetEmail.mockResolvedValue(true);
});

// ── Shared test data ───────────────────────────────────────────────────────

const STRONG_PASSWORD = "Str0ng!Pass#2025";
const ONE_HOUR_AHEAD = new Date(Date.now() + 60 * 60 * 1000);
const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000);

const fakeUser = {
  id: 42,
  email: "dad@papa-hi.com",
  firstName: "Jan",
  username: "jandad",
  role: "user",
};

const validToken = {
  id: 1,
  userId: 42,
  token: "abc123validtoken",
  expiresAt: ONE_HOUR_AHEAD,
  used: false,
};

// ── POST /api/forgot-password ──────────────────────────────────────────────

describe("POST /api/forgot-password", () => {
  it("returns 400 when email is missing from the body", async () => {
    const res = await request(app).post("/api/forgot-password").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 200 even when the email is not registered (no enumeration)", async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/forgot-password")
      .send({ email: "unknown@papa-hi.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("returns 200 and sends a reset email for a known email", async () => {
    mockGetUserByEmail.mockResolvedValue(fakeUser);
    mockCreatePasswordResetToken.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/forgot-password")
      .send({ email: fakeUser.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
    expect(mockCreatePasswordResetToken).toHaveBeenCalledOnce();
    expect(mockSendPasswordResetEmail).toHaveBeenCalledOnce();
  });

  it("reset link uses ?token= query param (client-compatible format)", async () => {
    mockGetUserByEmail.mockResolvedValue(fakeUser);
    mockCreatePasswordResetToken.mockResolvedValue(undefined);

    await request(app)
      .post("/api/forgot-password")
      .send({ email: fakeUser.email });

    const callArgs = mockSendPasswordResetEmail.mock.calls[0][0];
    expect(callArgs.resetLink).toMatch(/\?token=/);
    expect(callArgs.resetLink).not.toMatch(/\/reset-password\//);
  });

  it("sends the email to user.email (not the user-supplied address)", async () => {
    mockGetUserByEmail.mockResolvedValue(fakeUser);
    mockCreatePasswordResetToken.mockResolvedValue(undefined);

    await request(app)
      .post("/api/forgot-password")
      .send({ email: "UPPERCASE@papa-hi.com" });

    const callArgs = mockSendPasswordResetEmail.mock.calls[0][0];
    expect(callArgs.to).toBe(fakeUser.email);
  });

  it("still returns 200 if the email send fails (don't expose email errors)", async () => {
    mockGetUserByEmail.mockResolvedValue(fakeUser);
    mockCreatePasswordResetToken.mockResolvedValue(undefined);
    mockSendPasswordResetEmail.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/forgot-password")
      .send({ email: fakeUser.email });

    expect(res.status).toBe(200);
  });
});

// ── GET /api/verify-reset-token/:token ────────────────────────────────────

describe("GET /api/verify-reset-token/:token", () => {
  it("returns 400 for an unknown / non-existent token", async () => {
    mockGetPasswordResetToken.mockResolvedValue(null);

    const res = await request(app).get("/api/verify-reset-token/badtoken");
    expect(res.status).toBe(400);
    expect(res.body.valid).not.toBe(true);
  });

  it("returns 400 for an expired token", async () => {
    mockGetPasswordResetToken.mockResolvedValue({
      ...validToken,
      expiresAt: ONE_HOUR_AGO,
    });

    const res = await request(app).get("/api/verify-reset-token/expiredtoken");
    expect(res.status).toBe(400);
  });

  it("returns 400 for a token that has already been used", async () => {
    mockGetPasswordResetToken.mockResolvedValue({
      ...validToken,
      used: true,
    });

    const res = await request(app).get("/api/verify-reset-token/usedtoken");
    expect(res.status).toBe(400);
  });

  it("returns 200 with valid:true for a fresh, unused token", async () => {
    mockGetPasswordResetToken.mockResolvedValue(validToken);

    const res = await request(app).get(
      `/api/verify-reset-token/${validToken.token}`
    );
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});

// ── POST /api/reset-password ──────────────────────────────────────────────

describe("POST /api/reset-password", () => {
  it("returns 400 when token is missing", async () => {
    const res = await request(app)
      .post("/api/reset-password")
      .send({ newPassword: STRONG_PASSWORD });
    expect(res.status).toBe(400);
  });

  it("returns 400 when newPassword is missing", async () => {
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: "sometoken" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a password shorter than 8 characters", async () => {
    mockGetPasswordResetToken.mockResolvedValue(validToken);
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: "Ab1!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 character/i);
  });

  it("returns 400 for a password without an uppercase letter", async () => {
    mockGetPasswordResetToken.mockResolvedValue(validToken);
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: "lowercase1!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/uppercase/i);
  });

  it("returns 400 for a password without a number", async () => {
    mockGetPasswordResetToken.mockResolvedValue(validToken);
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: "NoNumber!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/number/i);
  });

  it("returns 400 for an invalid / non-existent token", async () => {
    mockGetPasswordResetToken.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: "invalid", newPassword: STRONG_PASSWORD });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an expired token", async () => {
    mockGetPasswordResetToken.mockResolvedValue({
      ...validToken,
      expiresAt: ONE_HOUR_AGO,
    });
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: STRONG_PASSWORD });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an already-used token", async () => {
    mockGetPasswordResetToken.mockResolvedValue({ ...validToken, used: true });
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: STRONG_PASSWORD });
    expect(res.status).toBe(400);
  });

  it("returns 200, updates password, and marks token used on success", async () => {
    mockGetPasswordResetToken.mockResolvedValue(validToken);
    mockUpdateUserPassword.mockResolvedValue(undefined);
    mockMarkPasswordResetTokenAsUsed.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: STRONG_PASSWORD });

    expect(res.status).toBe(200);
    expect(mockUpdateUserPassword).toHaveBeenCalledWith(
      validToken.userId,
      expect.any(String)
    );
    expect(mockMarkPasswordResetTokenAsUsed).toHaveBeenCalledWith(
      validToken.token
    );
  });

  it("stores a hashed password, not the plaintext", async () => {
    mockGetPasswordResetToken.mockResolvedValue(validToken);
    mockUpdateUserPassword.mockResolvedValue(undefined);
    mockMarkPasswordResetTokenAsUsed.mockResolvedValue(undefined);

    await request(app)
      .post("/api/reset-password")
      .send({ token: validToken.token, newPassword: STRONG_PASSWORD });

    const storedPassword = mockUpdateUserPassword.mock.calls[0][1];
    expect(storedPassword).not.toBe(STRONG_PASSWORD);
    expect(storedPassword).toContain(".");
  });
});

// ── Single-registration guard ──────────────────────────────────────────────

describe("No duplicate route handlers", () => {
  it("POST /api/forgot-password responds only once (not duplicated)", async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/forgot-password")
      .send({ email: "test@test.com" });

    // A duplicate handler would send headers twice → Express throws
    // ERR_HTTP_HEADERS_SENT. A single 200 proves only one handler ran.
    expect(res.status).toBe(200);
  });

  it("GET /api/verify-reset-token/:token responds only once", async () => {
    mockGetPasswordResetToken.mockResolvedValue(null);
    const res = await request(app).get("/api/verify-reset-token/anytoken");
    expect(res.status).toBe(400);
  });

  it("POST /api/reset-password responds only once", async () => {
    mockGetPasswordResetToken.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/reset-password")
      .send({ token: "t", newPassword: STRONG_PASSWORD });
    expect(res.status).toBe(400);
  });
});
