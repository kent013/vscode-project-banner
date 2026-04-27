# Project Banner for VSCode

複数の VSCode ウィンドウを並行で開いていても、フォーカスを取った瞬間にプロジェクト名を「バーンと」表示して取り違えを防ぐ拡張機能。

- ウィンドウフォーカス取得時にプロジェクト名を画面いっぱいに表示するスプラッシュ
- ステータスバー左下にプロジェクト名のハッシュから決定論的に決まる色付き表示
- スプラッシュとステータスバーの色は完全に一致（同じ HSL hue）
- スプラッシュはクリック / キー押下で即時 dismiss、もしくは設定時間で自動消滅

CSS 注入系のハックは使わず、VSCode 公式 API のみで実装。

## インストール

[Releases](https://github.com/kent013/vscode-project-banner/releases) から最新の `vscode-project-banner-*.vsix` をダウンロードして:

```sh
code --install-extension ./vscode-project-banner-*.vsix
```

または VSCode の Extensions パネル → 右上「…」→ **Install from VSIX...** で読み込み。

すでに開いているウィンドウは `Cmd+Shift+P` → `Developer: Reload Window` で反映。

## 設定

`Cmd+,` から `projectBanner` で検索:

| 設定キー | 既定値 | 説明 |
| --- | --- | --- |
| `projectBanner.splash.enabled` | `true` | フォーカス時のスプラッシュ表示 |
| `projectBanner.splash.durationMs` | `3000` | スプラッシュ表示時間 (ms) |
| `projectBanner.splash.fontSize` | `200` | プロジェクト名のフォントサイズ (px) |
| `projectBanner.splash.minIntervalMs` | `3000` | スプラッシュの最小発火間隔 (ms) |
| `projectBanner.statusBar.enabled` | `true` | ステータスバー項目の表示 |
| `projectBanner.statusBar.useWarningBackground` | `false` | ステータスバーに警告背景を適用してさらに目立たせる |
| `projectBanner.text` | `""` | 表示テキストを上書き（空欄ならワークスペース名） |

## 発火タイミング

スプラッシュは以下を**すべて**満たした時:

1. ウィンドウが「非フォーカス → フォーカス」に変化（別アプリや別 VSCode ウィンドウから戻ってきた瞬間）
2. 前回表示から `splash.minIntervalMs` 経過済み

ウィンドウを開いた直後やリロード直後は activate 時点で既に focused なので発火しません。コマンドパレットの `Project Banner: Show splash now` ならスロットルを無視して即時表示。

## 開発

```sh
npm install
npm test                # 21 unit tests
npm run dev             # Extension Development Host を起動
npm run install:local   # ビルドした .vsix をローカル VSCode に永続インストール
npm run uninstall:local # 永続インストールを取り消す
```

リリース手順は [CONTRIBUTING.md](#リリース) 相当を以下に記載:

```sh
npm version patch         # 0.0.x をbump、自動的に commit + git tag を作る
git push --follow-tags    # main と tag を一緒に push
```

タグ push を契機に GitHub Actions が `.vsix` をビルドして Release に自動添付します。

## ライセンス

個人利用想定。MIT で公開予定。

## 設計の出自

5本のプロジェクトを並行で行き来していて取り違えが多発したので作成。Peacock や `window.title` 設定では視認性が足りず、CSS 注入系ハックは VSCode アップデートで壊れるので避けた。詳細は [AGENTS.md](AGENTS.md) を参照。
