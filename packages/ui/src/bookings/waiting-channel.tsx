import type { RideRequest } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ChannelCard } from '../find/channel-card';
import { useChannelOffer } from '../find/channel-offer';
import { usePlaces } from '../market/places-gate';
import '../find/channel-card.css';

// «Kutayotganda» (docs/119 place 3): while drivers answer, the channel of the direction of the
// request shows its new trips. Joined or closed in any place, it is gone (one direction once).
export function WaitingChannel({ request }: { readonly request: RideRequest }) {
  const { t } = useI18n();
  const directory = usePlaces();
  const from = directory.find(request.from);
  const to = directory.find(request.to);
  const region = to?.parentId ? directory.find(to.parentId) : to;
  const { channel, close } = useChannelOffer(from && to ? { from, to } : null, directory);
  if (!channel) return null;
  return (
    <>
      <p className="find-head my-request-head">{t('bookings.request.waiting')}</p>
      <div className="my-request-channel">
        <ChannelCard channel={channel} region={region} onClose={close} />
      </div>
    </>
  );
}
