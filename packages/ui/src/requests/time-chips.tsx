import type { RideRequest } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { departAtOf, slotsOn } from '../market/first-when';
import { useSchedule } from '../market/use-schedule';
import { haptic } from '../telegram/feedback';
import { offerTimes } from './offer-times';
import './time-chips.css';

// The times a driver may leave at on the day of a request, with the driver's busy times (docs/103):
// the first chip is chosen at once. null while the busy times load.
export function useOfferTime(request: RideRequest) {
  const [now] = useState(Date.now);
  const rules = useBrand().schedule;
  const schedule = useSchedule(request.from, request.to);
  const [picked, setPicked] = useState<string | null>(null);
  if (!schedule) return null;
  const slots = slotsOn(request.date, now, schedule, rules);
  const time =
    picked !== null && slots.includes(picked) ? picked : (offerTimes(slots)[0] ?? slots[0] ?? null);
  return {
    slots,
    full: schedule.full,
    time,
    departAt: time === null ? null : departAtOf(request.date, time),
    pick: setPicked,
  };
}

export type OfferTime = NonNullable<ReturnType<typeof useOfferTime>>;

// «Qachon joʻnaysiz?» of the sheets (mockups g64/1 and g64/3): three times in two hours from the
// morning and «Boshqa» with every free time of the day in the native list of the phone.
export function TimeChips({ when }: { readonly when: OfferTime }) {
  const { t } = useI18n();
  const chips = offerTimes(when.slots);
  const other = when.time !== null && !chips.includes(when.time);
  const pick = (time: string) => {
    haptic.select();
    when.pick(time);
  };
  if (when.full) return <Text className="step-error">{t('errors.trips.too_many')}</Text>;
  if (when.time === null) return <Text className="step-error">{t('market.when.none')}</Text>;
  return (
    <div className="time-chips" role="radiogroup" aria-label={t('market.when.title')}>
      {chips.map((time) => (
        <button
          key={time}
          type="button"
          role="radio"
          aria-checked={time === when.time}
          className="time-chip"
          onClick={() => pick(time)}
        >
          {time}
        </button>
      ))}
      <label className="time-chip" data-checked={other}>
        {other ? when.time : t('requests.offer.otherTime')}
        <select
          className="time-chip-list"
          aria-label={t('requests.offer.otherTime')}
          value={when.time}
          onChange={(event) => pick(event.target.value)}
        >
          {when.slots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
