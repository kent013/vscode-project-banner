# Handoff Notes (previous session → next session)

Last updated: 2026-04-27 (soak-test pass 1) / Author: previous session of Claude Code (user: ishitoya@rio.ne.jp)

## TL;DR

**The user keeps about five VSCode windows open in parallel and keeps mistaking one for another because the title bar alone is too small. This extension flashes the project name large on the screen so you instantly know which window is which.**

Existing extensions did not fully solve it (see comparison below), so this is a custom build. **The MVP and the GitHub release pipeline are complete.**

## Current state (as of 2026-04-27)

Done:

- ✅ Scaffolding (manual: `package.json` / `tsconfig.json` / `.vscodeignore` / `.vscode/launch.json` / `tasks.json`).
- ✅ `src/colorHash.ts` — FNV-1a hash → HSL color, plus `hslToHex` for status-bar tinting.
- ✅ `src/splashHtml.ts` — pure HTML / CSP / escape / nonce helpers, fully unit-tested.
- ✅ `src/splash.ts` — splash Webview controller with min-interval throttle and click/key dismiss.
- ✅ `src/statusBar.ts` — status bar item tinted with the same hue the splash uses.
- ✅ `src/extension.ts` — `onDidChangeWindowState` subscription, config change handling, `projectBanner.show` command.
- ✅ 21 unit tests (mocha + tsc; `npm test` is green).
- ✅ `npm run build` (esbuild bundle) green.
- ✅ Git repository initialized and pushed to `git@github.com:kent013/vscode-project-banner.git`.
- ✅ GitHub Actions release workflow (`v*` tag → build VSIX → attach to release).
- ✅ `extensionKind: ["ui"]` so a single local install covers Remote-SSH windows.
- ✅ Public docs translated to English (README, AGENTS, HANDOFF). README references `docs/splash.png`.
- ✅ Soak-test pass 1 (2026-04-27): user is running the extension in their real five-window rotation.
- ✅ Fix: splash tab no longer keeps focus after fadeout. Old design tried to reuse a hidden panel and switch tabs via `workbench.action.previousEditor`; that command was unreliable and sometimes left the Project Banner tab as the active tab. Now `hide()` calls `panel.dispose()` and lets VSCode restore the previous tab automatically. See `src/splash.ts`.

Not yet done:

- ⏳ Soak-test pass 2: continue using the extension and watch for splash flicker, color collisions between projects, and any remaining edge cases.
- ⏳ Verify the Remote-SSH path works without per-host install (the `extensionKind: ["ui"]` claim).
- ⏳ Optional welcome tab on workspace startup (originally low priority).
- ⏳ MIT license file (README mentions "planned").

## Next steps for the next session

1. [ ] **Continue the soak test.** Watch specifically for:
   - Whether `splash.minIntervalMs = 3000` is too aggressive (gets in the way) or too lenient (still flickers on Cmd+Tab).
   - Whether two real projects accidentally hash to similar hues, in which case the user can override via `projectBanner.text`.
   - **Known and accepted:** the splash also fires when returning from a non-VSCode app (browser, terminal). The official API gives no way to distinguish "came from another VSCode window" from "came from another app" — `WindowState` only exposes `focused: boolean` and `active: boolean`, no window handle. The user has decided to live with it for now. If it becomes annoying, the lever to pull is `splash.minIntervalMs` (or a future "only show after N minutes of inactivity" mode).
2. [ ] Verify the Remote-SSH path works without per-host install (the `extensionKind: ["ui"]` claim).
3. [ ] If the user wants a permanent welcome tab on startup, implement it as a separate concern from the splash.
4. [ ] Add a LICENSE file once the user picks a license.

## Design decisions worth remembering

### Status bar background color cannot be arbitrary HSL

VSCode's API only allows a `ThemeColor` for `StatusBarItem.backgroundColor` (`errorBackground` / `warningBackground` only). Arbitrary HSL is not supported.

→ We use `StatusBarItem.color` instead, which **does** accept arbitrary CSS color strings, and render `$(circle-filled) <project name>` so the dot and the name share the project's hue. The splash's background uses the same HSL, so the two surfaces match exactly.

### Splash is throttled to avoid flicker

`onDidChangeWindowState` fires on every Cmd+Tab. Without a throttle the splash would constantly re-trigger. We default `splash.minIntervalMs` to 3000 ms — enough to suppress the flicker, short enough that round-trips between windows still feel responsive.

### Hide the splash by disposing the panel, not by switching tabs

We tried keeping a single splash panel alive across shows — `hide()` would just call `workbench.action.previousEditor` to switch tabs, leaving the Project Banner panel hidden but warm so the next show was instant. In practice that command was unreliable and sometimes left the Project Banner tab as the active tab in the column, so focus did not return to the user's editor.

Now `hide()` calls `panel.dispose()` and `show()` always creates a fresh panel. Disposing makes VSCode automatically reactivate the previous tab in the same column, which is exactly the focus restore we want. Recreating the webview costs tens of milliseconds — invisible against a 3-second splash.

### CSP / Webview security

`buildSplashHtml` emits `default-src 'none'` plus a per-instance nonce on both `<style>` and `<script>`. The script is just a click/key listener that posts a `dismiss` message; the panel disposes itself on receipt. Project names are run through `escapeHtml` first.

### `extensionKind: ["ui"]` for Remote-SSH

Project Banner only uses UI-side APIs (status bar, webview panel, window state, the workspace name proxied from remote). Declaring it as a UI extension means installing the `.vsix` on the local machine is enough — the extension runs locally even when the user is connected to an SSH host.

## Why this exists (existing extensions comparison)

| Option | Verdict | Reason rejected |
| --- | --- | --- |
| Peacock | ◎ (well-known) | Changes color but does not show the project name as text. With five projects, color alone is easy to misread. |
| `window.title` setting | △ | The macOS title bar is small; visibility is still insufficient. |
| Background / Custom CSS and JS Loader | ✗ | CSS injection breaks on every VSCode update and triggers startup warnings. Not maintainable. |

## Constraints (unchanged)

- TypeScript only. No new `.js` files.
- No CSS-injection hacks.
- Official VSCode API only.
- Tests are required for every testable unit.

## References

- Origin project: [`~/repository/local-test-environments`](../local-test-environments) (LTE toolbox; this extension was carved out because it did not fit there).
- Detailed design: [AGENTS.md](AGENTS.md).
- Public docs / install instructions: [README.md](README.md).
