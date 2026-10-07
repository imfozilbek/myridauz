import { expect, test, type Page } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { passengerTrips } from './bookings';
import { mapState, mockMap } from './map-mock';
import { bookWholeCar, leaveRequest } from './request';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [PASSENGER] = MINI_APPS;

// The request, the offers and the whole car in the real build (G61, docs/118 path 4).
test.beforeEach(async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await mockTelegram(page);
});
const open = (page: Page) => page.goto(telegramUrl(appUrl(PASSENGER.port)));

test('a man leaves a request for 2 people with a woman and the whole car', async ({ page }) => {
  const bodies = await leaveRequest(page, () => open(page));
  expect(bodies.at(-1)).toMatchObject({ seats: 2, withWoman: true, wholeCar: true, pickupMode: 'door' });
});

test('an offer is accepted in its card and the page of the seat opens', async ({ page }) => {
  await open(page);
  await passengerTrips(page);
});

test('the whole car is booked on «Safar»: every seat of the trip', async ({ page }) => {
  const bodies = await bookWholeCar(page, () => open(page));
  expect(bodies.at(-1)).toMatchObject({ seats: 4, wholeCar: true });
});
