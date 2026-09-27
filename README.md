# 支払い最適化アプリ（仮称）

口座・カードの明細から毎月の支払いを診断し、サブスクや固定費を安くする提案を行うスマホアプリ。

## 最初に読むもの

1. `CLAUDE.md`：開発方針・禁止事項（AI開発者は必読）
2. `docs/product/overview.md`：プロダクト概要
3. `docs/product/recommendation-principles.md`：レコメンドの7原則
4. `docs/architecture.md`：技術構成（S0で確定）
5. `docs/security.md`：セキュリティ方針
6. `docs/process.md`：開発プロセスと完了の定義
7. `backlog/sprints.md`：スプリント計画

## ローカルで起動する

前提：Node.js 24（`.nvmrc`）

1. `npm install -g pnpm`
2. `pnpm install`
3. `pnpm dev`

API は http://localhost:3000/health で応答します。モバイルアプリの起動は E00-S04 でこの手順に加わります。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm typecheck` | 全ワークスペースの型チェック |
| `pnpm lint` | 全ワークスペースの Lint |
| `pnpm test` | 全ワークスペースの単体テスト |

CI（`.github/workflows/ci.yml`）はプルリクエストごとに上の3つを実行します。`main` はブランチ保護で CI の成功を必須にしているため、CI が失敗したプルリクエストはマージできません。

## 構成

```
apps/
  mobile/    Expo（React Native）アプリ
  api/       APIサーバー
packages/
  core/      検出・診断・レコメンドの純粋ロジック
  shared/    型定義、モック明細（fixtures）
tests/       リポジトリ構成のテスト
```

## AIへの依頼例

> `CLAUDE.md` と `docs/` を読んだうえで、`backlog/stories/E00-S01.md` を実装してください。受け入れ条件ごとにテストを書き、不明点があれば実装前に質問してください。
