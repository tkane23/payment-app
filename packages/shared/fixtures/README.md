# モック明細（E00-S03）

実在の口座なしで検出・診断のロジックを開発するための、架空の明細データです。2025年10月〜2026年9月の12か月分。形式の判断は `docs/adr/0010-モック明細の形式と正解データ.md`。

**このフォルダの JSON は手で編集しないでください。** `packages/shared/src/fixtures/build.ts` を直し、`pnpm --filter @payment-app/shared fixtures:generate` で作り直します。

| ファイル | 中身 |
| --- | --- |
| `persona-{a,b,c}.json` | 口座・明細・「使ってる？」の回答・解約の報告 |
| `persona-{a,b,c}.expected.json` | 期待される検出結果（定期課金の一覧と、各ケースの正解） |
| `plan-prices.json` | 年額プランの価格（価格データベースの代わり。金額は架空） |

## ペルソナとケース

| ペルソナ | 明細 | 定期課金 | 含まれるケース |
| --- | --- | --- | --- |
| A. サブスク過多の単身 | 463件 | 12件 | 重複（Netflix と U-NEXT）、未使用（DAZN）、年額化候補（Amazonプライム）、値上げ（Netflix 1,490円→1,590円）、App Store まとめ表示、解約後請求（Hulu） |
| B. 共働き世帯の家計担当 | 523件 | 13件 | 重複（夫婦で Netflix を2契約、動画サービス4件）、年額化候補（Amazonプライム、Disney+） |
| C. 節約意識の高いカード多持ち | 272件 | 5件 | 二重課金（Spotify、2026年5月） |

コードからは `@payment-app/shared` の `personaFixtures`・`personaExpected`・`planPrices` で読み込めます。
