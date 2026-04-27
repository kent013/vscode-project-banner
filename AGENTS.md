# vscode-project-banner

## 使命（North Star）

> **VSCode のウィンドウを並行で複数開いていても、今フォーカスしているのが「どのプロジェクトか」を一瞬で識別できるようにする拡張機能。**
>
> - 利用者は同時に 5 本前後のプロジェクトを行き来している
> - 既存のタイトルバー・ステータスバーは小さく、見間違いを起こす（特にウィンドウ切替直後）
> - 「画面にバーンと出る」レベルの視覚的アンカーを VSCode 公式 API の範囲で実現する

## スコープ

### やること
- ウィンドウフォーカス取得時に、エディタを覆うスプラッシュ Webview を短時間（1〜1.5秒）表示してプロジェクト名を巨大に出す
- 常時表示の極太ステータスバー項目（プロジェクト名のハッシュから自動色付け）
- ワークスペース起動時の全画面ウェルカムタブ（任意）

### やらないこと
- **CSS 注入系のハック**（Custom CSS and JS Loader 等）は禁止。VSCode 更新で壊れる + 起動時警告が出てメンテ不能になるため
- タイトルバーやアクティビティバーへの直接介入（公式 API で許可されない）
- 色だけでの区別（それは Peacock の領分。本拡張は「プロジェクト名のテキスト」を視認させるのが価値）

## 技術方針

- **言語: TypeScript 必須**。`.js` の新規作成禁止
- **VSCode 拡張 API のみ**を使う。Electron の内部 API には触らない
- 主要 API:
  - `vscode.window.onDidChangeWindowState` — フォーカス検知
  - `vscode.window.createWebviewPanel` — スプラッシュ表示
  - `vscode.window.createStatusBarItem` — 常時表示
  - `vscode.workspace.workspaceFolders` / `vscode.workspace.name` — プロジェクト名取得
- 設定で挙動を切替可能に:
  - スプラッシュ表示時間（ms）
  - 自動色付けのオン/オフ
  - 表示位置・フォントサイズ
  - 表示するテキスト（プロジェクト名・カスタム文字列）

## 禁止事項

| #   | 禁止事項                                                                 |
| --- | ------------------------------------------------------------------------ |
| 1   | JavaScript の使用（TypeScript 必須）                                     |
| 2   | CSS 注入系のハック手法（Custom CSS and JS Loader 等の前提依存）          |
| 3   | テストなしの実装完了                                                     |
| 4   | 不必要な複雑化（5本のプロジェクト識別というシンプルな価値からブレない） |
| 5   | VSCode の非公式 / 内部 API への依存                                      |

## ディレクトリ構造（現状）

```
vscode-project-banner/
├── .vscode/
│   ├── launch.json         # F5 で Run Extension（preLaunchTask: npm: build）
│   └── tasks.json          # npm: build / npm: watch
├── src/
│   ├── extension.ts        # エントリポイント（activate/deactivate, focus/設定変更購読）
│   ├── splash.ts           # フォーカス時スプラッシュ Webview コントローラ（vscode 依存）
│   ├── splashHtml.ts       # HTML/CSP/エスケープ/nonce の純粋関数（テスト容易性のため分離）
│   ├── statusBar.ts        # ステータスバー項目
│   └── colorHash.ts        # プロジェクト名→色（FNV-1a → HSL）と色絵文字の決定論的マッピング
├── test/
│   ├── colorHash.test.ts
│   └── splash.test.ts      # buildSplashHtml / escapeHtml / makeNonce の単体テスト
├── dist/                   # esbuild バンドル出力（gitignore）
├── out/                    # tsc 出力（テスト用、gitignore）
├── package.json            # contributes / activationEvents / engines.vscode
├── tsconfig.json
└── .vscodeignore
```

## API 制約に関するメモ

- **StatusBarItem の `backgroundColor` は ThemeColor 限定**（`statusBarItem.errorBackground` / `warningBackground` のみ）。任意の HSL は設定不可。
  - 解決策: 色絵文字（🟥🟧🟨🟩🟦🟪🟫⬛⬜）を `text` の頭に付けて視認性を出し、必要なら `useWarningBackground` で warning 背景に切替。
- **Webview はエディタ領域内にしか描けない**（公式 API の壁）。ウィンドウ全体を覆う「真のオーバーレイ」は不可能。
  - スプラッシュ Webview は `ViewColumn.Active` に短時間だけ開いて自動 dispose する方式で「バーン感」を出す。

## 設計原則

- **シンプルさ優先** — 「どのプロジェクトか分かる」以上の機能を盛らない
- **設定の既定値で完結する** — 初回インストール後、設定を一切いじらなくても価値が出る状態を作る
- **テストファースト** — Webview の DOM や色付け関数は単体テスト可能な形で切り出す
- **devサーバ等は立ち上げない** — F5 デバッグ起動はユーザーが行う
