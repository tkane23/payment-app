import { expect, it } from 'vitest';
import { dependsOn, packageName } from './index.ts';

it('パッケージ名を公開する', () => {
  expect(packageName).toBe('@payment-app/WRONG');
});

it('ワークスペース内の shared を参照できる', () => {
  expect(dependsOn).toEqual(['@payment-app/shared']);
});
