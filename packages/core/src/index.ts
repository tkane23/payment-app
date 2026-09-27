// 検出・診断・レコメンドの純粋ロジックを置くパッケージ。
// UI・DB・外部APIに依存しない純粋関数だけを置き、単体テストで網羅する（CLAUDE.md）。
import { packageName as sharedPackageName } from '@payment-app/shared';

export const packageName = '@payment-app/core';

export const dependsOn = [sharedPackageName] as const;
