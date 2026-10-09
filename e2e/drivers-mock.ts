import { readFileSync } from 'node:fs';
import { loadBrand } from '@platform/brands';
import type { Page } from '@playwright/test';

// changes: the team asked to retake the side photo (mockup g62/1 screen 5).
export type DriverStart = 'none' | 'pending' | 'approved' | 'changes';

const DAY = 24 * 60 * 60 * 1000;
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const allPhotos = { front: true, side: true, interior: true };
export const summary = {
  userId: '00000000000000000000000000000005',
  firstName: 'Jasur',
  status: 'pending',
  car,
  reasons: [],
  submittedAt: 1,
};

const CHANGES = {
  status: 'changes_requested',
  car,
  photos: allPhotos,
  reasons: ['side_unclear'],
};
const START = {
  none: null,
  pending: { status: 'pending', car, photos: allPhotos, reasons: [] },
  approved: { status: 'approved', car, photos: allPhotos, reasons: [] },
  changes: CHANGES,
};

// Any real picture works: the Mini App compresses it before the upload.
const PHOTO = `brands/${loadBrand().id}/public/regions/1726.webp`;

// The driver application and the team queue as the Mini Apps see them (G06).
export async function mockDrivers(page: Page, start: DriverStart) {
  let application: object | null = START[start];
  const submitted: unknown[] = [];
  // A fix keeps its photos: only the retaken one is new (G62).
  const photos = { front: false, side: false, interior: false, ...START[start]?.photos };
  await page.route('**/api/driver/application', async (route) => {
    if (route.request().method() === 'POST') {
      submitted.push(route.request().postDataJSON());
      application = { status: 'pending', car, photos: allPhotos, reasons: [] };
    }
    await route.fulfill({ json: { application } });
  });
  await page.route('**/api/driver/application/photos/*', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ contentType: 'image/webp', body: readFileSync(PHOTO) });
    }
    const kind = route.request().url().split('/').pop() as keyof typeof photos;
    photos[kind] = true;
    application =
      start === 'changes'
        ? { ...CHANGES, photos: { ...photos }, reasons: [] }
        : { status: 'draft', car: null, photos: { ...photos }, reasons: [] };
    await route.fulfill({ json: { application } });
  });
  // «Navbat» of the team (G75): the case of a bot link opens by itself, then nothing waits.
  await page.route('**/api/admin/navbat', (route) =>
    route.fulfill({ json: { items: [], counts: { application: 0, complaint: 0, face: 0, support: 0 } } }),
  );
  // The team member on the main screen of the admin Mini App (G53).
  await page.route('**/api/admin/me', (route) =>
    route.fulfill({ json: { id: 'f'.repeat(32), firstName: 'Fozil', hasAvatar: false, role: 'owner' } }),
  );
  await page.route('**/api/admin/applications', (route) =>
    route.fulfill({ json: { applications: [summary] } }),
  );
  // The team sees earlier decisions, the same plate at another person and the blocks (docs/65 C).
  await page.route('**/api/admin/applications/*', (route) =>
    route.fulfill({
      json: {
        ...summary,
        samePlate: 1,
        was: null,
        gender: 'male',
        history: [{ status: 'changes_requested', reasons: ['face_not_visible'], at: Date.now() - DAY }],
      },
    }),
  );
  await page.route('**/api/admin/users/*/blocks', (route) =>
    route.fulfill({
      json: {
        active: null,
        entries: [
          { until: Date.now() - 20 * DAY, reason: 'complaint', by: 'Moderator', at: Date.now() - 27 * DAY },
        ],
      },
    }),
  );
  // The same real picture stands for every photo of the test application.
  await page.route('**/api/admin/applications/*/photos/*', (route) =>
    route.fulfill({ contentType: 'image/webp', body: readFileSync(PHOTO) }),
  );
  await page.route('**/api/admin/applications/*/decision', (route) =>
    route.fulfill({ json: { ...summary, status: 'approved' } }),
  );
  return { submitted };
}
