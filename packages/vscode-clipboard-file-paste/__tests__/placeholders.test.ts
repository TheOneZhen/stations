import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  ensureExtension,
  extensionFromMimeType,
  generateRid,
  resolvePlaceholders,
  sanitizeFileNameSegment,
} from "../src/template/placeholders";

describe("sanitizeFileNameSegment", () => {
  it("replaces Windows-invalid characters", () => {
    expect(sanitizeFileNameSegment("2026-07-09 18:26:33")).toBe(
      "2026-07-09 18-26-33",
    );
  });
});

describe("resolvePlaceholders", () => {
  it("formats date placeholders with dayjs", () => {
    const result = resolvePlaceholders("./images/[YYYY-MM-DD]", {
      now: dayjs("2026-07-09T18:26:33"),
      random: () => 0,
    });
    expect(result).toBe("./images/2026-07-09");
  });

  it("keeps identical date tokens consistent within one resolve", () => {
    const result = resolvePlaceholders(
      "./images/[YYYY-MM-DD]/[YYYY-MM-DD]",
      {
        now: dayjs("2026-07-09T18:26:33"),
        random: () => 0,
      },
    );
    expect(result).toBe("./images/2026-07-09/2026-07-09");
  });

  it("generates deterministic RID values when random is fixed", () => {
    const result = resolvePlaceholders("./images/[RID-4]", {
      now: dayjs("2026-07-09T18:26:33"),
      random: () => 0,
    });
    expect(result).toBe("./images/AAAA");
  });

  it("keeps identical RID tokens consistent within one resolve", () => {
    const result = resolvePlaceholders("[RID-4]/[RID-4]", {
      now: dayjs("2026-07-09T18:26:33"),
      random: () => 0.99,
    });
    const [first, second] = result.split("/");
    expect(first).toBe(second);
    expect(first).toHaveLength(4);
  });
});

describe("generateRid", () => {
  it("uses only A-Z0-9", () => {
    expect(generateRid(8, () => 0.123)).toMatch(/^[A-Z0-9]{8}$/);
  });
});

describe("ensureExtension", () => {
  it("appends extension when missing", () => {
    expect(ensureExtension("./images/2026-07-09", "png")).toBe(
      "./images/2026-07-09.png",
    );
  });

  it("keeps existing extension", () => {
    expect(ensureExtension("./images/photo.webp", "png")).toBe(
      "./images/photo.webp",
    );
  });
});

describe("extensionFromMimeType", () => {
  it("maps common mime types", () => {
    expect(extensionFromMimeType("image/jpeg")).toBe("jpg");
    expect(extensionFromMimeType("image/png")).toBe("png");
    expect(extensionFromMimeType("image/svg+xml")).toBe("svg");
  });
});
