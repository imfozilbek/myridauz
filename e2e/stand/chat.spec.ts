import { expect, test } from '../crash-guard';
import { createBookingsClient, createChatClient } from '@platform/api-client';
import { confirmedSeat, toldBy, wordsOf } from './g27-kit';
import { FERUZA, KOMIL, OWNER } from './people';
import { signedAs, type Person } from './stand-kit';

// The chat of a seat (docs/77 P40, docs/80 S40, docs/81 A01, F04, docs/79 T64): phones are masked with a warning,
// a person away from the chat hears «Yangi xabar», two phones of one person see the same.
test.describe.configure({ mode: 'serial' });
type Frame = { type: string; message?: { text: string } };
const SETTLE_MS = 5_000;

async function connect(app: 'passenger' | 'driver', person: Person, key: string) {
  const url = await createChatClient(await signedAs(app, person)).socketUrl(key);
  const socket = new WebSocket(url);
  const frames: Frame[] = [];
  socket.addEventListener('message', (event) => frames.push(JSON.parse(String(event.data)) as Frame));
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve);
    socket.addEventListener('error', reject);
  });
  await expect.poll(() => frames.some((f) => f.type === 'history'), { timeout: SETTLE_MS }).toBe(true);
  return { socket, frames, send: (text: string) => socket.send(JSON.stringify({ type: 'send', text })) };
}
const texts = (frames: Frame[]) => frames.flatMap((f) => (f.message ? [f.message.text] : []));

test('S40, A01, F04. a phone is masked with a warning; the driver away hears «Yangi xabar»; two phones', async () => {
  const { seat } = await confirmedSeat(KOMIL, FERUZA);
  const phone = await connect('passenger', FERUZA, seat.chatKey);
  const secondPhone = await connect('passenger', FERUZA, seat.chatKey);
  phone.send('Mening raqamim 90 123 45 67, qoʻngʻiroq qiling');
  await expect.poll(() => phone.frames.some((f) => f.type === 'warning'), { timeout: SETTLE_MS }).toBe(true);
  await expect.poll(() => texts(secondPhone.frames).length, { timeout: SETTLE_MS }).toBeGreaterThan(0);
  expect(texts(secondPhone.frames).join(' ')).not.toMatch(/123\s?45\s?67/u);
  // The driver is not in the chat: the driver bot tells about the message.
  await toldBy('driver', KOMIL, wordsOf('bot.chat.newMessage'));
  phone.socket.close();
  secondPhone.socket.close();
});

test('T64. every third hidden phone is a signal to the team', async () => {
  const { seat } = await confirmedSeat(KOMIL, FERUZA);
  const phone = await connect('passenger', FERUZA, seat.chatKey);
  for (const number of ['90 111 22 33', '91 222 33 44', '93 333 44 55']) phone.send(`Raqam: ${number}`);
  await toldBy('admin', OWNER, wordsOf('bot.chat.contactAttempts'));
  phone.socket.close();
});

// G53: the messages of the driver the passenger has not read are on the main screen, until the chat opens.
test('G53. a message to a passenger away is «1 xabar» on the booking, gone once the chat opens', async () => {
  const { seat } = await confirmedSeat(KOMIL, FERUZA);
  const unread = async () => {
    const bookings = await createBookingsClient(await signedAs('passenger', FERUZA)).myBookings();
    return bookings.find((booking) => booking.id === seat.id)?.unread;
  };
  expect(await unread()).toBe(0);
  const driver = await connect('driver', KOMIL, seat.chatKey);
  driver.send('Salom, soat 8 da kelaman');
  driver.send('Pitakda kutaman');
  await expect.poll(unread, { timeout: SETTLE_MS }).toBe(2);
  const passenger = await connect('passenger', FERUZA, seat.chatKey);
  await expect.poll(unread, { timeout: SETTLE_MS }).toBe(0);
  driver.socket.close();
  passenger.socket.close();
});
