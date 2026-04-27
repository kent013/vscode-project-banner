import * as vscode from "vscode";
import { projectNameToColor } from "./colorHash";
import { createSplashController } from "./splash";
import { createBannerStatusBar } from "./statusBar";

const CONFIG_SECTION = "projectBanner";

function resolveProjectName(): string {
  const override = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>("text", "")
    .trim();
  if (override) {
    return override;
  }
  if (vscode.workspace.name) {
    return vscode.workspace.name;
  }
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0]!.name;
  }
  return "(no project)";
}

export function activate(context: vscode.ExtensionContext): void {
  // Project Banner is a UI-only extension. If it ends up activated on the
  // Workspace side (e.g. the user installed it on a Remote-SSH host or in a
  // devcontainer image before extensionKind: ["ui"] was effective), bail out
  // so the status bar item and splash are not duplicated across hosts.
  if (context.extension.extensionKind === vscode.ExtensionKind.Workspace) {
    return;
  }

  const statusBar = createBannerStatusBar();
  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  const splash = createSplashController(() => {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
      durationMs: cfg.get<number>("splash.durationMs", 3000),
      fontSizePx: cfg.get<number>("splash.fontSize", 200),
      minIntervalMs: cfg.get<number>("splash.minIntervalMs", 3000),
    };
  });
  context.subscriptions.push({ dispose: () => splash.dispose() });

  const refreshStatusBar = (): void => {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const name = resolveProjectName();
    statusBar.update(name, projectNameToColor(name), {
      enabled: cfg.get<boolean>("statusBar.enabled", true),
      useWarningBackground: cfg.get<boolean>(
        "statusBar.useWarningBackground",
        false,
      ),
    });
  };

  refreshStatusBar();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(CONFIG_SECTION)) {
        refreshStatusBar();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(refreshStatusBar),
    vscode.window.onDidChangeWindowState((state) => {
      if (!state.focused) {
        return;
      }
      const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
      if (!cfg.get<boolean>("splash.enabled", true)) {
        return;
      }
      const name = resolveProjectName();
      splash.show(name, projectNameToColor(name));
    }),
    vscode.commands.registerCommand("projectBanner.show", () => {
      const name = resolveProjectName();
      splash.show(name, projectNameToColor(name));
    }),
  );
}

export function deactivate(): void {
  // Subscriptions are disposed by VSCode automatically.
}
