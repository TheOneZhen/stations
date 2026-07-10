import * as path from "node:path";
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { resolveAvailablePath } from "../src/path/collision";
import { resolveTemplate } from "../src/template/templateEngine";

describe("resolveAvailablePath", () => {
  it("returns first available candidate", async () => {
    const existing = new Set(["/tmp/a.png", "/tmp/a-1.png"]);
    const result = await resolveAvailablePath("/tmp/a.png", async (candidate) =>
      existing.has(candidate),
    );
    expect(result).toBe("/tmp/a-2.png");
  });
});

describe("resolveTemplate", () => {
  it("resolves markdown template to save path and insert text", async () => {
    const documentDir = path.join("/project", "docs");
    const result = await resolveTemplate({
      template: "![altText](./images/[YYYY-MM-DD])",
      languageId: "markdown",
      documentDir,
      imageExtension: "png",
      placeholderContext: {
        now: dayjs("2026-07-09T10:00:00"),
        random: () => 0,
      },
      pathExists: async () => false,
    });

    expect(result.absoluteSavePath).toBe(
      path.join(documentDir, "images", "2026-07-09.png"),
    );
    expect(result.referencePath).toBe("./images/2026-07-09.png");
    expect(result.insertText).toBe("![altText](./images/2026-07-09.png)");
  });

  it("uses collision suffix when target file exists", async () => {
    const documentDir = path.join("/project", "docs");
    const existingPath = path.join(documentDir, "images", "2026-07-09.png");
    const result = await resolveTemplate({
      template: "![altText](./images/[YYYY-MM-DD])",
      languageId: "markdown",
      documentDir,
      imageExtension: "png",
      placeholderContext: {
        now: dayjs("2026-07-09T10:00:00"),
        random: () => 0,
      },
      pathExists: async (candidate) => candidate === existingPath,
    });

    expect(result.absoluteSavePath).toBe(
      path.join(documentDir, "images", "2026-07-09-1.png"),
    );
    expect(result.insertText).toBe("![altText](./images/2026-07-09-1.png)");
  });
});
