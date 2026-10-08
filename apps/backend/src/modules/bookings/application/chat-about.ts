import { NO_RATING, type ChatAbout, type Offer } from '@platform/contracts';
import { chatBooking, chatMember } from './chat-member';
import { offerViews } from './offer-views';
import type { BookingsDeps } from './ports';

// The request and the latest offer of a talk or of an offer chat (G64): the line on top of the chat,
// the card of the offer in the chat and in the call.
async function requestAndOffer(deps: BookingsDeps, key: string) {
  const id = key.slice(1);
  if (key.startsWith('b')) return null;
  const talk = key.startsWith('t') ? await deps.talks.find(id) : undefined;
  const requestId = talk?.requestId ?? (await deps.offers.find(id))?.requestId;
  if (!requestId) return null;
  const offers = talk
    ? (await deps.offers.byRequests([requestId])).filter((offer) => offer.talkId === talk.id)
    : (await deps.offers.byRequests([requestId])).filter((offer) => offer.id === id);
  const latest = [...offers].sort((a, b) => b.createdAt - a.createdAt)[0];
  const facts = await deps.requests.find(requestId);
  const [offer] = latest && facts ? await offerViews(deps, [latest], [facts]) : [];
  const driver = talk ? await talkDriver(deps, talk.driverId) : null;
  return { request: (await deps.requests.view(requestId)) ?? null, offer: offer ?? null, driver };
}

// The driver of a talk as the passenger sees him before an offer: the face, the car, the rating (G64).
async function talkDriver(deps: BookingsDeps, driverId: number): Promise<Offer['driver'] | null> {
  const [person, car, ratings] = await Promise.all([
    deps.people.find(driverId),
    deps.approvedCar(driverId),
    deps.ratings([driverId]),
  ]);
  if (!person || !car) return null;
  return {
    id: person.publicId,
    firstName: person.firstName,
    hasAvatar: person.avatarShown,
    car: { make: car.make, model: car.model, color: car.color, plate: car.plate },
    rating: ratings.get(driverId) ?? NO_RATING,
  };
}

// What the chat screen and the call show (G54, G64): the booking, the side of the person, the request
// and the offer; null for anyone who is not in the chat.
export async function chatAbout(deps: BookingsDeps, key: string, userId: number): Promise<ChatAbout | null> {
  const member = await chatMember(deps, key, userId);
  if (!member) return null;
  const booked = await chatBooking(deps, key, userId);
  const talk = await requestAndOffer(deps, key);
  const offer: Offer | null = talk?.offer ?? null;
  const driver = talk?.driver ?? null;
  return { booking: booked?.booking ?? null, role: member.role, request: talk?.request ?? null, offer, driver };
}
