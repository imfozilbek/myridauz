import { test } from './crash-guard';
import { openBookingPoints } from './g63-note-mock';

// Pixel Perfect of «Qayerdan, qayerga?» with the line «Izoh (ixtiyoriy)» (G63, owner decision 8):
// the screen 7 of docs/goals/g59/11-journey-passenger.png at its scale, cut where G59 cut it (360 × 776
// at 1.25, docs/133; owner decision 4), and with its data: the trip of Nodira tomorrow at 16:00 for
// 100 000 a seat, two seats. The line itself is on no mockup: the parts above and below it are
// measured each against its own piece (lesson 160).
const OUT = 'screenshots/pixel-g63';
test.use({ viewport: { width: 360, height: 776 }, deviceScaleFactor: 1.25 });

test('«Qayerdan, qayerga?» with «Izoh (ixtiyoriy)» (g59 journey screen 7)', async ({ page }) => {
  await openBookingPoints(page);
  await page.screenshot({ path: `${OUT}/note-code.png`, animations: 'disabled' });
});
