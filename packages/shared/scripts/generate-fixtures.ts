// モック明細のJSONを生成して packages/shared/fixtures/ に書き出す。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAllFixtures } from '../src/fixtures/build.ts';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const built = buildAllFixtures();

function write(name: string, value: unknown): void {
  writeFileSync(resolve(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

mkdirSync(outDir, { recursive: true });
for (const persona of ['A', 'B', 'C'] as const) {
  const slug = persona.toLowerCase();
  write(`persona-${slug}.json`, built.fixtures[persona]);
  write(`persona-${slug}.expected.json`, built.expected[persona]);
}
write('plan-prices.json', built.planPrices);
