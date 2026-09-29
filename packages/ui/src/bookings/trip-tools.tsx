import type { Booking } from '@platform/contracts';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';

type Props = { readonly booking: Booking; readonly onChat: () => void };

// Under a passenger's booking: the chat, and for a confirmed one "Yaqinlarimga yuborish" with
// "Mashinaga chiqdim" and "Yetib keldim" for the close people (docs/07, docs/43).
export function TripTools({ booking: initial, onChat }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const [booking, setBooking] = useState(initial);
  const [note, setNote] = useState<'told' | 'stopped' | null>(null);
  // After "Ulashishni toʻxtatish" the button hides until the card is sent again.
  const [sharing, setSharing] = useState(true);
  const confirmed = booking.status === 'confirmed';
  const run = async (action: () => Promise<void>, after: 'told' | 'stopped' | null) => {
    try {
      await action();
      haptic.success();
      setNote(after);
    } catch {
      haptic.error();
    }
  };
  const share = () =>
    run(async () => {
      const { preparedMessageId, link } = await chat.share(booking.id);
      track({ name: 'trip_shared', screen: 'bookings.passenger' });
      await shareCard(preparedMessageId, link);
      setSharing(true);
    }, null);
  const step = (name: 'boarded' | 'arrived') =>
    run(async () => {
      setBooking(await chat[name](booking.id));
      track({ name, screen: 'bookings.passenger' });
    }, 'told');
  const stop = () =>
    run(async () => {
      await chat.stopSharing(booking.id);
      setSharing(false);
    }, 'stopped');
  return (
    <Section footer={note ? t(`share.${note}`) : undefined}>
      <Cell before={<IconTile name="chat" />} onClick={onChat}>
        {t('chat.open')}
      </Cell>
      {confirmed ? (
        <>
          <Cell
            before={<IconTile name="share" tone="accent" />}
            subtitle={t('share.sendHint')}
            onClick={() => void share()}
          >
            {t('share.send')}
          </Cell>
          {booking.boardedAt === null ? (
            <Cell before={<IconTile name="carSide" />} onClick={() => void step('boarded')}>
              {t('share.boarded')}
            </Cell>
          ) : null}
          {booking.arrivedAt === null ? (
            <Cell before={<IconTile name="destination" />} onClick={() => void step('arrived')}>
              {t('share.arrived')}
            </Cell>
          ) : null}
          {sharing ? (
            <Cell before={<IconTile name="blocked" />} onClick={() => void stop()}>
              {t('share.stop')}
            </Cell>
          ) : null}
        </>
      ) : null}
    </Section>
  );
}
