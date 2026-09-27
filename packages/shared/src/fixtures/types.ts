// モック明細（E00-S03）と、その「期待される検出結果」の型。
import type { Account, Transaction } from '../types.ts';

export type PersonaId = 'A' | 'B' | 'C';

export type ServiceCategory =
  | 'video'
  | 'music'
  | 'sports'
  | 'audiobook'
  | 'software'
  | 'app_store'
  | 'shopping'
  | 'mobile'
  | 'electricity'
  | 'gas'
  | 'housing'
  | 'insurance'
  | 'childcare'
  | 'news'
  | 'fitness';

/** 月一の「使ってる？」チェックへの回答（E09-S01） */
export interface UsageAnswer {
  month: string; // YYYY-MM
  recurringKey: string;
  answer: 'using' | 'not_using';
}

/** 利用者が「解約した」と報告した記録（E08-S02） */
export interface CancellationReport {
  recurringKey: string;
  reportedOn: string; // YYYY-MM-DD
}

export interface PersonaFixture {
  persona: PersonaId;
  label: string;
  description: string;
  period: { from: string; to: string };
  accounts: Account[];
  transactions: Transaction[];
  usageAnswers: UsageAnswer[];
  cancellations: CancellationReport[];
}

/** 年額プランの価格（価格データベース E11-S02 の代わり。金額は架空の値） */
export interface PlanPrice {
  serviceId: string;
  serviceName: string;
  monthlyYen: number;
  annualYen: number;
}

export interface BundleItem {
  serviceName: string;
  amountYen: number;
}

/** 定期課金として検出されるべき支払い（E03-S01 の正解データ） */
export interface ExpectedRecurring {
  key: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  merchantRaw: string;
  accountId: string;
  cadence: 'monthly';
  transactionIds: string[];
  latestAmountYen: number;
  /** 電気・ガス・通信など、毎月の金額が変わるもの */
  variableAmount: boolean;
  /** App Store などのまとめ表示。明細からは内訳が分からない（参考の正解） */
  bundledBreakdown: BundleItem[] | null;
}

export type CaseKind =
  | 'duplicate'
  | 'unused'
  | 'annualization_candidate'
  | 'price_increase'
  | 'double_charge'
  | 'charge_after_cancellation'
  | 'app_store_bundle';

interface CaseBase {
  recurringKeys: string[];
  transactionIds: string[];
}

export type ExpectedCase =
  | (CaseBase & { kind: 'duplicate'; reason: 'same_service' | 'same_category'; category: ServiceCategory })
  | (CaseBase & { kind: 'unused'; notUsingMonths: string[] })
  | (CaseBase & {
      kind: 'annualization_candidate';
      monthsContinued: number;
      monthlyYen: number;
      annualYen: number;
      annualSavingYen: number;
    })
  | (CaseBase & { kind: 'price_increase'; fromYen: number; toYen: number })
  | (CaseBase & { kind: 'double_charge'; duplicateTransactionId: string })
  | (CaseBase & { kind: 'charge_after_cancellation'; reportedOn: string })
  | (CaseBase & { kind: 'app_store_bundle'; breakdown: BundleItem[] });

export interface PersonaExpected {
  persona: PersonaId;
  recurring: ExpectedRecurring[];
  cases: ExpectedCase[];
}

export const caseKinds: readonly CaseKind[] = [
  'duplicate',
  'unused',
  'annualization_candidate',
  'price_increase',
  'double_charge',
  'charge_after_cancellation',
  'app_store_bundle',
];
