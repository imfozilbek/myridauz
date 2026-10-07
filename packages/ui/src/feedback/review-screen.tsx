import { chatKeyOfBooking } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { PlacesGate } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { ReviewForm } from './review-form';

type Props = {
  readonly bookingId: string;
  readonly onBack: () => void;
  readonly onComplain: () => void;
  readonly onClose?: (() => void) | undefined;
};

// "Safarni baholang" (docs/24): whom the person rates and the booking of the ride for its card
// (G60, mockup g60/5). Sent: back at once, or the app closes when the bot opened it.
export function ReviewScreen(props: Props) {
  return (
    <PlacesGate onBack={props.onBack}>
      <Review {...props} />
    </PlacesGate>
  );
}

function Review({ bookingId, onBack, onComplain, onClose }: Props) {
  const { feedback, chat } = useApiClients();
  const { value, failed, reload } = useLoad(async () => {
    const [target, about] = await Promise.all([
      feedback.target(bookingId),
      chat.about(chatKeyOfBooking(bookingId)).catch(() => null),
    ]);
    return { target, booking: about?.booking ?? null };
  });
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <ReviewForm
      bookingId={bookingId}
      target={value.target}
      booking={value.booking}
      onBack={onBack}
      onComplain={onComplain}
      onSent={onClose ?? onBack}
    />
  );
}
