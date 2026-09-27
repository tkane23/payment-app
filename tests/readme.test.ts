// 受け入れ条件3：README に、ローカルで全体を起動する手順が3ステップ以内で書かれている
import { describe, expect, it } from 'vitest';
import { readRepoFile, readRepoJson, type PackageJson } from './helpers';

const readme = readRepoFile('README.md');

function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return '';
  const rest = markdown.slice(start + heading.length + 3);
  const next = rest.search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next);
}

const startup = section(readme, 'ローカルで起動する');
const steps = startup.split('\n').filter((line) => /^\d+\. /.test(line));

describe('README の起動手順', () => {
  it('「ローカルで起動する」の見出しがある', () => {
    expect(startup).not.toBe('');
  });

  it('手順は1〜3ステップである', () => {
    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(steps.length).toBeLessThanOrEqual(3);
  });

  it('手順に出てくる pnpm スクリプトがルートに存在する', () => {
    const scripts = readRepoJson<PackageJson>('package.json').scripts ?? {};
    const builtins = new Set(['install', 'add', 'exec', 'dlx']);
    const used = [...startup.matchAll(/`pnpm ([\w:-]+)/g)].map((match) => match[1] ?? '');
    expect(used.length).toBeGreaterThan(0);
    for (const name of used.filter((name) => !builtins.has(name))) {
      expect(scripts, `pnpm ${name} がない`).toHaveProperty(name);
    }
  });
});
