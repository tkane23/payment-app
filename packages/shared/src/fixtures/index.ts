// モック明細（packages/shared/fixtures/*.json）の読み込み口。JSON は build.ts から生成する。
import expectedA from '../../fixtures/persona-a.expected.json' with { type: 'json' };
import fixtureA from '../../fixtures/persona-a.json' with { type: 'json' };
import expectedB from '../../fixtures/persona-b.expected.json' with { type: 'json' };
import fixtureB from '../../fixtures/persona-b.json' with { type: 'json' };
import expectedC from '../../fixtures/persona-c.expected.json' with { type: 'json' };
import fixtureC from '../../fixtures/persona-c.json' with { type: 'json' };
import prices from '../../fixtures/plan-prices.json' with { type: 'json' };
import type { PersonaExpected, PersonaFixture, PersonaId, PlanPrice } from './types.ts';

export const personaFixtures: Record<PersonaId, PersonaFixture> = {
  A: fixtureA as PersonaFixture,
  B: fixtureB as PersonaFixture,
  C: fixtureC as PersonaFixture,
};

export const personaExpected: Record<PersonaId, PersonaExpected> = {
  A: expectedA as PersonaExpected,
  B: expectedB as PersonaExpected,
  C: expectedC as PersonaExpected,
};

export const planPrices: PlanPrice[] = prices;

export * from './types.ts';
