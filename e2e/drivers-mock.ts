import { readFileSync } from 'node:fs';
import { loadBrand } from '@platform/brands';
import type { Page } from '@playwright/test';

// changes: the team asked to retake the face and the front photo and to check the plate.
export type DriverStart = 'none' | 'approved' | 'changes';

const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const allPhotos = { front: true, side: true, interior: true };
const summary = { userId: 5, firstName: 'Jasur', status: 'pending', car, reasons: [], submittedAt: 1 };

const CHANGES = {
  status: 'changes_requested',
  car,
  photos: allPhotos,
  reasons: ['face_not_visible', 'plate_not_readable', 'plate_mismatch'],
};
const START = {
  none: null,
  approved: { status: 'approved', car, photos: allPhotos, reasons: [] },
  changes: CHANGES,
};

// Any real picture works: the Mini App compresses it before the upload.
const PHOTO = `brands/${loadBrand().id}/public/regions/1726.webp`;

// The driver application and the team queue as the Mini Apps see them (G06).
export async function mockDrivers(page: Page, start: DriverStart) {
  let application: object | null = START[start];
  const submitted: unknown[] = [];
  const photos = { front: false, side: false, interior: false };
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
    application = { status: 'draft', car: null, photos: { ...photos }, reasons: [] };
    await route.fulfill({ json: { application } });
  });
  await page.route('**/api/admin/applications', (route) =>
    route.fulfill({ json: { applications: [summary] } }),
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
