import { expect, it } from 'vitest';
import { packageName } from './index.ts';

it('パッケージ名を公開する', () => {
  expect(packageName).toBe('@payment-app/shared');
});
