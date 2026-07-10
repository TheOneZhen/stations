import { describe, expect, it } from "vitest";
import { buildCollisionCandidates } from "../src/path/collision";
import { findAltTextSelection } from "../src/editor/altTextSelection";

describe("buildCollisionCandidates", () => {
  it("generates incremental suffixes", () => {
    expect(buildCollisionCandidates("/tmp/photo.png").slice(0, 3)).toEqual([
      "/tmp/photo.png",
      "/tmp/photo-1.png",
      "/tmp/photo-2.png",
    ]);
  });
});

describe("findAltTextSelection", () => {
  it("finds markdown alt text range", () => {
    expect(
      findAltTextSelection("![altText](./images/2026-07-09.png)", "markdown"),
    ).toEqual({ start: 2, end: 9 });
  });

  it("finds html alt text range", () => {
    expect(
      findAltTextSelection(
        '<img alt="altText" src="./images/2026-07-09.png" />',
        "html",
      ),
    ).toEqual({ start: 10, end: 17 });
  });
});
