import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeObject } from "../../server/sanitize";

describe("sanitizeText", () => {
  it("returns empty string for null input", () => {
    expect(sanitizeText(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(sanitizeText(undefined)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("passes through clean text untouched", () => {
    const clean = "Hello, I am a dad in Amsterdam!";
    expect(sanitizeText(clean)).toBe(clean);
  });

  it("strips <script> tags", () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe("");
    expect(sanitizeText('Hello <script>evil()</script> world')).toBe("Hello  world");
  });

  it("strips script tags regardless of case", () => {
    expect(sanitizeText('<SCRIPT>evil()</SCRIPT>')).toBe("");
    expect(sanitizeText('<Script>evil()</Script>')).toBe("");
  });

  it("strips inline event handlers", () => {
    expect(sanitizeText('<img onerror="evil()">')).toBe("<img>");
    expect(sanitizeText('<a onclick="bad()">click</a>')).toBe('<a>click</a>');
    expect(sanitizeText('<div onmouseover="track()">text</div>')).toBe("<div>text</div>");
  });

  it("strips dangerous HTML tags", () => {
    expect(sanitizeText('<iframe src="evil.com"></iframe>')).toBe("");
    expect(sanitizeText('<object data="evil.swf"></object>')).toBe("");
    expect(sanitizeText('<embed src="evil.swf">')).toBe("");
    expect(sanitizeText('<form action="/steal">x</form>')).toBe("x");
  });

  it("strips javascript: URI schemes", () => {
    // The regex removes the dangerous attribute; a trailing space artifact remains — still safe
    const result = sanitizeText('<a href="javascript:evil()">link</a>');
    expect(result).not.toContain("javascript:");
    expect(result).toContain("link");
    expect(sanitizeText('<img src="javascript:evil()">')).not.toContain("javascript:");
  });

  it("strips javascript: URIs with single quotes", () => {
    const result = sanitizeText("<a href='javascript:evil()'>link</a>");
    expect(result).not.toContain("javascript:");
    expect(result).toContain("link");
  });

  it("preserves normal HTML like bold and italic", () => {
    const safe = "<b>Bold</b> and <i>italic</i> text";
    expect(sanitizeText(safe)).toBe(safe);
  });

  it("preserves legitimate href URLs", () => {
    const safe = '<a href="https://papa-hi.com">PaPa-Hi</a>';
    expect(sanitizeText(safe)).toBe(safe);
  });

  it("handles multi-line script attacks", () => {
    const attack = '<script\ntype="text/javascript">evil()</script>';
    expect(sanitizeText(attack)).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes specified string fields", () => {
    const obj = {
      name: '<script>evil()</script>Alice',
      bio: '<b>Normal</b>',
      age: 30,
    };
    const result = sanitizeObject(obj, ["name", "bio"]);
    expect(result.name).toBe("Alice");
    expect(result.bio).toBe("<b>Normal</b>");
    expect(result.age).toBe(30);
  });

  it("does not modify non-string fields", () => {
    const obj = { count: 5, active: true, tags: ["a", "b"] };
    const result = sanitizeObject(obj, ["count" as any, "active" as any, "tags" as any]);
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("returns a new object, not mutating the original", () => {
    const obj = { name: '<script>evil()</script>' };
    const result = sanitizeObject(obj, ["name"]);
    expect(obj.name).toBe('<script>evil()</script>');
    expect(result.name).toBe("");
  });

  it("only touches fields listed in the fields array", () => {
    const obj = { name: '<script>bad</script>', bio: '<script>also bad</script>' };
    const result = sanitizeObject(obj, ["name"]);
    expect(result.name).toBe("");
    expect(result.bio).toBe('<script>also bad</script>');
  });
});
