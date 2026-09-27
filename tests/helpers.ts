import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

export function readRepoJson<T>(relativePath: string): T {
  return JSON.parse(readRepoFile(relativePath)) as T;
}

export interface PackageJson {
  name?: string;
  private?: boolean;
  packageManager?: string;
  scripts?: Record<string, string>;
}

export interface TsConfig {
  extends?: string;
  compilerOptions?: Record<string, unknown>;
}
