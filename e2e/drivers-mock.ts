import type { Page } from '@playwright/test';

export type DriverStart = 'none' | 'approved';

const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', year: 2021, plate: '01A123BC', seats: 4 };
const allPhotos = { front: true, side: true, interior: true };
const summary = { userId: 5, firstName: 'Jasur', status: 'pending', car, reason: null, submittedAt: 1 };

// The driver application and the team queue as the Mini Apps see them (G06).
export async function mockDrivers(page: Page, start: DriverStart) {
  let application: object | null =
    start === 'approved' ? { status: 'approved', car, photos: allPhotos, reason: null } : null;
  const submitted: unknown[] = [];
  const photos = { front: false, side: false, interior: false };
  await page.route('**/api/driver/application', async (route) => {
    if (route.request().method() === 'POST') {
      submitted.push(route.request().postDataJSON());
      application = { status: 'pending', car, photos: allPhotos, reason: null };
    }
    await route.fulfill({ json: { application } });
  });
  await page.route('**/api/driver/application/photos/*', async (route) => {
    const kind = route.request().url().split('/').pop() as keyof typeof photos;
    photos[kind] = true;
    application = { status: 'draft', car: null, photos: { ...photos }, reason: null };
    await route.fulfill({ json: { application } });
  });
  await page.route('**/api/admin/applications', (route) =>
    route.fulfill({ json: { applications: [summary] } }),
  );
  // Photos of a test application do not exist: the grid shows its empty frames.
  await page.route('**/api/admin/applications/*/photos/*', (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  await page.route('**/api/admin/applications/*/decision', (route) =>
    route.fulfill({ json: { ...summary, status: 'approved' } }),
  );
  return { submitted };
}
