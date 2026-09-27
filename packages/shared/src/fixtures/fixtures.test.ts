import { describe, expect, it } from 'vitest';
import { buildAllFixtures } from './build.ts';
import { personaExpected, personaFixtures, planPrices } from './index.ts';
import { caseKinds, type PersonaId } from './types.ts';

const personas: PersonaId[] = ['A', 'B', 'C'];
const months = [
  '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
  '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09',
];

function daysBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 86_400_000;
}

// docs/product/recommendation-principles.md の判定ルール（月次）をテスト側で独立に実装したもの
function satisfiesMonthlyRule(previous: { date: string; amountYen: number }, next: { date: string; amountYen: number }): boolean {
  const interval = daysBetween(previous.date, next.date);
  return interval >= 28 && interval <= 33 && Math.abs(next.amountYen - previous.amountYen) <= previous.amountYen * 0.1;
}

// 受け入れ条件1：ペルソナA・B・C相当の3人分、各12か月分の明細データ（JSON）がある
describe.each(personas)('ペルソナ%s の明細', (persona) => {
  const fixture = personaFixtures[persona];
  const accountIds = new Set(fixture.accounts.map((account) => account.id));

  it('ペルソナと対象期間（12か月）が設定されている', () => {
    expect(fixture.persona).toBe(persona);
    expect(fixture.period).toEqual({ from: '2025-10-01', to: '2026-09-30' });
  });

  it('12か月のすべての月に明細がある', () => {
    const covered = new Set(fixture.transactions.map((transaction) => transaction.date.slice(0, 7)));
    expect([...covered].sort()).toEqual(months);
  });

  it('すべての明細が期間内で、共通の型の形をしている', () => {
    for (const transaction of fixture.transactions) {
      expect(transaction.date >= fixture.period.from && transaction.date <= fixture.period.to).toBe(true);
      expect(transaction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isInteger(transaction.amountYen) && transaction.amountYen > 0).toBe(true);
      expect(transaction.currency).toBe('JPY');
      expect(accountIds.has(transaction.accountId)).toBe(true);
    }
  });

  it('明細IDが重複していない', () => {
    const ids = fixture.transactions.map((transaction) => transaction.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('実在の個人情報に見える値（メールアドレス・電話番号・カード番号）を含まない', () => {
    const text = JSON.stringify(fixture);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(/0\d{1,4}-\d{1,4}-\d{4}/);
    expect(text).not.toMatch(/\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}/);
  });
});

// 受け入れ条件2：重複・未使用・年額化候補・値上げ・二重課金・解約後請求・App Storeまとめ表示のケースが最低1件ずつ含まれる
describe('ケースの網羅', () => {
  const allCases = personas.flatMap((persona) => personaExpected[persona].cases);

  it.each(caseKinds)('%s のケースが1件以上ある', (kind) => {
    expect(allCases.filter((expectedCase) => expectedCase.kind === kind).length).toBeGreaterThanOrEqual(1);
  });

  it('重複は「同じサービス」と「同じカテゴリー」の両方がある', () => {
    const reasons = new Set(allCases.flatMap((expectedCase) => (expectedCase.kind === 'duplicate' ? [expectedCase.reason] : [])));
    expect(reasons).toEqual(new Set(['same_service', 'same_category']));
  });
});

// 受け入れ条件3：各ケースに「期待される検出結果」が添付され、テストの正解データとして使える
describe.each(personas)('ペルソナ%s の期待される検出結果', (persona) => {
  const fixture = personaFixtures[persona];
  const expected = personaExpected[persona];
  const transactionsById = new Map(fixture.transactions.map((transaction) => [transaction.id, transaction]));
  const recurringByKey = new Map(expected.recurring.map((recurring) => [recurring.key, recurring]));

  it('定期課金の正解は、実在する明細だけを参照する', () => {
    for (const recurring of expected.recurring) {
      expect(recurring.transactionIds.length).toBeGreaterThanOrEqual(2);
      for (const id of recurring.transactionIds) {
        const transaction = transactionsById.get(id);
        expect(transaction?.merchantRaw).toBe(recurring.merchantRaw);
        expect(transaction?.accountId).toBe(recurring.accountId);
      }
    }
  });

  it('定期課金の正解は、どれも判定ルール（28〜33日間隔・金額差±10%）を満たす', () => {
    for (const recurring of expected.recurring) {
      const series = recurring.transactionIds.flatMap((id) => transactionsById.get(id) ?? []);
      for (let index = 1; index < series.length; index += 1) {
        const previous = series[index - 1];
        const next = series[index];
        if (!previous || !next) continue;
        expect(satisfiesMonthlyRule(previous, next), `${recurring.key}: ${previous.date} → ${next.date}`).toBe(true);
      }
      expect(series.at(-1)?.amountYen).toBe(recurring.latestAmountYen);
    }
  });

  it('定期課金でない明細は、判定ルールに当てはまらない（誤検出の元にならない）', () => {
    const recurringIds = new Set(expected.recurring.flatMap((recurring) => recurring.transactionIds));
    const bySeries = new Map<string, typeof fixture.transactions>();
    for (const transaction of fixture.transactions) {
      if (recurringIds.has(transaction.id)) continue;
      const seriesKey = `${transaction.accountId}|${transaction.merchantRaw}`;
      bySeries.set(seriesKey, [...(bySeries.get(seriesKey) ?? []), transaction]);
    }
    for (const [seriesKey, series] of bySeries) {
      for (let index = 1; index < series.length; index += 1) {
        const previous = series[index - 1];
        const next = series[index];
        if (!previous || !next) continue;
        expect(satisfiesMonthlyRule(previous, next), `${seriesKey}: ${previous.date} → ${next.date}`).toBe(false);
      }
    }
  });

  it('各ケースが、実在する定期課金と明細を参照する', () => {
    for (const expectedCase of expected.cases) {
      expect(expectedCase.recurringKeys.length).toBeGreaterThan(0);
      expect(expectedCase.transactionIds.length).toBeGreaterThan(0);
      for (const key of expectedCase.recurringKeys) expect(recurringByKey.has(key), key).toBe(true);
      for (const id of expectedCase.transactionIds) expect(transactionsById.has(id), id).toBe(true);
    }
  });

  it('各ケースの中身が、明細と補助データに合っている', () => {
    for (const expectedCase of expected.cases) {
      const recurring = expectedCase.recurringKeys.flatMap((key) => recurringByKey.get(key) ?? []);
      const transactions = expectedCase.transactionIds.flatMap((id) => transactionsById.get(id) ?? []);
      switch (expectedCase.kind) {
        case 'duplicate':
          expect(recurring.length).toBeGreaterThanOrEqual(2);
          if (expectedCase.reason === 'same_service') {
            expect(new Set(recurring.map((item) => item.serviceId)).size).toBe(1);
          } else {
            expect(new Set(recurring.map((item) => item.serviceId)).size).toBeGreaterThanOrEqual(2);
            expect(recurring.every((item) => item.category === expectedCase.category)).toBe(true);
          }
          break;
        case 'unused': {
          const [key] = expectedCase.recurringKeys;
          const notUsing = fixture.usageAnswers
            .filter((answer) => answer.recurringKey === key && answer.answer === 'not_using')
            .map((answer) => answer.month);
          expect(notUsing).toEqual(expectedCase.notUsingMonths);
          expect(expectedCase.notUsingMonths.length).toBeGreaterThanOrEqual(2);
          break;
        }
        case 'annualization_candidate': {
          const price = planPrices.find((plan) => plan.serviceId === recurring[0]?.serviceId);
          expect(expectedCase.monthsContinued).toBeGreaterThanOrEqual(6);
          expect(price?.annualYen).toBe(expectedCase.annualYen);
          expect(expectedCase.annualSavingYen).toBe(expectedCase.monthlyYen * 12 - expectedCase.annualYen);
          expect(expectedCase.annualSavingYen).toBeGreaterThan(0);
          break;
        }
        case 'price_increase':
          expect(transactions.map((transaction) => transaction.amountYen)).toEqual([expectedCase.fromYen, expectedCase.toYen]);
          expect(expectedCase.toYen).toBeGreaterThan(expectedCase.fromYen);
          break;
        case 'double_charge': {
          const [original, duplicate] = transactions;
          expect(duplicate?.id).toBe(expectedCase.duplicateTransactionId);
          expect(duplicate?.date).toBe(original?.date);
          expect(duplicate?.amountYen).toBe(original?.amountYen);
          expect(recurring[0]?.transactionIds).not.toContain(expectedCase.duplicateTransactionId);
          break;
        }
        case 'charge_after_cancellation': {
          const report = fixture.cancellations.find((item) => item.recurringKey === expectedCase.recurringKeys[0]);
          expect(report?.reportedOn).toBe(expectedCase.reportedOn);
          expect(transactions.every((transaction) => transaction.date > expectedCase.reportedOn)).toBe(true);
          break;
        }
        case 'app_store_bundle': {
          const total = expectedCase.breakdown.reduce((sum, item) => sum + item.amountYen, 0);
          expect(transactions.every((transaction) => transaction.amountYen === total)).toBe(true);
          expect(recurring[0]?.bundledBreakdown).toEqual(expectedCase.breakdown);
          break;
        }
      }
    }
  });
});

describe('フィクスチャの再現性', () => {
  it('コミットされたJSONは、生成スクリプトの出力と一致する（手で書き換えていない）', () => {
    const built = buildAllFixtures();
    for (const persona of personas) {
      expect(personaFixtures[persona]).toEqual(built.fixtures[persona]);
      expect(personaExpected[persona]).toEqual(built.expected[persona]);
    }
    expect(planPrices).toEqual(built.planPrices);
  });
});
