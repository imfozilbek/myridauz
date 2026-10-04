import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { useDayLabel, useNearWhenLabel } from '../market/when';
import type { PlaceDirectory } from '../places/directory';
import { HomeCard, Pill, RouteLine, type PillTone } from './home-card';

type HomeRow = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // A request of a passenger has a day, not a time (G53).
  readonly day?: string;
  // After the time: the driver and the car, the free seats, the people of a request.
  readonly meta?: string;
  // The status as a plate: what waits for the person is amber, what is done is green.
  readonly pill?: { readonly text: string; readonly tone: PillTone };
  // «1 xabar»: the messages of the other side not read yet (G53).
  readonly unread?: number;
};

type Props = {
  readonly rows: readonly HomeRow[];
  readonly directory: PlaceDirectory;
  readonly onOpen: (id: string) => void;
};

// The nearest bookings or trips of the person, and the requests of a passenger with offers to
// answer, each as a card (G25, the mockup of G53). A tap opens one in «Mening safarlarim»; the data
// refreshes itself by the signal of the person (docs/64). A long name wraps, never hides the status.
export function HomeTrips({ rows, directory, onOpen }: Props) {
  const { t } = useI18n();
  const when = useNearWhenLabel();
  const dayLabel = useDayLabel();
  const [now] = useState(Date.now);
  const name = (id: string) => directory.find(id)?.name ?? '';
  return (
    <>
      {rows.map((row) => {
        const time = row.day ? dayLabel(row.day, now) : when(row.departAt, now);
        return (
          <HomeCard key={row.id} onClick={() => onOpen(row.id)}>
            <RouteLine from={name(row.from)} to={name(row.to)} />
            <span className="home-card-hint">
              {row.meta ? t('home.meta', { when: time, more: row.meta }) : time}
            </span>
            {row.pill || row.unread ? (
              <span className="home-pills">
                {row.pill ? <Pill tone={row.pill.tone}>{row.pill.text}</Pill> : null}
                {row.unread ? (
                  <Pill tone="brand" icon="chat">
                    {t('home.unread', { count: String(row.unread) })}
                  </Pill>
                ) : null}
              </span>
            ) : null}
          </HomeCard>
        );
      })}
    </>
  );
}
