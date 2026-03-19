import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  getCityCoordinates,
  calculateMatchScore,
  findCommonAgeRanges,
} from "../../server/dad-matching-service";

describe("calculateDistance (Haversine)", () => {
  it("returns 0 for identical coordinates", () => {
    expect(calculateDistance(52.3676, 4.9041, 52.3676, 4.9041)).toBe(0);
  });

  it("calculates Amsterdam → Rotterdam (~57 km)", () => {
    const dist = calculateDistance(52.3676, 4.9041, 51.9244, 4.4777);
    expect(dist).toBeGreaterThan(55);
    expect(dist).toBeLessThan(60);
  });

  it("calculates Amsterdam → Utrecht (~36 km)", () => {
    const dist = calculateDistance(52.3676, 4.9041, 52.0907, 5.1214);
    expect(dist).toBeGreaterThan(33);
    expect(dist).toBeLessThan(39);
  });

  it("calculates Amsterdam → Maastricht (~177 km)", () => {
    const dist = calculateDistance(52.3676, 4.9041, 50.8514, 5.6909);
    expect(dist).toBeGreaterThan(170);
    expect(dist).toBeLessThan(185);
  });

  it("is symmetric (A→B equals B→A)", () => {
    const ab = calculateDistance(52.3676, 4.9041, 51.9244, 4.4777);
    const ba = calculateDistance(51.9244, 4.4777, 52.3676, 4.9041);
    expect(ab).toBeCloseTo(ba, 5);
  });
});

describe("getCityCoordinates", () => {
  it("returns coordinates for amsterdam (lowercase)", () => {
    const coords = getCityCoordinates("amsterdam");
    expect(coords).not.toBeNull();
    expect(coords!.lat).toBeCloseTo(52.3676, 3);
    expect(coords!.lon).toBeCloseTo(4.9041, 3);
  });

  it("is case-insensitive", () => {
    expect(getCityCoordinates("Amsterdam")).toEqual(getCityCoordinates("amsterdam"));
    expect(getCityCoordinates("ROTTERDAM")).toEqual(getCityCoordinates("rotterdam"));
  });

  it("trims whitespace", () => {
    expect(getCityCoordinates("  amsterdam  ")).toEqual(getCityCoordinates("amsterdam"));
  });

  it("returns null for unknown city", () => {
    expect(getCityCoordinates("middleofnowhere")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getCityCoordinates("")).toBeNull();
  });

  it("returns coordinates for all major Dutch cities", () => {
    const cities = ["rotterdam", "den haag", "utrecht", "eindhoven", "groningen"];
    for (const city of cities) {
      expect(getCityCoordinates(city)).not.toBeNull();
    }
  });
});

describe("calculateMatchScore", () => {
  it("returns 100 for 0 km distance with perfect age overlap", () => {
    const score = calculateMatchScore(0, [{ overlap: 2 }, { overlap: 2 }]);
    expect(score).toBe(100);
  });

  it("returns 50 for 0 km distance with no age matches", () => {
    const score = calculateMatchScore(0, []);
    expect(score).toBe(50);
  });

  it("returns 0 for distance >= 50 km with no age matches", () => {
    expect(calculateMatchScore(50, [])).toBe(0);
    expect(calculateMatchScore(100, [])).toBe(0);
  });

  it("scores are higher for closer dads", () => {
    const nearScore = calculateMatchScore(5, [{ overlap: 1 }]);
    const farScore = calculateMatchScore(40, [{ overlap: 1 }]);
    expect(nearScore).toBeGreaterThan(farScore);
  });

  it("scores are higher for better age compatibility", () => {
    const goodAge = calculateMatchScore(20, [{ overlap: 2 }]);
    const badAge = calculateMatchScore(20, [{ overlap: 0 }]);
    expect(goodAge).toBeGreaterThan(badAge);
  });

  it("never exceeds 100", () => {
    const score = calculateMatchScore(0, [
      { overlap: 2 }, { overlap: 2 }, { overlap: 2 }, { overlap: 2 },
    ]);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    expect(calculateMatchScore(200, [])).toBeGreaterThanOrEqual(0);
  });

  it("returns an integer", () => {
    const score = calculateMatchScore(17, [{ overlap: 1 }]);
    expect(Number.isInteger(score)).toBe(true);
  });
});

describe("findCommonAgeRanges", () => {
  it("returns empty array when no children overlap", () => {
    const result = findCommonAgeRanges(
      [{ name: "Tom", age: 2 }],
      [{ name: "Sara", age: 8 }],
    );
    expect(result).toHaveLength(0);
  });

  it("finds a match when children ages are within default flexibility (2 years)", () => {
    const result = findCommonAgeRanges(
      [{ name: "Tom", age: 4 }],
      [{ name: "Sara", age: 5 }],
    );
    expect(result).toHaveLength(1);
    expect(result[0].overlap).toBe(1);
  });

  it("finds a match for identical ages with overlap 2", () => {
    const result = findCommonAgeRanges(
      [{ name: "Tom", age: 4 }],
      [{ name: "Sara", age: 4 }],
    );
    expect(result).toHaveLength(1);
    expect(result[0].overlap).toBe(2);
    expect(result[0].minAge).toBe(4);
    expect(result[0].maxAge).toBe(4);
  });

  it("respects custom ageFlexibility", () => {
    const strict = findCommonAgeRanges(
      [{ name: "Tom", age: 4 }],
      [{ name: "Sara", age: 7 }],
      1,
    );
    const flexible = findCommonAgeRanges(
      [{ name: "Tom", age: 4 }],
      [{ name: "Sara", age: 7 }],
      5,
    );
    expect(strict).toHaveLength(0);
    expect(flexible).toHaveLength(1);
  });

  it("finds multiple matches across multiple children", () => {
    const result = findCommonAgeRanges(
      [{ name: "Tom", age: 3 }, { name: "Amy", age: 7 }],
      [{ name: "Ben", age: 4 }, { name: "Eva", age: 6 }],
    );
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles empty children arrays", () => {
    expect(findCommonAgeRanges([], [{ name: "Ben", age: 4 }])).toHaveLength(0);
    expect(findCommonAgeRanges([{ name: "Tom", age: 3 }], [])).toHaveLength(0);
    expect(findCommonAgeRanges([], [])).toHaveLength(0);
  });

  it("boundary: age difference exactly at flexibility limit matches", () => {
    const result = findCommonAgeRanges(
      [{ name: "Tom", age: 3 }],
      [{ name: "Ben", age: 5 }],
      2,
    );
    expect(result).toHaveLength(1);
    expect(result[0].overlap).toBe(0);
  });

  it("boundary: age difference one over flexibility limit does not match", () => {
    const result = findCommonAgeRanges(
      [{ name: "Tom", age: 3 }],
      [{ name: "Ben", age: 6 }],
      2,
    );
    expect(result).toHaveLength(0);
  });
});
