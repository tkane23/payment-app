// モック明細の生成器（E00-S03）。乱数は固定シードなので、何度実行しても同じデータになる。
// 人物・口座・金額はすべて架空。サービス名は実在のものを使うが、金額は実際の価格と一致しない（ADR 0010）。
// JSON を作り直すには `pnpm --filter @payment-app/shared fixtures:generate`。
import type { Account, Transaction } from '../types.ts';
import type {
  BundleItem,
  CancellationReport,
  ExpectedCase,
  ExpectedRecurring,
  PersonaExpected,
  PersonaFixture,
  PersonaId,
  PlanPrice,
  ServiceCategory,
  UsageAnswer,
} from './types.ts';

const period = { from: '2025-10-01', to: '2026-09-30' };
const months = [
  '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
  '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09',
];
const lastMonth = '2026-09';

// 重複（同じカテゴリー）として扱うカテゴリー
const duplicateCategories: ServiceCategory[] = ['video', 'music'];

export const planPriceList: PlanPrice[] = [
  { serviceId: 'amazon-prime', serviceName: 'Amazonプライム', monthlyYen: 600, annualYen: 5900 },
  { serviceId: 'disney-plus', serviceName: 'Disney+', monthlyYen: 990, annualYen: 9900 },
];

interface ServiceSpec {
  key: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  merchantRaw: string;
  accountId: string;
  day: number;
  amountYen: number;
  startMonth?: string;
  /** 金額が毎月変わるもの（電気・ガス・通信）。前月比の最大変動率 */
  variation?: number;
  priceChange?: { month: string; amountYen: number };
  bundle?: BundleItem[];
  doubleChargeMonth?: string;
}

interface NoiseSpec {
  merchantRaw: string;
  accountId: string;
  perMonth: [number, number];
  amountYen: [number, number];
}

interface OneOffSpec {
  merchantRaw: string;
  accountId: string;
  date: string;
  amountYen: number;
}

interface PersonaSpec {
  persona: PersonaId;
  label: string;
  description: string;
  seed: number;
  accounts: Account[];
  services: ServiceSpec[];
  noise: NoiseSpec[];
  oneOffs: OneOffSpec[];
  usageAnswers: UsageAnswer[];
  cancellations: CancellationReport[];
}

interface DraftTransaction {
  accountId: string;
  date: string;
  merchantRaw: string;
  amountYen: number;
  serviceKey: string | null;
  isDuplicateCharge: boolean;
}

function answers(recurringKey: string, using: string[], notUsing: string[]): UsageAnswer[] {
  return [
    ...using.map((month): UsageAnswer => ({ month, recurringKey, answer: 'using' })),
    ...notUsing.map((month): UsageAnswer => ({ month, recurringKey, answer: 'not_using' })),
  ];
}

const specs: PersonaSpec[] = [
  {
    persona: 'A',
    label: 'サブスク過多の単身',
    description: '20代後半〜30代、会社員、一人暮らし。動画・音楽・クラウド・アプリ課金など10件前後のサブスク。無料トライアルの解約忘れが多い。',
    seed: 101,
    accounts: [
      { id: 'a-bank', name: 'モック銀行 普通預金', kind: 'bank' },
      { id: 'a-card', name: 'モックカード', kind: 'credit_card' },
    ],
    services: [
      { key: 'rent', serviceId: 'rent', serviceName: '家賃', category: 'housing', merchantRaw: '家賃 モック不動産', accountId: 'a-bank', day: 27, amountYen: 78000 },
      { key: 'electricity', serviceId: 'tepco', serviceName: '東京電力', category: 'electricity', merchantRaw: '東京電力EP', accountId: 'a-bank', day: 20, amountYen: 4800, variation: 0.08 },
      { key: 'mobile', serviceId: 'ahamo', serviceName: 'ahamo', category: 'mobile', merchantRaw: 'AHAMO', accountId: 'a-card', day: 26, amountYen: 2970 },
      { key: 'netflix', serviceId: 'netflix', serviceName: 'Netflix', category: 'video', merchantRaw: 'NETFLIX.COM', accountId: 'a-card', day: 5, amountYen: 1490, priceChange: { month: '2026-04', amountYen: 1590 } },
      { key: 'unext', serviceId: 'unext', serviceName: 'U-NEXT', category: 'video', merchantRaw: 'U-NEXT', accountId: 'a-card', day: 12, amountYen: 2189 },
      { key: 'hulu', serviceId: 'hulu', serviceName: 'Hulu', category: 'video', merchantRaw: 'HULU', accountId: 'a-card', day: 1, amountYen: 1026 },
      { key: 'dazn', serviceId: 'dazn', serviceName: 'DAZN', category: 'sports', merchantRaw: 'DAZN', accountId: 'a-card', day: 25, amountYen: 4200 },
      { key: 'spotify', serviceId: 'spotify', serviceName: 'Spotify', category: 'music', merchantRaw: 'SPOTIFY', accountId: 'a-card', day: 18, amountYen: 980 },
      { key: 'amazon-prime', serviceId: 'amazon-prime', serviceName: 'Amazonプライム', category: 'shopping', merchantRaw: 'AMAZON PRIME', accountId: 'a-card', day: 22, amountYen: 600 },
      { key: 'adobe', serviceId: 'adobe', serviceName: 'Adobe フォトプラン', category: 'software', merchantRaw: 'ADOBE', accountId: 'a-card', day: 15, amountYen: 1180 },
      // 無料トライアルの解約忘れ：2026年1月から課金が始まる
      { key: 'audible', serviceId: 'audible', serviceName: 'Audible', category: 'audiobook', merchantRaw: 'AUDIBLE', accountId: 'a-card', day: 10, amountYen: 1500, startMonth: '2026-01' },
      {
        key: 'apple-bundle', serviceId: 'apple', serviceName: 'App Store（まとめ表示）', category: 'app_store', merchantRaw: 'APPLE.COM/BILL', accountId: 'a-card', day: 8, amountYen: 1030,
        bundle: [
          { serviceName: 'iCloud+', amountYen: 130 },
          { serviceName: 'Duolingo', amountYen: 400 },
          { serviceName: 'Notion', amountYen: 500 },
        ],
      },
    ],
    noise: [
      { merchantRaw: 'セブン-イレブン', accountId: 'a-card', perMonth: [6, 10], amountYen: [280, 1400] },
      { merchantRaw: 'ローソン', accountId: 'a-card', perMonth: [3, 6], amountYen: [250, 1200] },
      { merchantRaw: 'まいばすけっと', accountId: 'a-card', perMonth: [4, 8], amountYen: [800, 3500] },
      { merchantRaw: 'スターバックス', accountId: 'a-card', perMonth: [2, 5], amountYen: [450, 1200] },
      { merchantRaw: 'AMAZON.CO.JP', accountId: 'a-card', perMonth: [1, 3], amountYen: [1200, 8000] },
      { merchantRaw: 'モバイルSUICA', accountId: 'a-card', perMonth: [2, 3], amountYen: [1000, 5000] },
      { merchantRaw: 'ユニクロ', accountId: 'a-card', perMonth: [0, 1], amountYen: [2000, 9000] },
    ],
    oneOffs: [],
    usageAnswers: [
      ...answers('netflix', ['2026-07', '2026-08', '2026-09'], []),
      ...answers('unext', ['2026-07', '2026-08', '2026-09'], []),
      ...answers('dazn', [], ['2026-07', '2026-08', '2026-09']),
    ],
    // Hulu は解約を報告したが、請求が続いている
    cancellations: [{ recurringKey: 'hulu', reportedOn: '2026-06-10' }],
  },
  {
    persona: 'B',
    label: '共働き世帯の家計担当',
    description: '30〜40代、夫婦共働き、子どもあり。通信・電気・保険など固定費が多い。夫婦それぞれが個別にサブスクを契約し、重複に気づいていない。',
    seed: 202,
    accounts: [
      { id: 'b-bank', name: 'モック信託銀行 普通預金', kind: 'bank' },
      { id: 'b-card', name: 'モックカード（本人）', kind: 'credit_card' },
      { id: 'b-card-family', name: 'モックカード（家族カード・配偶者）', kind: 'credit_card' },
    ],
    services: [
      { key: 'mortgage', serviceId: 'mortgage', serviceName: '住宅ローン', category: 'housing', merchantRaw: '住宅ローン モック信託銀行', accountId: 'b-bank', day: 27, amountYen: 102000 },
      { key: 'electricity', serviceId: 'tepco', serviceName: '東京電力', category: 'electricity', merchantRaw: '東京電力EP', accountId: 'b-bank', day: 22, amountYen: 11500, variation: 0.08 },
      { key: 'gas', serviceId: 'tokyo-gas', serviceName: '東京ガス', category: 'gas', merchantRaw: '東京ガス', accountId: 'b-bank', day: 18, amountYen: 6800, variation: 0.08 },
      { key: 'life-insurance', serviceId: 'life-insurance', serviceName: '生命保険', category: 'insurance', merchantRaw: 'モック生命保険', accountId: 'b-bank', day: 27, amountYen: 8400 },
      { key: 'childcare', serviceId: 'childcare', serviceName: '保育料', category: 'childcare', merchantRaw: '保育料 モック市', accountId: 'b-bank', day: 10, amountYen: 36000 },
      { key: 'mobile', serviceId: 'docomo', serviceName: 'ドコモ（家族）', category: 'mobile', merchantRaw: 'DOCOMO', accountId: 'b-card', day: 15, amountYen: 12800, variation: 0.05 },
      { key: 'netflix-self', serviceId: 'netflix', serviceName: 'Netflix', category: 'video', merchantRaw: 'NETFLIX.COM', accountId: 'b-card', day: 7, amountYen: 2290 },
      { key: 'amazon-prime', serviceId: 'amazon-prime', serviceName: 'Amazonプライム', category: 'shopping', merchantRaw: 'AMAZON PRIME', accountId: 'b-card', day: 3, amountYen: 600 },
      { key: 'nikkei', serviceId: 'nikkei', serviceName: '日経電子版', category: 'news', merchantRaw: 'NIKKEI', accountId: 'b-card', day: 1, amountYen: 4277 },
      // 配偶者の家族カードでも Netflix を契約している（同じサービスへの重複）
      { key: 'netflix-family', serviceId: 'netflix', serviceName: 'Netflix', category: 'video', merchantRaw: 'NETFLIX.COM', accountId: 'b-card-family', day: 14, amountYen: 890 },
      { key: 'youtube-premium', serviceId: 'youtube-premium', serviceName: 'YouTube Premium', category: 'video', merchantRaw: 'GOOGLE *YOUTUBEPREMIUM', accountId: 'b-card-family', day: 9, amountYen: 1280 },
      { key: 'spotify', serviceId: 'spotify', serviceName: 'Spotify', category: 'music', merchantRaw: 'SPOTIFY', accountId: 'b-card-family', day: 21, amountYen: 980 },
      { key: 'disney-plus', serviceId: 'disney-plus', serviceName: 'Disney+', category: 'video', merchantRaw: 'DISNEY PLUS', accountId: 'b-card-family', day: 25, amountYen: 990, startMonth: '2026-02' },
    ],
    noise: [
      { merchantRaw: 'イオン', accountId: 'b-card', perMonth: [6, 9], amountYen: [2500, 12000] },
      { merchantRaw: 'マツモトキヨシ', accountId: 'b-card', perMonth: [2, 4], amountYen: [800, 4500] },
      { merchantRaw: 'AMAZON.CO.JP', accountId: 'b-card', perMonth: [2, 5], amountYen: [1000, 15000] },
      { merchantRaw: 'ENEOS', accountId: 'b-card', perMonth: [2, 3], amountYen: [4000, 7000] },
      { merchantRaw: 'サイゼリヤ', accountId: 'b-card', perMonth: [1, 3], amountYen: [2500, 5000] },
      { merchantRaw: '西友', accountId: 'b-card-family', perMonth: [4, 7], amountYen: [2000, 9000] },
      { merchantRaw: 'セブン-イレブン', accountId: 'b-card-family', perMonth: [3, 6], amountYen: [300, 1500] },
      { merchantRaw: 'ユニクロ', accountId: 'b-card-family', perMonth: [0, 2], amountYen: [1500, 8000] },
    ],
    oneOffs: [],
    usageAnswers: [
      ...answers('netflix-self', ['2026-07', '2026-08', '2026-09'], []),
      ...answers('netflix-family', ['2026-07', '2026-08', '2026-09'], []),
    ],
    cancellations: [],
  },
  {
    persona: 'C',
    label: '節約意識の高いカード多持ち',
    description: '30〜50代、ポイント活動に関心。カードを複数保有し、キャリアやカードの特典を意識している。',
    seed: 303,
    accounts: [
      { id: 'c-bank', name: 'モックネット銀行 普通預金', kind: 'bank' },
      { id: 'c-card-1', name: 'モックカード1', kind: 'credit_card' },
      { id: 'c-card-2', name: 'モックカード2', kind: 'credit_card' },
      { id: 'c-card-3', name: 'モックカード3', kind: 'credit_card' },
    ],
    services: [
      { key: 'electricity', serviceId: 'tepco', serviceName: '東京電力', category: 'electricity', merchantRaw: '東京電力EP', accountId: 'c-bank', day: 25, amountYen: 6200, variation: 0.08 },
      { key: 'mobile', serviceId: 'docomo', serviceName: 'ドコモ', category: 'mobile', merchantRaw: 'DOCOMO', accountId: 'c-card-1', day: 12, amountYen: 7800, variation: 0.05 },
      // 2026年5月に同じ日・同じ金額で2回請求されている（二重課金）
      { key: 'spotify', serviceId: 'spotify', serviceName: 'Spotify', category: 'music', merchantRaw: 'SPOTIFY', accountId: 'c-card-1', day: 20, amountYen: 980, doubleChargeMonth: '2026-05' },
      { key: 'gym', serviceId: 'anytime-fitness', serviceName: 'エニタイムフィットネス', category: 'fitness', merchantRaw: 'ANYTIME FITNESS', accountId: 'c-card-2', day: 1, amountYen: 7678 },
      { key: 'youtube-premium', serviceId: 'youtube-premium', serviceName: 'YouTube Premium', category: 'video', merchantRaw: 'GOOGLE *YOUTUBEPREMIUM', accountId: 'c-card-3', day: 5, amountYen: 1280 },
    ],
    noise: [
      { merchantRaw: 'ライフ', accountId: 'c-card-1', perMonth: [5, 8], amountYen: [1500, 6000] },
      { merchantRaw: 'AMAZON.CO.JP', accountId: 'c-card-2', perMonth: [2, 4], amountYen: [1000, 12000] },
      { merchantRaw: 'ENEOS', accountId: 'c-card-2', perMonth: [2, 3], amountYen: [4000, 7000] },
      { merchantRaw: 'ドトール', accountId: 'c-card-3', perMonth: [3, 6], amountYen: [300, 900] },
      { merchantRaw: 'ヨドバシカメラ', accountId: 'c-card-3', perMonth: [0, 1], amountYen: [3000, 30000] },
    ],
    // 年額払いは12か月の中で1回しか現れないため、定期課金としては検出できない（正解に含めない）
    oneOffs: [
      { merchantRaw: 'AMAZON PRIME', accountId: 'c-card-2', date: '2026-03-12', amountYen: 5900 },
      { merchantRaw: 'NINTENDO', accountId: 'c-card-3', date: '2026-01-20', amountYen: 2400 },
    ],
    usageAnswers: [...answers('gym', ['2026-07', '2026-08', '2026-09'], [])],
    cancellations: [],
  },
];

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random: () => number, [min, max]: [number, number]): number {
  return min + Math.floor(random() * (max - min + 1));
}

function daysInMonth(month: string): number {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
}

function dateIn(month: string, day: number): string {
  return `${month}-${String(Math.min(day, daysInMonth(month))).padStart(2, '0')}`;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(keyOf(item), [...(groups.get(keyOf(item)) ?? []), item]);
  return groups;
}

function daysBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 86_400_000;
}

function satisfiesMonthlyRule(previous: DraftTransaction, next: DraftTransaction): boolean {
  const interval = daysBetween(previous.date, next.date);
  return interval >= 28 && interval <= 33 && Math.abs(next.amountYen - previous.amountYen) <= previous.amountYen * 0.1;
}

function draftServiceTransactions(service: ServiceSpec, random: () => number): DraftTransaction[] {
  const drafts: DraftTransaction[] = [];
  let amountYen = service.amountYen;
  for (const month of months) {
    if (service.startMonth && month < service.startMonth) continue;
    if (service.variation && drafts.length > 0) {
      amountYen = Math.round(amountYen * (1 + (random() * 2 - 1) * service.variation));
    }
    if (service.priceChange && month >= service.priceChange.month) amountYen = service.priceChange.amountYen;
    const draft: DraftTransaction = {
      accountId: service.accountId,
      date: dateIn(month, service.day),
      merchantRaw: service.merchantRaw,
      amountYen,
      serviceKey: service.key,
      isDuplicateCharge: false,
    };
    drafts.push(draft);
    if (service.doubleChargeMonth === month) drafts.push({ ...draft, isDuplicateCharge: true });
  }
  return drafts;
}

function draftNoiseTransactions(noise: NoiseSpec, random: () => number): DraftTransaction[] {
  return months.flatMap((month) =>
    Array.from({ length: randomInt(random, noise.perMonth) }, (): DraftTransaction => ({
      accountId: noise.accountId,
      date: dateIn(month, randomInt(random, [1, daysInMonth(month)])),
      merchantRaw: noise.merchantRaw,
      amountYen: randomInt(random, noise.amountYen),
      serviceKey: null,
      isDuplicateCharge: false,
    })),
  );
}

function compareDrafts(a: DraftTransaction, b: DraftTransaction): number {
  return (
    a.date.localeCompare(b.date) ||
    a.accountId.localeCompare(b.accountId) ||
    a.merchantRaw.localeCompare(b.merchantRaw) ||
    a.amountYen - b.amountYen ||
    Number(a.isDuplicateCharge) - Number(b.isDuplicateCharge)
  );
}

// 定期課金でない支払いが、偶然に判定ルールを満たさないよう金額をずらす
function breakAccidentalRecurrence(drafts: DraftTransaction[]): void {
  const series = new Map<string, DraftTransaction[]>();
  for (const draft of drafts) {
    if (draft.serviceKey !== null) continue;
    const key = `${draft.accountId}|${draft.merchantRaw}`;
    series.set(key, [...(series.get(key) ?? []), draft]);
  }
  for (const items of series.values()) {
    for (let index = 1; index < items.length; index += 1) {
      const previous = items[index - 1];
      const next = items[index];
      if (previous && next && satisfiesMonthlyRule(previous, next)) next.amountYen = Math.round(previous.amountYen * 1.3);
    }
  }
}

function buildPersona(spec: PersonaSpec): { fixture: PersonaFixture; expected: PersonaExpected } {
  const random = mulberry32(spec.seed);
  const drafts = [
    ...spec.services.flatMap((service) => draftServiceTransactions(service, random)),
    ...spec.noise.flatMap((noise) => draftNoiseTransactions(noise, random)),
    ...spec.oneOffs.map((oneOff): DraftTransaction => ({ ...oneOff, serviceKey: null, isDuplicateCharge: false })),
  ].sort(compareDrafts);
  breakAccidentalRecurrence(drafts);

  const prefix = spec.persona.toLowerCase();
  const withIds = drafts.map((draft, index) => ({ draft, id: `${prefix}-${String(index + 1).padStart(4, '0')}` }));
  const transactions: Transaction[] = withIds.map(({ draft, id }) => ({
    id,
    accountId: draft.accountId,
    date: draft.date,
    merchantRaw: draft.merchantRaw,
    amountYen: draft.amountYen,
    currency: 'JPY',
  }));

  const chargesOf = (key: string) => withIds.filter(({ draft }) => draft.serviceKey === key && !draft.isDuplicateCharge);
  const recurring: ExpectedRecurring[] = spec.services.map((service) => {
    const charges = chargesOf(service.key);
    return {
      key: service.key,
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      category: service.category,
      merchantRaw: service.merchantRaw,
      accountId: service.accountId,
      cadence: 'monthly',
      transactionIds: charges.map(({ id }) => id),
      latestAmountYen: charges.at(-1)?.draft.amountYen ?? 0,
      variableAmount: service.variation !== undefined,
      bundledBreakdown: service.bundle ?? null,
    };
  });

  return {
    fixture: {
      persona: spec.persona,
      label: spec.label,
      description: spec.description,
      period,
      accounts: spec.accounts,
      transactions,
      usageAnswers: spec.usageAnswers,
      cancellations: spec.cancellations,
    },
    expected: { persona: spec.persona, recurring, cases: buildCases(spec, withIds, recurring) },
  };
}

function buildCases(
  spec: PersonaSpec,
  withIds: { draft: DraftTransaction; id: string }[],
  recurring: ExpectedRecurring[],
): ExpectedCase[] {
  const cases: ExpectedCase[] = [];
  const chargesOf = (key: string) => withIds.filter(({ draft }) => draft.serviceKey === key && !draft.isDuplicateCharge);
  const cancelledKeys = new Set(spec.cancellations.map((report) => report.recurringKey));
  const active = recurring.filter(
    (item) => !cancelledKeys.has(item.key) && chargesOf(item.key).some(({ draft }) => draft.date.startsWith(lastMonth)),
  );
  const latestIds = (items: ExpectedRecurring[]) => items.flatMap((item) => item.transactionIds.slice(-1));

  // 重複：同じサービスに複数の契約
  const byService = groupBy(active, (item) => item.serviceId);
  for (const items of byService.values()) {
    const [first] = items;
    if (items.length < 2 || !first) continue;
    cases.push({ kind: 'duplicate', reason: 'same_service', category: first.category, recurringKeys: items.map((item) => item.key), transactionIds: latestIds(items) });
  }
  // 重複：同じカテゴリーに2つ以上のサービス
  for (const category of duplicateCategories) {
    const items = active.filter((item) => item.category === category);
    if (new Set(items.map((item) => item.serviceId)).size < 2) continue;
    cases.push({ kind: 'duplicate', reason: 'same_category', category, recurringKeys: items.map((item) => item.key), transactionIds: latestIds(items) });
  }

  // 未使用：「使っていない」と2か月以上続けて回答
  const answersByKey = groupBy(spec.usageAnswers, (answer) => answer.recurringKey);
  for (const [key, items] of answersByKey) {
    const notUsingMonths = items.filter((answer) => answer.answer === 'not_using').map((answer) => answer.month).sort();
    const consecutive = notUsingMonths.some((month, index) => index > 0 && months.indexOf(month) - months.indexOf(notUsingMonths[index - 1] ?? '') === 1);
    if (!consecutive) continue;
    const transactionIds = chargesOf(key).filter(({ draft }) => notUsingMonths.includes(draft.date.slice(0, 7))).map(({ id }) => id);
    cases.push({ kind: 'unused', recurringKeys: [key], transactionIds, notUsingMonths });
  }

  // 年額化の候補：月額で6か月以上続き、安い年額プランがある
  for (const item of active) {
    const price = planPriceList.find((plan) => plan.serviceId === item.serviceId);
    const monthsContinued = item.transactionIds.length;
    if (!price || monthsContinued < 6 || price.annualYen >= item.latestAmountYen * 12) continue;
    cases.push({
      kind: 'annualization_candidate',
      recurringKeys: [item.key],
      transactionIds: item.transactionIds.slice(-1),
      monthsContinued,
      monthlyYen: item.latestAmountYen,
      annualYen: price.annualYen,
      annualSavingYen: item.latestAmountYen * 12 - price.annualYen,
    });
  }

  for (const service of spec.services) {
    const charges = chargesOf(service.key);
    // 値上げ：前回より増額
    if (service.priceChange) {
      const afterIndex = charges.findIndex(({ draft }) => draft.date.startsWith(service.priceChange?.month ?? ''));
      const before = charges[afterIndex - 1];
      const after = charges[afterIndex];
      if (before && after) {
        cases.push({ kind: 'price_increase', recurringKeys: [service.key], transactionIds: [before.id, after.id], fromYen: before.draft.amountYen, toYen: after.draft.amountYen });
      }
    }
    // 二重課金：同じ日・同じ金額で2回の請求
    if (service.doubleChargeMonth) {
      const original = charges.find(({ draft }) => draft.date.startsWith(service.doubleChargeMonth ?? ''));
      const duplicate = withIds.find(({ draft }) => draft.serviceKey === service.key && draft.isDuplicateCharge);
      if (original && duplicate) {
        cases.push({ kind: 'double_charge', recurringKeys: [service.key], transactionIds: [original.id, duplicate.id], duplicateTransactionId: duplicate.id });
      }
    }
    // App Store などのまとめ表示
    if (service.bundle) {
      cases.push({ kind: 'app_store_bundle', recurringKeys: [service.key], transactionIds: charges.map(({ id }) => id), breakdown: service.bundle });
    }
  }

  // 解約後の請求：解約を報告した日より後の請求
  for (const report of spec.cancellations) {
    const transactionIds = chargesOf(report.recurringKey).filter(({ draft }) => draft.date > report.reportedOn).map(({ id }) => id);
    if (transactionIds.length > 0) {
      cases.push({ kind: 'charge_after_cancellation', recurringKeys: [report.recurringKey], transactionIds, reportedOn: report.reportedOn });
    }
  }

  return cases;
}

export interface BuiltFixtures {
  fixtures: Record<PersonaId, PersonaFixture>;
  expected: Record<PersonaId, PersonaExpected>;
  planPrices: PlanPrice[];
}

export function buildAllFixtures(): BuiltFixtures {
  const [a, b, c] = specs.map(buildPersona);
  if (!a || !b || !c) throw new Error('ペルソナの定義が足りません');
  return {
    fixtures: { A: a.fixture, B: b.fixture, C: c.fixture },
    expected: { A: a.expected, B: b.expected, C: c.expected },
    planPrices: planPriceList,
  };
}
