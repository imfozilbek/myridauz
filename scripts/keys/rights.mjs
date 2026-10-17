// The rights of the keys of an environment (docs/189): the same sets in every environment and brand.
// A right is a Cloudflare permission group; Cloudflare renamed some of them, the first known name wins.
const ZONE_SCOPE = 'com.cloudflare.api.account.zone';

// The key of the deploy job in GitHub.
export const DEPLOY = [
  ['Workers Scripts Write'],
  ['D1 Write'],
  ['Workers R2 Storage Write'],
  ['Queues Write'],
  ['Pages Write', 'Cloudflare Pages Write'],
  ['Account Settings Read'],
  ['Workers Routes Write'],
  ['DNS Write'],
  ['Zone Read'],
];
// The key of the dashboard in the Worker: it only reads Analytics Engine (docs/29).
export const ANALYTICS = [['Account Analytics Read']];
// The hour key of the setup itself: the deploy rights and what the setup changes once.
export const SETUP = [...DEPLOY, ['Zone Settings Write']];
// Without these the setup still runs; it names the step the owner then does by hand.
export const OPTIONAL = {
  calls: ['Calls Write', 'Realtime Write', 'Realtime Admin'],
  botFight: ['Bot Management Write'],
  webAnalytics: ['Account Web Analytics Write', 'Web Analytics Write'],
};

const byName = (groups) => new Map(groups.map((group) => [group.name.toLowerCase(), group]));
const findIn = (known, names) => names.map((name) => known.get(name.toLowerCase())).find(Boolean);

// The groups of a set; a missing right stops the setup with the names Cloudflare knows instead.
export function groupsOf(set, groups) {
  const known = byName(groups);
  return set.map((names) => {
    const group = findIn(known, names);
    if (group) return group;
    const word = names[0].split(' ')[0].toLowerCase();
    const near = groups.filter((one) => one.name.toLowerCase().includes(word)).map((one) => one.name);
    throw new Error(`keys: Cloudflare has no right ${names.join(' or ')}; near: ${near.join(', ')}`);
  });
}

// The optional rights Cloudflare knows, by step.
export function optionalOf(groups) {
  const known = byName(groups);
  return Object.fromEntries(Object.entries(OPTIONAL).map(([step, names]) => [step, findIn(known, names)]));
}

// The resources of a key: its account, and one zone or (the hour key, before it knows the zone) every
// zone of that account.
const accountResource = (accountId) => ({ [`com.cloudflare.api.account.${accountId}`]: '*' });
const zoneResource = (accountId, zoneId) =>
  zoneId
    ? { [`${ZONE_SCOPE}.${zoneId}`]: '*' }
    : { [`com.cloudflare.api.account.${accountId}`]: { [`${ZONE_SCOPE}.*`]: '*' } };

export function policiesOf(groups, { accountId, zoneId }) {
  const isZone = (group) => group.scopes?.includes(ZONE_SCOPE);
  const ids = (list) => [...new Set(list.map((group) => group.id))].map((id) => ({ id }));
  return [
    { resources: accountResource(accountId), groups: groups.filter((group) => !isZone(group)) },
    { resources: zoneResource(accountId, zoneId), groups: groups.filter(isZone) },
  ]
    .filter((policy) => policy.groups.length > 0)
    .map(({ resources, groups: list }) => ({ effect: 'allow', resources, permission_groups: ids(list) }));
}

// The same rights on the same resources, in any order: a key that has them stays as it is.
const flat = (resources) =>
  Object.entries(resources).flatMap(([key, value]) =>
    typeof value === 'object' ? flat(value).map((inner) => `${key}>${inner}`) : [key],
  );
const signature = (policies) =>
  policies
    .flatMap((policy) =>
      flat(policy.resources).flatMap((resource) =>
        policy.permission_groups.map((group) => `${resource}:${group.id}`),
      ),
    )
    .sort()
    .join('|');

export const sameRights = (a, b) => signature(a) === signature(b);
