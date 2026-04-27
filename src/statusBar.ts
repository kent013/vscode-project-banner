import * as vscode from "vscode";
import { BannerColor } from "./colorHash";

export interface StatusBarOptions {
  enabled: boolean;
  useWarningBackground: boolean;
}

export interface BannerStatusBar {
  update(text: string, color: BannerColor, opts: StatusBarOptions): void;
  dispose(): void;
}

export function createBannerStatusBar(): BannerStatusBar {
  const item = vscode.window.createStatusBarItem(
    "projectBanner.name",
    vscode.StatusBarAlignment.Left,
    Number.MAX_SAFE_INTEGER,
  );
  item.name = "Project Banner";
  item.command = {
    command: "workbench.action.openSettings",
    title: "Configure Project Banner",
    arguments: ["projectBanner"],
  };

  return {
    update(text, color, opts) {
      if (!opts.enabled) {
        item.hide();
        return;
      }
      // ● is tinted by item.color, which accepts a hex string. The dot uses
      // the same HSL hue as the splash background so the two surfaces match.
      // The project name itself stays the theme's default text color so it
      // remains readable on any theme.
      item.text = `$(circle-filled) ${text}`;
      item.color = color.backgroundHex;
      item.tooltip = `Project Banner — ${text}\n(click to open settings)`;
      item.backgroundColor = opts.useWarningBackground
        ? new vscode.ThemeColor("statusBarItem.warningBackground")
        : undefined;
      item.show();
    },
    dispose() {
      item.dispose();
    },
  };
}
