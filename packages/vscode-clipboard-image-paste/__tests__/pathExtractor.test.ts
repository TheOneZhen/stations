import { describe, expect, it } from "vitest";
import {
  extractImagePathPattern,
  PathExtractionError,
  replaceImagePathInTemplate,
} from "../src/template/pathExtractor";

describe("extractImagePathPattern", () => {
  it("extracts markdown image path", () => {
    expect(
      extractImagePathPattern(
        "![altText](./images/[YYYY-MM-DD])",
        "markdown",
      ),
    ).toBe("./images/[YYYY-MM-DD]");
  });

  it("extracts html src path", () => {
    expect(
      extractImagePathPattern(
        '<img alt="altText" src="./images/[YYYY-MM-DD]" />',
        "html",
      ),
    ).toBe("./images/[YYYY-MM-DD]");
  });

  it("throws when markdown path is missing", () => {
    expect(() =>
      extractImagePathPattern("# heading", "markdown"),
    ).toThrow(PathExtractionError);
  });
});

describe("replaceImagePathInTemplate", () => {
  it("replaces markdown path with resolved reference", () => {
    expect(
      replaceImagePathInTemplate(
        "![altText](./images/[YYYY-MM-DD])",
        "markdown",
        "./images/2026-07-09.png",
      ),
    ).toBe("![altText](./images/2026-07-09.png)");
  });
});
