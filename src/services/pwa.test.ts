import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("PWA Manifest & Configuration", () => {
  it("should have a valid manifest.json file in public directory", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe("Hr Shoes Commerce");
    expect(manifest.short_name).toBe("Hr Shoes");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.theme_color).toBe("#FF4FB8");
    expect(manifest.background_color).toBe("#F3F1EC");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it("should have a valid Service Worker script public/sw.js", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain("CACHE_NAME");
    expect(swContent).toContain("self.addEventListener");
  });
});
