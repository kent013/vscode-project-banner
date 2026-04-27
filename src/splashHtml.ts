import { BannerColor } from "./colorHash";

export interface SplashHtmlOptions {
  text: string;
  fontSizePx: number;
  durationMs: number;
  color: BannerColor;
  nonce: string;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildSplashHtml(opts: SplashHtmlOptions): string {
  const safeText = escapeHtml(opts.text);
  const fade = Math.min(400, Math.floor(opts.durationMs / 4));
  const visible = Math.max(0, opts.durationMs - fade);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${opts.nonce}'; script-src 'nonce-${opts.nonce}';">
<style nonce="${opts.nonce}">
  html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
  body {
    background: ${opts.color.background};
    color: ${opts.color.foreground};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-weight: 900;
    letter-spacing: -0.02em;
    text-align: center;
    user-select: none;
    cursor: pointer;
    animation: fadeOut ${opts.durationMs}ms ease-in forwards;
  }
  .name {
    font-size: ${opts.fontSizePx}px;
    line-height: 1.0;
    padding: 0 4vw;
    word-break: break-word;
    max-width: 95vw;
  }
  @keyframes fadeOut {
    0% { opacity: 1; }
    ${Math.round((visible / opts.durationMs) * 100)}% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
</head>
<body>
  <div class="name">${safeText}</div>
  <script nonce="${opts.nonce}">
    const vscode = acquireVsCodeApi();
    const dismiss = () => vscode.postMessage({ type: 'dismiss' });
    document.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);
  </script>
</body>
</html>`;
}

export function makeNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
