import * as vscode from "vscode";
import { BannerColor } from "./colorHash";
import { buildSplashHtml, makeNonce } from "./splashHtml";

export interface SplashController {
  show(text: string, color: BannerColor): void;
  dispose(): void;
}

export interface SplashRuntimeOptions {
  durationMs: number;
  fontSizePx: number;
  minIntervalMs: number;
}

export function createSplashController(
  getOptions: () => SplashRuntimeOptions,
): SplashController {
  let panel: vscode.WebviewPanel | undefined;
  let closeTimer: NodeJS.Timeout | undefined;
  let lastShownAt = 0;

  const dispose = (): void => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    }
    if (panel) {
      panel.dispose();
      panel = undefined;
    }
  };

  return {
    show(text, color) {
      const now = Date.now();
      const opts = getOptions();
      if (now - lastShownAt < opts.minIntervalMs) {
        return;
      }
      lastShownAt = now;
      dispose();
      panel = vscode.window.createWebviewPanel(
        "projectBanner.splash",
        text,
        { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
        { enableScripts: true, retainContextWhenHidden: false },
      );
      panel.webview.html = buildSplashHtml({
        text,
        fontSizePx: opts.fontSizePx,
        durationMs: opts.durationMs,
        color,
        nonce: makeNonce(),
      });
      panel.webview.onDidReceiveMessage((msg: { type?: string }) => {
        if (msg?.type === "dismiss") {
          panel?.dispose();
        }
      });
      panel.onDidDispose(() => {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = undefined;
        }
        panel = undefined;
      });
      closeTimer = setTimeout(() => {
        if (panel) {
          panel.dispose();
        }
      }, opts.durationMs);
    },
    dispose,
  };
}
