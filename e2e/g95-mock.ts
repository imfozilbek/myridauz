import type { Page } from '@playwright/test';
import { id } from './team-mock';

// The decisions of Aziz as on the mockup of G95 (docs/224): Farhod approved today, though the plate
// on his front photo (01 A 777 BC) is not the one he wrote (01 A 123 BC); Bobur rejected yesterday.
const HOUR = 60 * 60_000;
const json = (page: Page, path: string, body: unknown) =>
  page.route(path, (route) => route.fulfill({ json: body }));
// The clock of the mockup (06.11.2026 10:48 in Tashkent): the shots of the code repeat it to the pixel.
export const MOCKUP_NOW = Date.parse('2026-11-06T05:48:30Z');
const at = (hours: number) => MOCKUP_NOW - hours * HOUR;
const COBALT = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const REJECTED = ['plate_not_readable'];
const NEXIA = { make: 'Chevrolet', model: 'Nexia', color: 'silver', plate: '30B456CA', seats: 4 };

const decision = (n: number, firstName: string, status: string, plate: string, hours: number) => ({
  userId: id(n),
  firstName,
  status,
  plate,
  at: at(hours),
});

const application = (n: number, firstName: string, status: string, car: object, hours: number) => ({
  userId: id(n),
  firstName,
  status,
  car,
  reasons: status === 'rejected' ? REJECTED : [],
  submittedAt: at(hours + 1),
  history: [{ status, reasons: status === 'rejected' ? REJECTED : [], at: at(hours) }],
  samePlate: 0,
  was: null,
  gender: 'male',
});

export async function mockDecisions(page: Page) {
  await json(page, '**/api/admin/me/decisions', {
    decisions: [
      decision(2, 'Farhod', 'approved', '01A123BC', 1),
      decision(3, 'Sardor', 'changes_requested', '10C789DA', 2),
      decision(6, 'Bobur', 'rejected', '30B456CA', 26),
      decision(7, 'Dilnoza', 'approved', '01D555EA', 28),
    ],
  });
  await json(page, `**/api/admin/applications/${id(2)}`, application(2, 'Farhod', 'approved', COBALT, 1));
  await json(page, `**/api/admin/applications/${id(6)}`, application(6, 'Bobur', 'rejected', NEXIA, 26));
  await page.route('**/api/admin/applications/*/photos/front', (route) =>
    route.fulfill({ path: 'e2e/fixtures/car-front.jpg' }),
  );
  await page.route('**/api/admin/applications/*/photos/avatar', (route) =>
    route.fulfill({ path: 'e2e/fixtures/face.jpg' }),
  );
  await page.route('**/api/admin/people/*/telegram', (route) => {
    const username = route.request().url().includes(id(6)) ? 'bobur_30' : 'farhod_01';
    return route.fulfill({ json: { username, profileLink: `https://t.me/${username}` } });
  });
  // The owner reads the same decisions in «Jurnal»: an application opens its case.
  await json(page, '**/api/admin/journal*', {
    entries: [
      { member: 'Aziz', kind: 'application', subject: id(2), action: 'approve', at: at(1) },
      { member: 'Aziz', kind: 'application', subject: id(6), action: 'reject', at: at(26) },
    ],
  });
}
