// 型定義とモック明細（fixtures）を置くパッケージ。
export const packageName = '@payment-app/shared';

export type { Account, AccountKind, Transaction } from './types.ts';
export * from './fixtures/index.ts';
