import { describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { testD1 } from '../../test-d1';
import { testEnv } from '../../test-api';
import { forgetDriver } from './index';

// Until 18.10.2026 the application asked for 3 car photos; now only the front with the plate (owner
// decision). The side and the inside of an older application go with the account all the same (docs/30).
describe('the photos an older application still keeps', () => {
  it('are deleted with the account, with the front', async () => {
    const db = testD1();
    await db.exec(
      "INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at) VALUES (5, 'Jasur', 'male', '998900000005', 0, 0, 0)",
    );
    await db.exec(
      "INSERT INTO driver_applications (user_id, status, photo_front, photo_side, photo_interior, updated_at) VALUES (5, 'approved', 'cars/5/front/a', 'cars/5/side/b', 'cars/5/interior/c', 1)",
    );
    const deleted: string[] = [];
    const media = { delete: async (key: string) => void deleted.push(key) };
    await forgetDriver({ ...testEnv, DB: db, MEDIA: media } as unknown as Bindings, 5);
    expect(deleted.toSorted()).toEqual(['cars/5/front/a', 'cars/5/interior/c', 'cars/5/side/b']);
    const row = await db
      .prepare('SELECT photo_front, photo_side, photo_interior FROM driver_applications WHERE user_id = 5')
      .first();
    expect(row).toEqual({ photo_front: null, photo_side: null, photo_interior: null });
  });
});
