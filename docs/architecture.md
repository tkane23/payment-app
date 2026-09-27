# アーキテクチャ

ステータス：**確定**（2026-09-27、ストーリー E00-S02）。各判断の理由は `docs/adr/` を参照。判断を変えるときは新しいADRを追加し、この文書を更新する。

## 方針

- 言語はTypeScriptに統一し、AIが全体を一貫して扱えるようにする。
- 診断ロジック（`packages/core`）は純粋関数にし、UI・DB・外部APIから切り離す。
- アグリゲーターは `AggregatorAdapter` インターフェースで抽象化し、契約前はモックで開発する。
- サーバー側はAWSの東京リージョン（ap-northeast-1）に集約し、個人データは東京に保存する。

## 構成

```
apps/
  mobile/        Expo（React Native）アプリ
  api/           APIサーバー（Hono）
  admin/         管理用の簡易Web画面（サブスク辞書・価格・特典・解約手順）
packages/
  core/          検出・診断・レコメンドの純粋ロジック
  shared/        型定義、モック明細（fixtures）
docs/
  adr/           判断記録
```

## 技術の判断

状態：「確定」は当初の候補どおりに決めたもの、「変更」は候補から変えたもの（時期の変更を含む）。

| 領域 | 状態 | 決定 | ADR |
| --- | --- | --- | --- |
| ホスティング | 確定 | AWS 東京リージョン（ap-northeast-1）に集約 | [0002](adr/0002-AWS東京リージョンへの集約.md) |
| モバイル | 確定 | Expo（React Native）+ EAS Build | [0006](adr/0006-モバイルと通知はExpo.md) |
| API | 確定 | Node.js + TypeScript + Hono | [0003](adr/0003-APIフレームワークはHono.md) |
| DB | 確定 | PostgreSQL（Amazon RDS、東京） | [0004](adr/0004-個人データの保存と暗号化.md) |
| 認証 | 確定 | Amazon Cognito（メール・Apple・Google） | [0005](adr/0005-認証はAmazon-Cognito.md) |
| ジョブ | 確定 | Amazon SQS ＋ ワーカー | [0002](adr/0002-AWS東京リージョンへの集約.md) |
| 通知 | 確定 | Expo Notifications | [0006](adr/0006-モバイルと通知はExpo.md) |
| メール受信 | 確定 | Amazon SES の受信機能（詳細送付の転送先） | [0002](adr/0002-AWS東京リージョンへの集約.md) |
| OCR・抽出 | 変更 | 条件だけ確定し、提供元とモデルは E05-S01 で精度と料金を比べて決める | [0009](adr/0009-抽出用LLMの選定はE05-S01で行う.md) |
| 課金 | 確定 | RevenueCat（レシート検証はサーバー） | [0007](adr/0007-アプリ内課金はRevenueCat.md) |
| 鍵管理 | 確定 | AWS KMS | [0004](adr/0004-個人データの保存と暗号化.md) |
| 分析 | 変更 | 外部の分析サービスは使わず、自前のDB（東京）に操作イベントを記録して集計する | [0008](adr/0008-利用状況の分析は自前で計測する.md) |

リポジトリとCIの構成は [0001](adr/0001-モノレポとCIのツール選定.md) を参照。

### まだ決めていないこと

| 項目 | 決める時期 |
| --- | --- |
| APIの実行環境（Lambda / ECS など） | APIを初めてデプロイするとき（ADRを追加） |
| PostgreSQLの行単位アクセス制御（RLS）の採否 | E12-S01 |
| 管理画面の技術 | E11-S01 |
| 抽出用LLMの提供元とモデル | E05-S01 |
| バックアップからの削除期限 | `docs/security.md` の「要決定」。退会処理（E01-S03）まで |

## 個人データの保存場所と暗号化

| 項目 | 内容 |
| --- | --- |
| リージョン | すべて AWS 東京リージョン（ap-northeast-1）。バックアップも東京に置く |
| 保存場所 | 明細・定期課金・提案・削減実績・操作イベント：Amazon RDS for PostgreSQL。会員の認証情報：Amazon Cognito。アグリゲーターのトークン：RDS（アプリ層で暗号化したうえで保存） |
| 通信の暗号化 | TLS 1.2 以上（アプリ⇔API、API⇔RDS、API⇔外部サービス） |
| 保存時の暗号化 | RDS のストレージ暗号化（AES-256、鍵は AWS KMS のカスタマー管理キー）。スナップショット・バックアップも同じ鍵で暗号化される |
| トークンの暗号化 | アグリゲーターのトークンはアプリ層でも暗号化する（KMS のデータキーによるエンベロープ暗号化、AES-256-GCM）。平文のトークンはメモリ上でのみ扱い、ログに出さない |
| 保存しないもの | 銀行・カードのログイン情報、領収書メールの原文とスクショ画像（抽出後に削除）、カード番号・口座番号の全桁（`docs/security.md`） |
| 東京の外に出るデータ | 下の表のとおり。いずれも明細や金額の一覧は送らない |

| 送り先 | 送るもの | 備考 |
| --- | --- | --- |
| Expo・Apple・Google（プッシュ通知） | 通知の本文、端末のプッシュトークン | 本文に含める情報の範囲は E06-S01 で決める |
| RevenueCat | 購入情報と、個人を特定しない利用者ID | 氏名・メールアドレスは送らない |
| 抽出用LLM | マスキング済みの領収書の本文・画像 | E05-S01・E12-S03 で決める |

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
