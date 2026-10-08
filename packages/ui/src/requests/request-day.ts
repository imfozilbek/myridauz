import { DAY_MS, tashkentDate } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { noonOf, today } from '../market/when';

// The day of a request or a trip inside a line (mockups g64/1 and g64/2): «bugun», «ertaga», «8-okt».
export function useRequestDay() {
  const { t, formatShortDate } = useI18n();
  const [now] = useState(Date.now);
  return (date: string) => {
    if (date === today(now)) return t('requests.day.today');
    if (date === tashkentDate(now + DAY_MS)) return t('requests.day.tomorrow');
    return formatShortDate(noonOf(date));
  };
}

// The day of a later request only: today is the day of the board itself (mockups g64/1, g64/3).
export function useLaterDay() {
  const day = useRequestDay();
  const [now] = useState(Date.now);
  return (date: string) => (date === today(now) ? undefined : day(date));
}
