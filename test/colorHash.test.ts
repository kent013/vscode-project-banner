import * as assert from "node:assert/strict";
import { describe, it } from "mocha";
import { hashString, hslToHex, projectNameToColor } from "../src/colorHash";

describe("hashString", () => {
  it("is deterministic", () => {
    assert.equal(hashString("vscode-project-banner"), hashString("vscode-project-banner"));
  });

  it("returns a non-negative 32-bit integer", () => {
    const h = hashString("foo");
    assert.ok(Number.isInteger(h));
    assert.ok(h >= 0);
    assert.ok(h <= 0xffffffff);
  });

  it("differs for trivially different inputs", () => {
    assert.notEqual(hashString("alpha"), hashString("beta"));
  });

  it("handles empty input", () => {
    assert.equal(typeof hashString(""), "number");
  });
});

describe("projectNameToColor", () => {
  it("is deterministic for the same name", () => {
    const a = projectNameToColor("my-project");
    const b = projectNameToColor("my-project");
    assert.deepEqual(a, b);
  });

  it("returns a hue in [0, 360)", () => {
    for (const name of ["a", "b", "c", "vscode", "lte", "banner", "🐱"]) {
      const c = projectNameToColor(name);
      assert.ok(c.hue >= 0 && c.hue < 360, `hue out of range for ${name}: ${c.hue}`);
    }
  });

  it("uses fixed saturation and lightness so contrast stays readable", () => {
    const c = projectNameToColor("anything");
    assert.equal(c.saturation, 70);
    assert.equal(c.lightness, 45);
  });

  it("emits an HSL background, a hex background, and a hex foreground", () => {
    const c = projectNameToColor("x");
    assert.match(c.background, /^hsl\(\d+, 70%, 45%\)$/);
    assert.match(c.backgroundHex, /^#[0-9a-f]{6}$/i);
    assert.match(c.foreground, /^#[0-9a-f]{6}$/i);
  });

  it("background HSL and backgroundHex describe the same color", () => {
    // For a given name, the HSL string and the hex string should round-trip
    // through hslToHex.
    const c = projectNameToColor("vscode-project-banner");
    assert.equal(c.backgroundHex, hslToHex(c.hue, c.saturation, c.lightness));
  });
});

describe("hslToHex", () => {
  it("matches known values", () => {
    assert.equal(hslToHex(0, 100, 50), "#ff0000");
    assert.equal(hslToHex(120, 100, 50), "#00ff00");
    assert.equal(hslToHex(240, 100, 50), "#0000ff");
    assert.equal(hslToHex(0, 0, 0), "#000000");
    assert.equal(hslToHex(0, 0, 100), "#ffffff");
  });

  it("returns valid 6-digit hex for any hue", () => {
    for (let h = 0; h < 360; h += 37) {
      assert.match(hslToHex(h, 70, 45), /^#[0-9a-f]{6}$/);
    }
  });
});
