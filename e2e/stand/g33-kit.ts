import { expect, type Browser, type Page } from '@playwright/test';
import { createChatClient, createModerationClient } from '@platform/api-client';
import { TEXT } from '../apps';
import { OWNER } from './people';
import { NARROW } from './screen-tour';
import { apply } from './seed';
import { signedAs, type Person } from './stand-kit';
import { workerBack } from './stand-tools';

// G33 (docs/94): the shots go to before/ while the findings stand, to after/ once fixed.
const WHEN = process.env['G33_SHOTS'] === 'before' ? 'before' : 'after';
export const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/stand/g33/${WHEN}/${name}.png`, animations: 'disabled' });
export const mainButton = (page: Page) => page.locator('#tg-main-button');
export const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));
export const toBottom = (page: Page) =>
  page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

// The microphone tracks of the page that still record: the fake microphone of the stand is counted.
export async function countMicrophone(page: Page) {
  await page.addInitScript(() => {
    const tracks: MediaStreamTrack[] = [];
    const devices = navigator.mediaDevices;
    const original = devices.getUserMedia.bind(devices);
    devices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      tracks.push(...stream.getAudioTracks());
      return stream;
    };
    Object.assign(window, { __liveMic: () => tracks.filter((track) => track.readyState === 'live').length });
  });
}
export const liveMicrophone = (page: Page) =>
  page.evaluate(() => (window as unknown as { __liveMic: () => number }).__liveMic());

// From Chilonzor (Toshkent shahri) to Navoiy, tomorrow, by lists.
export async function chooseRoute(page: Page) {
  await page.getByText(TEXT.from).click();
  await page.getByAltText('Toshkent shahri').click();
  await page.getByText('Chilonzor').click();
  // «Qayerga» opens by itself, both ends go on (G40, docs/106 K1).
  await page.getByAltText('Navoiy viloyati').click();
  await page.getByText('Navoiy', { exact: true }).click();
}

// One side of a chat through its socket, as the other phone writes.
export async function openSocket(person: Person, key: string): Promise<WebSocket> {
  const url = await createChatClient(await signedAs('driver', person)).socketUrl(key);
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve);
    socket.addEventListener('error', reject);
  });
  return socket;
}
// A Worker reload closes a socket being opened (lesson 91): a few tries, like every request.
const SOCKET_TRIES = 3;
export async function writeInChat(person: Person, key: string, texts: readonly string[]) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const socket = await openSocket(person, key);
      for (const text of texts) socket.send(JSON.stringify({ type: 'send', text }));
      return socket;
    } catch (error) {
      if (attempt === SOCKET_TRIES) throw error;
      await workerBack();
    }
  }
}

const bubbles = (page: Page) => page.locator('.chat-bubble');
export async function waitBubbles(page: Page, count: number) {
  await expect.poll(() => bubbles(page).count()).toBeGreaterThanOrEqual(count);
}

// A phone of its own: another person, nothing kept from the last one.
export const phone = async (browser: Browser) => (await browser.newContext({ viewport: NARROW })).newPage();

// A new driver up to the car photos: Chevrolet Damas, white, with a face photo. The face is the
// first photo of the same screen (G34): «Rasmga olish» is left on the car photos only.
export async function toCarPhotos(page: Page) {
  await page.getByText(TEXT.becomeDriver).first().click();
  await page.getByText('Chevrolet', { exact: true }).click();
  await page.getByText('Damas', { exact: true }).click();
  await page.getByText('Oq', { exact: true }).click();
  await page.getByLabel(TEXT.plateField).fill('01 a 123 bc');
  await mainButton(page).click();
  await page.getByText(TEXT.face, { exact: true }).click();
  await page.getByRole('dialog').getByLabel(TEXT.shutter).click();
  await expect(page.getByText(TEXT.retake)).toHaveCount(1);
}

// Ten drivers of their own, so the trips of G33 never meet the limits of other scenarios.
const NAMES = ['Anvar', 'Botir', 'Doston', 'Elyor', 'Farhod', 'Hasan', 'Ilhom', 'Jamshid', 'Karim', 'Laziz'];
const TEN: readonly Person[] = NAMES.map((name, index) => ({
  id: 900640 + index,
  name,
  phone: `9989011106${40 + index}`,
}));
export async function tenDrivers() {
  for (const [index, person] of TEN.entries()) await apply(person, `01N${100 + index}AA`, 'male');
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  const names = new Set(TEN.map((person) => person.name));
  for (const application of await moderation.queue())
    if (names.has(application.firstName)) await moderation.decide(application.userId, { action: 'approve' });
  return TEN;
}
