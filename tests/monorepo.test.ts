// 受け入れ条件1：pnpm + Turborepo のモノレポに apps/mobile・apps/api・packages/core・packages/shared がある
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readRepoFile, readRepoJson, repoRoot, type PackageJson, type TsConfig } from './helpers';

const workspaces = ['apps/mobile', 'apps/api', 'packages/core', 'packages/shared'] as const;
const requiredScripts = ['typecheck', 'lint', 'test'] as const;

describe('モノレポの構成', () => {
  it('pnpm をパッケージマネージャーとして固定している', () => {
    const rootPackage = readRepoJson<PackageJson>('package.json');
    expect(rootPackage.private).toBe(true);
    expect(rootPackage.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+/);
    expect(existsSync(resolve(repoRoot, 'pnpm-lock.yaml'))).toBe(true);
  });

  it('pnpm ワークスペースが apps/* と packages/* を含む', () => {
    const workspace = parse(readRepoFile('pnpm-workspace.yaml')) as { packages?: string[] };
    expect(workspace.packages).toEqual(expect.arrayContaining(['apps/*', 'packages/*']));
  });

  it('Turborepo に typecheck・lint・test のタスクが定義されている', () => {
    const turbo = readRepoJson<{ tasks?: Record<string, unknown> }>('turbo.json');
    for (const task of requiredScripts) {
      expect(turbo.tasks).toHaveProperty(task);
    }
  });

  it('TypeScript の共通設定が strict である', () => {
    const base = readRepoJson<TsConfig>('tsconfig.base.json');
    expect(base.compilerOptions?.strict).toBe(true);
  });

  describe.each(workspaces)('%s', (workspace) => {
    it('@payment-app スコープのパッケージとして存在する', () => {
      const pkg = readRepoJson<PackageJson>(`${workspace}/package.json`);
      expect(pkg.name).toBe(`@payment-app/${workspace.split('/')[1]}`);
      expect(pkg.private).toBe(true);
    });

    it('CIで使う typecheck・lint・test のスクリプトを持つ', () => {
      const pkg = readRepoJson<PackageJson>(`${workspace}/package.json`);
      for (const script of requiredScripts) {
        expect(pkg.scripts?.[script], `${workspace} に ${script} がない`).toBeTruthy();
      }
    });

    it('strict な共通設定を継承し、上書きで緩めていない', () => {
      const tsconfig = readRepoJson<TsConfig>(`${workspace}/tsconfig.json`);
      expect(tsconfig.extends).toBe('../../tsconfig.base.json');
      expect(tsconfig.compilerOptions?.strict).not.toBe(false);
    });
  });
});
