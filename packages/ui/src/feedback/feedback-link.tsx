import { useState, type ReactNode } from 'react';
import { PlacesGate } from '../market/places-gate';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { ComplaintScreen } from './complaint-screen';
import { ReviewScreen } from './review-screen';

// "Izoh qoldirish" and "Shikoyat qilish" under the bot's "Safar qanday oʻtdi?" (docs/17, docs/24).
const REVIEW = 'review';
const COMPLAIN = 'complain';
const BOOKING_ID = /^[A-Za-z0-9-]{1,64}$/u;
type Open = { readonly screen: 'review' | 'complain'; readonly bookingId: string };

function linked(): Open | null {
  const review = launchParam(REVIEW, BOOKING_ID);
  if (review) return { screen: 'review', bookingId: review };
  const complain = launchParam(COMPLAIN, BOOKING_ID);
  return complain ? { screen: 'complain', bookingId: complain } : null;
}

// The passenger and the driver app open the review or the complaint at once; back goes home.
export function FeedbackLink({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(() => (enabled ? linked() : null));
  if (!open) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(REVIEW);
    forgetLaunchParam(COMPLAIN);
    setOpen(null);
  };
  if (open.screen === 'complain') return <ComplaintScreen bookingId={open.bookingId} onBack={close} />;
  return (
    <PlacesGate onBack={close}>
      <ReviewScreen
        bookingId={open.bookingId}
        onBack={close}
        onComplain={() => setOpen({ screen: 'complain', bookingId: open.bookingId })}
      />
    </PlacesGate>
  );
}
