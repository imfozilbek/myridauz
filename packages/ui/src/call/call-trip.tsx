import type { ChatAbout } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { RouteLine } from '../home/home-card';
import { useNearWhenLabel } from '../market/when';
import { useDirectory } from '../places/use-directory';

// The other side of a chat: the driver with the car for a passenger, the passenger for a driver.
export function otherName({ booking, role }: ChatAbout): string | null {
  if (!booking) return null;
  return role === 'passenger' ? booking.trip.driver.firstName : booking.passenger.firstName;
}

// The trip of a call, always on the call screen (G54, docs/115): who calls, which trip, when and
// how many seats, so the person knows what the call is about before answering.
export function CallTrip({ about }: { readonly about: ChatAbout }) {
  const { t } = useI18n();
  const when = useNearWhenLabel();
  const [now] = useState(Date.now);
  const [places] = useDirectory();
  const { booking, role } = about;
  if (!booking) return null;
  const { car } = booking.trip.driver;
  const color = t(`drivers.color.${car.color}`).toLocaleLowerCase('uz');
  const side =
    role === 'passenger' ? t('home.role.driver', { model: car.model, color }) : t('home.role.passenger');
  // The plate helps a passenger find the car; a driver knows their own.
  const name = (id: string) => (places.status === 'ready' ? (places.directory.find(id)?.name ?? '') : '');
  const seats = t('market.request.seats', { count: String(booking.seats) });
  return (
    <div className="call-trip">
      <Caption className="call-hint">
        {role === 'passenger' && booking.plate ? `${side} · ${booking.plate}` : side}
      </Caption>
      <RouteLine from={name(booking.trip.from)} to={name(booking.trip.to)} />
      <Text className="call-status">
        {t('home.meta', { when: when(booking.trip.departAt, now), more: seats })}
      </Text>
    </div>
  );
}
