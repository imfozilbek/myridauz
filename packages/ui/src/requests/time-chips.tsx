import { ApiError } from '@platform/api-client';
import { slotAt, type RideRequest } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { slotsOn } from '../market/first-when';
import { useSchedule } from '../market/use-schedule';
import { useClock } from '../own-trip/use-now';
import { haptic } from '../telegram/feedback';
import { draftOf, keepDraft, keepOfferTime, lastOfferTime } from './offer-draft';
import { offerTimes } from './offer-times';
import './time-chips.css';

// The times a driver may leave at on the day of a request, with the driver's busy times (docs/103):
// the one chosen before the sheet closed, else the time of the last offer (G79 В13), else the first
// chip. null while they load.
// The time of the sheet moves on while it stays open; the tap takes «now» once more (G77).
export function useOfferTime(request: RideRequest) {
  const [now, tick] = useClock();
  const rules = useBrand().schedule;
  const schedule = useSchedule();
  const [picked, setPicked] = useState<string | null>(
    () => draftOf('time', request.id) ?? lastOfferTime() ?? null,
  );
  if (!schedule) return null;
  const timeAt = (at: number) => {
    const slots = slotsOn(request.date, at, rules);
    const time =
      picked !== null && slots.includes(picked) ? picked : (offerTimes(slots)[0] ?? slots[0] ?? null);
    return { slots, time, departAt: time === null ? null : slotAt(request.date, time) };
  };
  const shown = timeAt(now);
  return {
    ...shown,
    full: schedule.full,
    // The moment that goes at the tap; none when the time on the sheet became too soon meanwhile: the
    // sheet catches up with the clock and the person chooses again, never an unseen time.
    sending: () => {
      tick();
      const at = timeAt(Date.now()).departAt;
      if (at !== shown.departAt) return null;
      if (shown.time) keepOfferTime(shown.time);
      return at;
    },
    pick: (time: string) => (keepDraft('time', request.id, time), setPicked(time)),
  };
}

export type OfferTime = NonNullable<ReturnType<typeof useOfferTime>>;

// The reason a sheet says when its time became too soon before the tap: the same as the API's.
const UNPROCESSABLE = 422;
export const TOO_SOON = new ApiError(UNPROCESSABLE, 'trips.too_soon');

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
