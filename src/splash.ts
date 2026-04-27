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

  const hide = (): void => {
    // Don't dispose — switching tabs leaves the webview's renderer warm so the
    // next show is near-instant. The Project Banner tab stays as an inactive
    // tab in the editor area.
    void vscode.commands.executeCommand("workbench.action.previousEditor");
  };

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

      const html = buildSplashHtml({
        text,
        fontSizePx: opts.fontSizePx,
        durationMs: opts.durationMs,
        color,
        nonce: makeNonce(),
      });

      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = undefined;
      }

      if (!panel) {
        panel = vscode.window.createWebviewPanel(
          "projectBanner.splash",
          text,
          { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
          { enableScripts: true, retainContextWhenHidden: true },
        );
        panel.webview.onDidReceiveMessage((msg: { type?: string }) => {
          if (msg?.type === "dismiss") {
            hide();
          }
        });
        panel.onDidDispose(() => {
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = undefined;
          }
          panel = undefined;
        });
      } else {
        panel.title = text;
        panel.reveal(vscode.ViewColumn.Active, true);
      }
      panel.webview.html = html;

      closeTimer = setTimeout(() => {
        hide();
      }, opts.durationMs);
    },
    dispose,
  };
}
