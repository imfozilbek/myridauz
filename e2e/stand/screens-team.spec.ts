import { expect, test } from '../crash-guard';
import { OWNER } from './people';
import { NARROW, openHome, PLATFORMS, shot, t, visit } from './screen-tour';
import { outsideCalls } from './stand-kit';

// The screens of the team (docs/79) for the UX review: the owner's admin Mini App.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

for (const platform of PLATFORMS)
  test(`${platform}: the admin Mini App and one step from it`, async ({ page }) => {
    await openHome(page, 'admin', OWNER, platform);
    await shot(page, platform, 't10-home');
    // «Navbat» is on the main screen; «Boshqaruv» is the owner's (G75, mockup g67/1).
    await visit(page, platform, t('common.admin.management'), 't13-management');
  });
