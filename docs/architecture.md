# アーキテクチャ（提案）

ステータス：**提案**。スプリントS0（ストーリー E00-S02）でプロダクトオーナーと確定し、各判断を `docs/adr/` に記録する。

## 方針

- 言語はTypeScriptに統一し、AIが全体を一貫して扱えるようにする。
- 診断ロジック（`packages/core`）は純粋関数にし、UI・DB・外部APIから切り離す。
- アグリゲーターは `AggregatorAdapter` インターフェースで抽象化し、契約前はモックで開発する。
- 個人データは東京リージョンに保存する。

## 構成

```
apps/
  mobile/        Expo（React Native）アプリ
  api/           APIサーバー（TypeScript）
  admin/         管理用の簡易Web画面（サブスク辞書・価格・特典・解約手順）
packages/
  core/          検出・診断・レコメンドの純粋ロジック
  shared/        型定義、モック明細（fixtures）
docs/
  adr/           判断記録
```

## 技術の候補

| 領域 | 候補 | 備考 |
| --- | --- | --- |
| モバイル | Expo（React Native）+ EAS Build | iOS / Android を1つのコードで |
| API | Node.js + TypeScript（Hono または NestJS） | |
| DB | PostgreSQL | 行単位のアクセス制御を検討 |
| 認証 | 実績のある認証基盤（Auth0 / Cognito / Supabase Auth 等） | パスワードを自前で保存しない |
| ジョブ | キュー（SQS等）＋ワーカー | 明細取得・通知・検出の定期実行 |
| 通知 | Expo Notifications | |
| メール受信 | SES Inbound 等 | 詳細送付の転送先アドレス |
| OCR・抽出 | LLM API（学習に利用されない契約） | マスキング必須 |
| 課金 | RevenueCat 等 | レシート検証はサーバー |
| 鍵管理 | クラウドの鍵管理サービス（KMS） | トークンの暗号化 |
| 分析 | PostHog 等 | 個人データを送らない |
| ホスティング | AWS 東京リージョン（候補） | |

## データの流れ

```
アグリゲーター ──(Adapter)──> 明細の正規化 ──> DB
                                         │
                                         ▼
                      packages/core：定期課金の検出 → 診断 → 提案
                                         │
                      ┌──────────────────┼──────────────────┐
                      ▼                  ▼                  ▼
                  アプリの画面        プッシュ通知      削減実績の記録
メール転送・スクショ ──> マスキング ──> LLMで抽出 ──> 定期課金に紐づけ
```

## 主要なインターフェース

```ts
interface AggregatorAdapter {
  startLink(userId: string): Promise<LinkSession>;
  listAccounts(userId: string): Promise<Account[]>;
  fetchTransactions(userId: string, accountId: string, since: Date): Promise<Transaction[]>;
  unlink(userId: string, accountId: string): Promise<void>;
}

type Transaction = {
  id: string;            // アグリゲーター側ID（重複取込の防止に使う）
  accountId: string;
  date: string;          // YYYY-MM-DD
  merchantRaw: string;   // 明細の表記そのまま
  amountYen: number;     // 支出は正の数
  currency: 'JPY';
};
```
