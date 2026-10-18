import { momentKeys, PHRASES, type ShareMoment } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useAccount } from '../account/account-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';

const key = (value: string) => value as TranslationKey;

// The words of a moment on the screen, the card and the story: the same keys as the chat message
// of the server (docs/123), with the name of the person.
export function useMomentWords(moment: ShareMoment) {
  const { t } = useI18n();
  const brand = useBrand();
  const name = useAccount()?.profile.firstName ?? '';
  const values = { brand: brand.name, name };
  const keys = (phrase: number) => momentKeys(moment, phrase);
  return {
    name,
    title: t(key(keys(0).title), values),
    lead: t(key(keys(0).lead), values),
    whyTitle: t(key(keys(0).whyTitle), values),
    whyText: t(key(keys(0).whyText), values),
    phrases: Array.from({ length: PHRASES }, (_, phrase) => t(key(keys(phrase).phrase), values)),
    fact: t(key(keys(0).fact), values),
    link: t(key(keys(0).link), values),
    // The button names to whom (docs/123): the own passengers of a driver.
    chat: t('growth.toRiders'),
  };
}

export type MomentWords = ReturnType<typeof useMomentWords>;
