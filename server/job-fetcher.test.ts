import { describe, it, expect } from "vitest";
import { isJobWhitelisted } from "./job-fetcher";

describe("isJobWhitelisted", () => {
  const settingsFuzzy = {
    whitelistedTitles: ["staff engineer"],
    harvestingMode: "fuzzy"
  };

  const settingsExact = {
    whitelistedTitles: ["staff engineer"],
    harvestingMode: "exact"
  };

  describe("Fuzzy Matching", () => {
    it("should match when the title exactly matches a whitelisted phrase", () => {
      expect(isJobWhitelisted("Staff Engineer", settingsFuzzy)).toBe(true);
    });

    it("should match when the title contains a whitelisted phrase as a independent word block", () => {
      expect(isJobWhitelisted("Senior Staff Engineer", settingsFuzzy)).toBe(true);
      expect(isJobWhitelisted("Staff Engineer (Remote)", settingsFuzzy)).toBe(true);
    });

    it("should NOT match when words in a whitelisted phrase are separated by other words", () => {
      // This captures the exact behavior the user asked about
      expect(isJobWhitelisted("Staff Software Engineer", settingsFuzzy)).toBe(false);
    });

    it("should NOT match partial words (word boundaries)", () => {
      const settingsParts = {
        whitelistedTitles: ["staff"],
        harvestingMode: "fuzzy"
      };
      expect(isJobWhitelisted("distaff", settingsParts)).toBe(false);
      expect(isJobWhitelisted("staffing", settingsParts)).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isJobWhitelisted("STAFF ENGINEER", settingsFuzzy)).toBe(true);
    });
  });

  describe("Exact Matching", () => {
    it("should only match exact titles (ignoring case/whitespace)", () => {
      expect(isJobWhitelisted("Staff Engineer", settingsExact)).toBe(true);
      expect(isJobWhitelisted(" Staff Engineer  ", settingsExact)).toBe(true);
      expect(isJobWhitelisted("Senior Staff Engineer", settingsExact)).toBe(false);
    });
  });
});
