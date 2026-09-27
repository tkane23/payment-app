// E00-S02 アーキテクチャの確定と記録
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readRepoFile, repoRoot } from './helpers';

const architecture = readRepoFile('docs/architecture.md');

function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return '';
  const rest = markdown.slice(start + heading.length + 3);
  const next = rest.search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next);
}

interface DecisionRow {
  area: string;
  status: string;
  adrLinks: string[];
}

// 「技術の判断」の節の最初の表だけを読む（見出し行と区切り行を除く）
function firstTable(markdown: string): string[] {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.startsWith('|'));
  if (start === -1) return [];
  const end = lines.findIndex((line, index) => index > start && !line.startsWith('|'));
  return lines.slice(start, end === -1 ? undefined : end);
}

const decisions: DecisionRow[] = firstTable(section(architecture, '技術の判断'))
  .filter((line) => !/^\|\s*(領域|---)/.test(line))
  .map((line) => {
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    const adrLinks = [...line.matchAll(/\]\((adr\/[^)]+\.md)\)/g)].map((match) => match[1] ?? '');
    return { area: cells[0] ?? '', status: cells[1] ?? '', adrLinks };
  });

const adrFiles = readdirSync(resolve(repoRoot, 'docs/adr')).filter((name) => /^\d{4}-.+\.md$/.test(name));

// 受け入れ条件1：docs/architecture.md の「提案」の各項目が「確定」または「変更」になっている
describe('architecture.md の確定状況', () => {
  it('文書のステータスが「提案」ではない', () => {
    expect(architecture).not.toMatch(/ステータス：\*\*提案\*\*/);
  });

  it('当初の提案の全領域が表にある', () => {
    const areas = decisions.map((row) => row.area);
    for (const area of ['モバイル', 'API', 'DB', '認証', 'ジョブ', '通知', 'メール受信', 'OCR・抽出', '課金', '鍵管理', '分析', 'ホスティング']) {
      expect(areas, `${area} がない`).toContain(area);
    }
  });

  it('各項目の状態が「確定」または「変更」である', () => {
    for (const row of decisions) {
      expect(['確定', '変更'], `${row.area} の状態が「${row.status}」`).toContain(row.status);
    }
  });
});

// 受け入れ条件2：主要な判断ごとに docs/adr/ にADR（判断記録）が1件ずつある
describe('ADR', () => {
  it('表の各項目が、存在するADRを参照している', () => {
    for (const row of decisions) {
      expect(row.adrLinks.length, `${row.area} にADRのリンクがない`).toBeGreaterThan(0);
      for (const link of row.adrLinks) {
        expect(existsSync(resolve(repoRoot, 'docs', link)), `${link} が存在しない`).toBe(true);
      }
    }
  });

  it.each(adrFiles)('%s は「背景・選択肢・決定・影響」の4見出しを持つ', (file) => {
    const adr = readRepoFile(`docs/adr/${file}`);
    for (const heading of ['背景', '選択肢', '決定', '影響']) {
      expect(adr, `${file} に「## ${heading}」がない`).toMatch(new RegExp(`^## ${heading}$`, 'm'));
    }
  });

  it('ADRの番号が重複していない', () => {
    const numbers = adrFiles.map((file) => file.slice(0, 4));
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});

// 受け入れ条件3：個人データの保存場所・暗号化方式・リージョン（東京）が明記されている
describe('個人データの保存', () => {
  const personalData = section(architecture, '個人データの保存場所と暗号化');

  it('専用の節がある', () => {
    expect(personalData).not.toBe('');
  });

  it('リージョンが東京（ap-northeast-1）と明記されている', () => {
    expect(personalData).toContain('東京');
    expect(personalData).toContain('ap-northeast-1');
  });

  it.each(['保存場所', '通信の暗号化', '保存時の暗号化', 'トークンの暗号化'])('「%s」が書かれている', (item) => {
    expect(personalData).toContain(item);
  });
});
