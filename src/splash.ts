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

  const clearTimer = (): void => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    }
  };

  // Disposing the panel makes VSCode restore the previous tab in the same
  // column, so focus returns to whatever the user was looking at. Reusing
  // a single hidden panel was tempting for the warm-renderer optimization,
  // but it left the Project Banner tab as the active tab in some cases.
  const hide = (): void => {
    clearTimer();
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

      hide();

      const html = buildSplashHtml({
        text,
        fontSizePx: opts.fontSizePx,
        durationMs: opts.durationMs,
        color,
        nonce: makeNonce(),
      });

      panel = vscode.window.createWebviewPanel(
        "projectBanner.splash",
        text,
        { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
        { enableScripts: true, retainContextWhenHidden: false },
      );
      panel.webview.onDidReceiveMessage((msg: { type?: string }) => {
        if (msg?.type === "dismiss") {
          hide();
        }
      });
      panel.onDidDispose(() => {
        clearTimer();
        panel = undefined;
      });
      panel.webview.html = html;

      closeTimer = setTimeout(() => {
        hide();
      }, opts.durationMs);
    },
    dispose: hide,
  };
}
