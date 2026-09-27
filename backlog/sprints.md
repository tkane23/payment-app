# スプリント計画（1スプリント＝1週間）

各スプリントの終わりに、プロダクトオーナーが実機でゴールを確認します。

## S0：土台づくり

ゴール：リポジトリ・CI・モック明細データ・アーキテクチャを確定し、空のアプリが実機で動く

- [E00-S01](stories/E00-S01.md) モノレポとCIの構築（Must・M）
- [E00-S02](stories/E00-S02.md) アーキテクチャの確定と記録（Must・S）
- [E00-S03](stories/E00-S03.md) モック明細データの作成（Must・M）
- [E00-S04](stories/E00-S04.md) 空のアプリを実機で起動（Must・M）

## S1：認証

ゴール：会員登録・ログイン・生体認証で、自分のアカウントに入れる

- [E01-S01](stories/E01-S01.md) メール・Apple・Googleでの会員登録とログイン（Must・M）
- [E01-S02](stories/E01-S02.md) 生体認証によるアプリロック（Must・S）
- [E12-S01](stories/E12-S01.md) 保存データの暗号化と秘密情報の管理（Must・M）

## S2：連携（モック）

ゴール：モックのアグリゲーターで口座連携〜明細取得が一通り動く

- [E02-S01](stories/E02-S01.md) アグリゲーター接続の抽象化とモック実装（Must・M）
- [E02-S02](stories/E02-S02.md) 口座・カードの連携と解除（Must・M）
- [E02-S03](stories/E02-S03.md) 明細の定期取得（Must・M）

## S3：検出

ゴール：明細から定期課金を検出し、上位50サービスの名前が出る

- [E03-S01](stories/E03-S01.md) 定期課金の検出エンジン（Must・L）
- [E03-S02](stories/E03-S02.md) サブスク辞書によるサービス名の特定（Must・M）
- [E03-S03](stories/E03-S03.md) 定期課金の一覧画面（Must・M）
- [E11-S01](stories/E11-S01.md) サブスク辞書の管理（Must・M）
- [E12-S03](stories/E12-S03.md) LLM利用時のマスキング（Must・M）

## S4：診断

ゴール：診断サマリーと、重複・年額化の提案が7原則の形式で出る

- [E04-S01](stories/E04-S01.md) レコメンドの共通データ形式（7原則）（Must・M）
- [E04-S02](stories/E04-S02.md) 診断サマリー画面（Must・M）
- [E04-S03](stories/E04-S03.md) 重複の提案（Must・M）
- [E04-S04](stories/E04-S04.md) 年額化の提案（Must・S）
- [E11-S02](stories/E11-S02.md) 価格データベースの管理（Must・M）

## S5：利用確認

ゴール：「使ってる？」チェックと未使用の提案、提案へのフィードバックが動く

- [E09-S01](stories/E09-S01.md) 月一の「使ってる？」チェック（Must・M）
- [E09-S02](stories/E09-S02.md) 未使用の提案（Must・S）
- [E09-S03](stories/E09-S03.md) 提案へのフィードバック（Must・S）

## S6：通知

ゴール：引き落とし前日・トライアル終了・値上げのプッシュ通知が届く

- [E06-S01](stories/E06-S01.md) プッシュ通知の基盤（Must・M）
- [E06-S02](stories/E06-S02.md) 引き落とし前日の通知（無料）（Must・S）
- [E06-S03](stories/E06-S03.md) トライアル終了・値上げ・年額更新の通知（Must・M）

## S7：守る

ゴール：請求ミスの検知と、大きな支払いの予定表が動く

- [E06-S04](stories/E06-S04.md) 大きな支払いの予定表（Must・M）
- [E07-S01](stories/E07-S01.md) 二重課金・解約後請求の検知（Must・M）
- [E07-S02](stories/E07-S02.md) 返金の問い合わせ文の作成（Must・S）

## S8：全体最適

ゴール：特典データベースを使った支払い経路の最適化と、特典の使い忘れ検知が動く

- [E04-S05](stories/E04-S05.md) 支払い経路の最適化の提案（Must・L）
- [E04-S06](stories/E04-S06.md) 特典の使い忘れ検知（Must・M）
- [E11-S03](stories/E11-S03.md) 特典データベースの管理（Must・M）

## S9：詳細の取り込み

ゴール：領収書メールの転送とスクショOCRで、プラン名・更新日が取り込める

- [E05-S01](stories/E05-S01.md) 領収書メールの転送による取り込み（Must・L）
- [E05-S02](stories/E05-S02.md) スクショのOCRによる取り込み（Should・M）
- [E05-S03](stories/E05-S03.md) 詳細送付の依頼（ピック）（Should・S）

## S10：実行支援

ゴール：解約ナビ・完了確認・削減実績・解約の予約が動く

- [E08-S01](stories/E08-S01.md) 解約・変更ナビ（Must・M）
- [E08-S02](stories/E08-S02.md) 実行の確認と削減実績（Must・M）
- [E08-S03](stories/E08-S03.md) 解約の予約（Should・S）
- [E11-S04](stories/E11-S04.md) 解約手順データベースの管理（Must・M）

## S11：課金

ゴール：有料版の購入と、無料/有料の機能制御が動く

- [E10-S01](stories/E10-S01.md) アプリ内課金（月額・年額）（Must・M）
- [E10-S02](stories/E10-S02.md) 無料/有料の機能制御（Must・M）

## S12：堅牢化

ゴール：データ削除・監査ログ・計測を整え、本番のアグリゲーターに接続する

- [E01-S03](stories/E01-S03.md) 退会とデータの完全削除（Must・M）
- [E02-S04](stories/E02-S04.md) 本番アグリゲーターのAdapter実装（Must・L）
- [E12-S02](stories/E12-S02.md) 監査ログと社内アクセス制御（Must・M）
- [E13-S01](stories/E13-S01.md) KPIの計測（Must・M）

## S13：β準備

ゴール：外部セキュリティ診断の指摘を直し、クローズドβを配布できる

- [E12-S04](stories/E12-S04.md) 外部セキュリティ診断と指摘対応（Must・L）
- [E13-S02](stories/E13-S02.md) クローズドβの配布（Must・M）
