# vscode-project-banner

## North Star

> **A VSCode extension that lets you instantly recognize which project the currently-focused window belongs to, even when several windows are open in parallel.**
>
> - The user juggles ~5 projects at the same time.
> - The existing title bar and status bar are too small to reliably distinguish, especially right after switching windows.
> - The goal is a "this is the one" visual anchor — strictly within the official VSCode extension API.

## Scope

### In scope

- A short-lived splash Webview that covers the editor area for ~1–3 seconds when the window gains focus, displaying the project name at very large size.
- A permanent status bar item showing the project name, tinted with a deterministic per-project color.
- (Optional, low priority) A welcome tab that opens on workspace startup with a similarly large project name.

### Out of scope

- **CSS-injection style hacks** (Custom CSS and JS Loader and similar). They break on every VSCode update and trigger startup warnings — not maintainable.
- Modifying the title bar or activity bar directly (the official API does not allow it).
- Color-only differentiation. That is Peacock's territory; the value of this extension is letting you actually read the project's **name**.

## Technical principles

- **TypeScript only.** No new `.js` files.
- **Official VSCode extension API only.** No Electron internals.
- Key APIs:
  - `vscode.window.onDidChangeWindowState` — focus detection.
  - `vscode.window.createWebviewPanel` — splash rendering.
  - `vscode.window.createStatusBarItem` — permanent status bar item.
  - `vscode.workspace.workspaceFolders` / `vscode.workspace.name` — project name source.
- Behavior is configurable:
  - Splash duration (ms).
  - Auto-coloring on/off.
  - Display position and font size.
  - Displayed text (project name or custom string).

## Hard rules

| #   | Rule                                                                      |
| --- | ------------------------------------------------------------------------- |
| 1   | No JavaScript source files. TypeScript only.                              |
| 2   | No CSS-injection-based hacks (Custom CSS and JS Loader and similar).      |
| 3   | No "done" without tests for what is testable.                             |
| 4   | No unnecessary complexity. Stay anchored to the "5 windows" simple value. |
| 5   | No reliance on unofficial / internal VSCode APIs.                         |

## Directory layout (current)

```
vscode-project-banner/
├── .github/
│   └── workflows/
│       └── release.yml      # tag push (v*) → build VSIX → attach to GitHub Release
├── .vscode/
│   ├── launch.json          # F5: Run Extension (preLaunchTask: npm: build)
│   └── tasks.json           # npm: build / npm: watch
├── docs/
│   └── splash.png           # README screenshot
├── src/
│   ├── extension.ts         # entry point: activate/deactivate, focus & config subscriptions
│   ├── splash.ts            # splash Webview controller (depends on vscode)
│   ├── splashHtml.ts        # pure HTML/CSP/escape/nonce helpers (split out for testability)
│   ├── statusBar.ts         # status bar item
│   └── colorHash.ts         # project name → color (FNV-1a → HSL → hex)
├── test/
│   ├── colorHash.test.ts
│   └── splash.test.ts       # buildSplashHtml / escapeHtml / makeNonce unit tests
├── dist/                    # esbuild bundle output (gitignored)
├── out/                     # tsc output for tests (gitignored)
├── package.json             # contributes / activationEvents / engines.vscode / extensionKind
├── tsconfig.json
├── README.md                # public-facing docs
├── HANDOFF.md               # session-to-session handoff notes
└── .vscodeignore
```

## API constraints worth remembering

- **`StatusBarItem.backgroundColor` only accepts a `ThemeColor`** (`statusBarItem.errorBackground` / `warningBackground`). Arbitrary HSL is not allowed.
  - Solution: use `StatusBarItem.color` (which **does** accept arbitrary CSS color strings) to tint a `$(circle-filled) <name>` text. The hue derived from the project name is the same one the splash uses for its background, so both surfaces match exactly.
- **A Webview only paints inside the editor area.** A "true" full-window overlay is impossible from extensions.
  - Solution: open a Webview panel in `ViewColumn.Active` for a few seconds and dispose it. That is enough to produce the "this one" effect when switching windows.
- **`onDidChangeWindowState` only fires on changes**, not on activation. So the splash never appears when the window is first opened — only when focus comes back from elsewhere. The `Project Banner: Show splash now` command is the on-demand escape hatch.

## Distribution

- The extension is declared `extensionKind: ["ui"]`. A single local install is enough; Remote-SSH windows reuse the local install instead of requiring a per-host install.
- Releases are published via GitHub Actions: `npm version patch` → `git push --follow-tags` builds a `.vsix` and attaches it to a `v*` GitHub Release.

## Design heuristics

- **Simplicity first.** Do not add features beyond "tell me which project this is."
- **Defaults must work.** A fresh install should be useful with zero configuration.
- **Test-first.** Webview HTML, escaping, and color hashing are split into pure functions and covered by unit tests.
- **No dev server, no scripted F5.** The user runs F5 themselves; the extension is allowed to assume an interactive developer.
