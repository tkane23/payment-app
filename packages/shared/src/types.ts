// 明細と口座の共通の型（docs/architecture.md「主要なインターフェース」）。E02-S01 の AggregatorAdapter もこの型を返す。

export type AccountKind = 'bank' | 'credit_card';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
}

export interface Transaction {
  id: string; // アグリゲーター側ID（重複取込の防止に使う）
  accountId: string;
  date: string; // YYYY-MM-DD
  merchantRaw: string; // 明細の表記そのまま
  amountYen: number; // 支出は正の数
  currency: 'JPY';
}
