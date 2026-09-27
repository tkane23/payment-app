// 受け入れ条件2：プルリクエストごとに型チェック・Lint・単体テストがCIで自動実行される
// マージをブロックする設定（ブランチ保護）は GitHub 側の設定のため、PR 上で手動確認する（README 参照）。
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readRepoFile, readRepoJson, type PackageJson } from './helpers';

interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}

interface Workflow {
  on?: Record<string, unknown>;
  jobs?: Record<string, { steps?: Step[] }>;
}

const workflow = parse(readRepoFile('.github/workflows/ci.yml')) as Workflow;
const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
const runCommands = steps.flatMap((step) => (step.run ? [step.run.trim()] : []));

describe('CIワークフロー', () => {
  it('プルリクエストごとに起動する', () => {
    expect(workflow.on).toHaveProperty('pull_request');
  });

  it('main への push でも起動する', () => {
    expect(workflow.on?.push).toEqual({ branches: ['main'] });
  });

  it('lockfile どおりに依存を入れる', () => {
    expect(runCommands).toContain('pnpm install --frozen-lockfile');
  });

  it.each(['typecheck', 'lint', 'test'])('pnpm %s を実行する', (script) => {
    expect(runCommands).toContain(`pnpm ${script}`);
  });

  it.each(['typecheck', 'lint', 'test'])('ルートの %s は Turborepo で全ワークスペースに対して実行される', (script) => {
    const rootPackage = readRepoJson<PackageJson>('package.json');
    expect(rootPackage.scripts?.[script]).toMatch(new RegExp(`^turbo run ${script}\\b`));
  });

  it('Node のバージョンを .nvmrc で固定している', () => {
    const setupNode = steps.find((step) => step.uses?.startsWith('actions/setup-node@'));
    expect(setupNode?.with?.['node-version-file']).toBe('.nvmrc');
    expect(readRepoFile('.nvmrc').trim()).toMatch(/^\d+$/);
  });
});
