import { describe, expect, it } from 'vitest';
import {
  ANALYTICS,
  DEPLOY,
  OPTIONAL,
  SETUP,
  groupsOf,
  optionalOf,
  policiesOf,
  sameRights,
} from './keys/rights.mjs';

const ZONE = 'com.cloudflare.api.account.zone';
const ZONE_RIGHTS = ['Workers Routes Write', 'DNS Write', 'Zone Read', 'Zone Settings Write'];
// The permission groups as Cloudflare gives them: the first name of every right of the sets.
const GROUPS = [...SETUP, ...ANALYTICS].map(([name], index) => ({
  id: `g${index}`,
  name,
  scopes: [ZONE_RIGHTS.includes(name) ? ZONE : 'com.cloudflare.api.account'],
}));
const ids = (policy) => policy.permission_groups.map((group) => group.id);

// docs/189: the same rights in every environment, a key never gets more than its set.
describe('the rights of the keys', () => {
  it('keeps the deploy set of docs/189 inside the hour key of the setup', () => {
    expect(DEPLOY).toHaveLength(9);
    expect(SETUP).toEqual(expect.arrayContaining(DEPLOY));
  });

  it('finds a right by a later name and in any case', () => {
    const renamed = GROUPS.map((group) =>
      group.name === 'Pages Write' ? { ...group, name: 'cloudflare pages write' } : group,
    );
    expect(groupsOf(DEPLOY, renamed).map((group) => group.id)).toEqual(
      groupsOf(DEPLOY, GROUPS).map((group) => group.id),
    );
  });

  it('stops on an unknown right and names the near ones', () => {
    const withoutD1 = GROUPS.filter((group) => group.name !== 'D1 Write');
    expect(() => groupsOf(DEPLOY, [...withoutD1, { id: 'x', name: 'D1 Edit' }])).toThrow(
      'keys: Cloudflare has no right D1 Write; near: D1 Edit',
    );
  });

  it('gives no optional right Cloudflare does not know', () => {
    const calls = { id: 'c', name: OPTIONAL.calls[1], scopes: ['com.cloudflare.api.account'] };
    expect(optionalOf([...GROUPS, calls])).toEqual({ calls, botFight: undefined, webAnalytics: undefined });
  });

  it('puts account rights on the account and zone rights on one zone', () => {
    const [account, zone] = policiesOf(groupsOf(DEPLOY, GROUPS), { accountId: 'a1', zoneId: 'z1' });
    expect(account.resources).toEqual({ 'com.cloudflare.api.account.a1': '*' });
    expect(zone.resources).toEqual({ [`${ZONE}.z1`]: '*' });
    expect(ids(account)).toHaveLength(6);
    expect(ids(zone)).toHaveLength(3);
    expect(account.effect).toBe('allow');
  });

  it('gives the hour key every zone of its account only', () => {
    const [, zone] = policiesOf(groupsOf(SETUP, GROUPS), { accountId: 'a1' });
    expect(zone.resources).toEqual({ 'com.cloudflare.api.account.a1': { [`${ZONE}.*`]: '*' } });
  });

  it('makes no zone policy for the dashboard key and no right twice', () => {
    const twice = [...groupsOf(ANALYTICS, GROUPS), ...groupsOf(ANALYTICS, GROUPS)];
    const policies = policiesOf(twice, { accountId: 'a1', zoneId: 'z1' });
    expect(policies).toHaveLength(1);
    expect(ids(policies[0])).toHaveLength(1);
  });

  it('sees the same rights in any order and a changed zone as other rights', () => {
    const policies = policiesOf(groupsOf(DEPLOY, GROUPS), { accountId: 'a1', zoneId: 'z1' });
    const shuffled = [...policies]
      .reverse()
      .map((policy) => ({ ...policy, permission_groups: [...policy.permission_groups].reverse() }));
    expect(sameRights(policies, shuffled)).toBe(true);
    const otherZone = policiesOf(groupsOf(DEPLOY, GROUPS), { accountId: 'a1', zoneId: 'z2' });
    expect(sameRights(policies, otherZone)).toBe(false);
  });
});
