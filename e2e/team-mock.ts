import type { Page } from '@playwright/test';

// The work of the team as on the mockup g67/1 (G75, docs/120): nine cases, the oldest a late
// complaint; two errors and three drivers with little money in «Diqqat»; the numbers of Aziz.
const MINUTE = 60_000;
export const id = (n: number) => String(n).repeat(32);
const base = (n: number, name: string, minutes: number) => ({
  id: id(n),
  name,
  since: Date.now() - minutes * MINUTE,
  minutes,
  late: minutes > 30,
  takenBy: null,
});
const car = (model: string, plate: string) => ({ car: { make: 'Chevrolet', model, plate } });
const support = (n: number, name: string, minutes: number) => ({
  kind: 'support',
  ...base(n, name, minutes),
  appeal: false,
});

const TEAM_NAVBAT = {
  items: [
    { kind: 'complaint', ...base(1, 'Madina', 120), against: 'Jasur', reasons: ['no_show'], refund: false },
    { kind: 'application', ...base(2, 'Jasur', 25), ...car('Cobalt', '01A123BC') },
    { kind: 'application', ...base(3, 'Bobur', 12), ...car('Nexia', '30B456CA') },
    { kind: 'face', ...base(4, 'Madina', 10) },
    { kind: 'face', ...base(5, 'Sardor', 8) },
    { kind: 'application', ...base(6, 'Dilnoza', 3), ...car('Damas', '10C789DA') },
    support(7, 'Kamola', 2),
    support(8, 'Rustam', 1),
    support(9, 'Nodira', 1),
  ],
  counts: { application: 3, complaint: 1, face: 2, support: 3 },
};

const errors = (n: number) => ({
  id: `errors:${n}`,
  at: Date.now(),
  sign: { kind: 'errors', hour: 9, usual: 1 },
});
const money = (n: number, name: string) => ({
  id: `money:${n}`,
  at: Date.now(),
  sign: { kind: 'money', name, person: id(n), seats: 2 },
});
const ATTENTION = {
  signs: [errors(1), errors(2), money(2, 'Jasur'), money(3, 'Bobur'), money(6, 'Dilnoza')],
};

export type TeamRole = 'owner' | 'moderator';
const ME = { owner: 'Fozil', moderator: 'Aziz' } as const;

export async function mockTeam(page: Page, role: TeamRole = 'owner') {
  const json = (path: string, body: unknown) => page.route(path, (route) => route.fulfill({ json: body }));
  await json('**/api/admin/me', { id: id(5), firstName: ME[role], hasAvatar: true, role });
  await page.route('**/api/users/*/avatar', (route) => route.fulfill({ path: 'e2e/fixtures/face.jpg' }));
  await json('**/api/admin/navbat', TEAM_NAVBAT);
  await json('**/api/admin/attention', ATTENTION);
  await json('**/api/admin/me/work', { done: 14, waiting: 9, averageMinutes: 11, over: 0 });
}
