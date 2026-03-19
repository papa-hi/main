import { describe, it, expect } from "vitest";
import { hashPassword, comparePasswords } from "../../server/auth";

describe("hashPassword", () => {
  it("returns a string in 'hash.salt' format", async () => {
    const result = await hashPassword("mypassword");
    const parts = result.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const hash1 = await hashPassword("samepassword");
    const hash2 = await hashPassword("samepassword");
    expect(hash1).not.toBe(hash2);
  });

  it("produces a hash portion that is a 128-char hex string (64 bytes)", async () => {
    const result = await hashPassword("testpass");
    const [hashHex] = result.split(".");
    expect(hashHex).toHaveLength(128);
    expect(hashHex).toMatch(/^[0-9a-f]+$/);
  });

  it("produces a salt portion that is a 32-char hex string (16 bytes)", async () => {
    const result = await hashPassword("testpass");
    const [, saltHex] = result.split(".");
    expect(saltHex).toHaveLength(32);
    expect(saltHex).toMatch(/^[0-9a-f]+$/);
  });

  it("handles empty string password", async () => {
    const result = await hashPassword("");
    expect(result.split(".")).toHaveLength(2);
  });

  it("handles unicode passwords", async () => {
    const result = await hashPassword("wachtwoord🔐");
    expect(result.split(".")).toHaveLength(2);
  });

  it("handles long passwords", async () => {
    const long = "a".repeat(1000);
    const result = await hashPassword(long);
    expect(result.split(".")).toHaveLength(2);
  });
});

describe("comparePasswords", () => {
  it("returns true for a correct password against its hash", async () => {
    const hash = await hashPassword("correcthorsebatterystaple");
    const result = await comparePasswords("correcthorsebatterystaple", hash);
    expect(result).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await comparePasswords("wrongpassword", hash);
    expect(result).toBe(false);
  });

  it("is case-sensitive", async () => {
    const hash = await hashPassword("Password123");
    expect(await comparePasswords("password123", hash)).toBe(false);
    expect(await comparePasswords("PASSWORD123", hash)).toBe(false);
    expect(await comparePasswords("Password123", hash)).toBe(true);
  });

  it("returns false for empty string against a real hash", async () => {
    const hash = await hashPassword("somepassword");
    expect(await comparePasswords("", hash)).toBe(false);
  });

  it("returns true for an empty string password hashed and compared with empty string", async () => {
    const hash = await hashPassword("");
    expect(await comparePasswords("", hash)).toBe(true);
  });

  it("handles unicode passwords round-trip", async () => {
    const password = "veilig🔑wachtwoord";
    const hash = await hashPassword(password);
    expect(await comparePasswords(password, hash)).toBe(true);
    expect(await comparePasswords("veiligwachtwoord", hash)).toBe(false);
  });

  it("different hashes of same password both verify correctly", async () => {
    const password = "sharedpassword";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(await comparePasswords(password, hash1)).toBe(true);
    expect(await comparePasswords(password, hash2)).toBe(true);
    expect(await comparePasswords(password, hash1)).toBe(
      await comparePasswords(password, hash2),
    );
  });
});
