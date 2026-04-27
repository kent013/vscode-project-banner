import * as assert from "node:assert/strict";
import { describe, it } from "mocha";
import { buildSplashHtml, escapeHtml, makeNonce } from "../src/splashHtml";
import { projectNameToColor } from "../src/colorHash";

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    assert.equal(
      escapeHtml(`<script>alert("x" & 'y')</script>`),
      "&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;",
    );
  });

  it("returns plain text unchanged", () => {
    assert.equal(escapeHtml("vscode-project-banner"), "vscode-project-banner");
  });
});

describe("buildSplashHtml", () => {
  const baseOpts = {
    fontSizePx: 200,
    durationMs: 1200,
    color: projectNameToColor("demo"),
    nonce: "TESTNONCE",
  };

  it("includes the project name escaped", () => {
    const html = buildSplashHtml({ ...baseOpts, text: `<b>weird&name</b>` });
    assert.ok(html.includes("&lt;b&gt;weird&amp;name&lt;/b&gt;"));
    assert.ok(!html.includes("<b>weird"));
  });

  it("uses the requested font size in px", () => {
    const html = buildSplashHtml({ ...baseOpts, text: "x", fontSizePx: 333 });
    assert.ok(html.includes("font-size: 333px"));
  });

  it("uses the color background and foreground", () => {
    const html = buildSplashHtml({ ...baseOpts, text: "x" });
    assert.ok(html.includes(baseOpts.color.background));
    assert.ok(html.includes(baseOpts.color.foreground));
  });

  it("ties CSP, style tag, and script tag to the same nonce", () => {
    const html = buildSplashHtml({ ...baseOpts, text: "x", nonce: "ABC123" });
    assert.ok(html.includes("'nonce-ABC123'"));
    assert.ok(html.includes('<style nonce="ABC123">'));
    assert.ok(html.includes('<script nonce="ABC123">'));
  });

  it("declares a strict CSP that only allows nonce-tagged scripts and styles", () => {
    const html = buildSplashHtml({ ...baseOpts, text: "x", nonce: "N" });
    assert.ok(html.includes("default-src 'none'"));
    assert.ok(html.includes("script-src 'nonce-N'"));
    assert.ok(html.includes("style-src 'nonce-N'"));
    assert.ok(!html.includes("'unsafe-inline'"));
  });

  it("posts a dismiss message on click and key", () => {
    const html = buildSplashHtml({ ...baseOpts, text: "x" });
    assert.ok(html.includes("acquireVsCodeApi"));
    assert.ok(html.includes("'dismiss'"));
    assert.ok(html.includes("addEventListener('click'"));
    assert.ok(html.includes("addEventListener('keydown'"));
  });
});

describe("makeNonce", () => {
  it("returns a 32-char alphanumeric string", () => {
    const n = makeNonce();
    assert.equal(n.length, 32);
    assert.match(n, /^[A-Za-z0-9]{32}$/);
  });

  it("produces different nonces on repeated calls", () => {
    const a = makeNonce();
    const b = makeNonce();
    assert.notEqual(a, b);
  });
});
