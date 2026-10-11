import { BOOKING_LINK, MY_TRIP_LINK, type AppLink, type ChatAbout } from '@platform/contracts';
import { RequestLine } from './request-line';
import { TalkAction } from './talk-action';
import { TalkOffer } from './talk-offer';

// A talk before a booking (G64): the chat of a request and one driver. With the booking the chat is
// the booking's again (docs/07).
const talkOf = (about: ChatAbout | null) => (about?.request && !about.booking ? about : null);

// The request on top, under the head (mockups g64/4, g64/5).
export function TalkTop({ about }: { readonly about: ChatAbout | null }) {
  const talk = talkOf(about);
  if (!talk?.request || !talk.role) return null;
  return <RequestLine request={talk.request} role={talk.role} />;
}

type BottomProps = {
  readonly about: ChatAbout | null;
  readonly onChanged: () => unknown;
  // What an action here opens, as from the sheet and the board (G77): the seat of an offer taken,
  // the trip for a whole car.
  readonly onLink?: ((link: AppLink) => void) | undefined;
};

// Under the messages: the live offer as a card; the driver's action above the input while no offer
// waits for the answer (mockup g64/5: «Asosiy tugma yoʻqoladi»).
export function TalkBottom({ about, onChanged, onLink }: BottomProps) {
  const talk = talkOf(about);
  if (!talk?.request || !talk.role) return null;
  const live = talk.offer?.status === 'sent' ? talk.offer : null;
  if (live)
    return (
      <TalkOffer
        offer={live}
        role={talk.role}
        other={talk.request.passenger.firstName}
        onAnswered={onChanged}
        onSeat={onLink && ((id) => onLink({ name: BOOKING_LINK, id }))}
      />
    );
  if (talk.role !== 'driver' || talk.request.status !== 'open') return null;
  const onTrip = onLink && ((id: string) => onLink({ name: MY_TRIP_LINK, id }));
  return <TalkAction request={talk.request} onSent={onChanged} onTrip={onTrip} />;
}
