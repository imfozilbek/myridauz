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
const ACCOUNT = 'com.cloudflare.api.account';
// The permission groups by the names and scopes of the Cloudflare permissions page (17.10.2026), not by
// the lists of the code: a wrong name in the code fails here.
const REAL = {
  'Workers Scripts Write': ACCOUNT,
  'D1 Write': ACCOUNT,
  'Workers R2 Storage Write': ACCOUNT,
  'Queues Write': ACCOUNT,
  'Pages Write': ACCOUNT,
  'Account Settings Read': ACCOUNT,
  'Account Settings Write': ACCOUNT,
  'Account Analytics Read': ACCOUNT,
  'Realtime Write': ACCOUNT,
  'Workers Routes Write': ZONE,
  'DNS Write': ZONE,
  'Zone Read': ZONE,
  'Zone Settings Write': ZONE,
  'Bot Management Write': ZONE,
  'API Tokens Write': 'com.cloudflare.api.user',
};
const GROUPS = Object.entries(REAL).map(([name, scope], index) => ({
  id: `g${index}`,
  name,
  scopes: [scope],
}));
const ids = (policy) => policy.permission_groups.map((group) => group.id);

// docs/189: the same rights in every environment, a key never gets more than its set.
describe('the rights of the keys', () => {
  it('keeps the deploy set of docs/189 inside the hour key of the setup', () => {
    expect(DEPLOY).toHaveLength(9);
    expect(SETUP).toEqual(expect.arrayContaining(DEPLOY));
  });

  it('finds every right of every set by the names Cloudflare gives, in any case', () => {
    expect(groupsOf([...SETUP, ...ANALYTICS], GROUPS)).toHaveLength(SETUP.length + 1);
    const lower = GROUPS.map((group) => ({ ...group, name: group.name.toLowerCase() }));
    expect(groupsOf(DEPLOY, lower).map((group) => group.id)).toEqual(
      groupsOf(DEPLOY, GROUPS).map((group) => group.id),
    );
  });

  it('knows every optional right, Web Analytics by the account settings', () => {
    const optional = optionalOf(GROUPS);
    expect(optional.calls.name).toBe('Realtime Write');
    expect(optional.botFight.name).toBe('Bot Management Write');
    expect(optional.webAnalytics.name).toBe('Account Settings Write');
  });

  it('stops on an unknown right and names the near ones', () => {
    const withoutD1 = GROUPS.filter((group) => group.name !== 'D1 Write');
    expect(() => groupsOf(DEPLOY, [...withoutD1, { id: 'x', name: 'D1 Edit' }])).toThrow(
      'keys: Cloudflare has no right D1 Write; near: D1 Edit',
    );
  });

  it('takes the older name of calls and gives no optional right Cloudflare does not know', () => {
    const known = GROUPS.filter((group) => !Object.values(OPTIONAL).flat().includes(group.name));
    const calls = { id: 'c', name: 'Calls Write', scopes: [ACCOUNT] };
    expect(optionalOf([...known, calls])).toEqual({ calls, botFight: undefined, webAnalytics: undefined });
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
