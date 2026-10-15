import {
  momentKeys,
  momentKind,
  momentValues,
  PHRASES,
  type Moment,
  type ShareMoment,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useAccount } from '../account/account-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';

const key = (value: string) => value as TranslationKey;

// The words of a moment on the screen, the card and the story: the same keys as the chat message
// of the server (docs/123), with the name of the person and the names of the places.
export function useMomentWords(found: Moment & { readonly moment: ShareMoment }) {
  const { t } = useI18n();
  const brand = useBrand();
  const directory = usePlaces();
  const name = useAccount()?.profile.firstName ?? '';
  const place = (id: string | undefined) => (id ? (directory.find(id)?.name ?? id) : '');
  const facts = {
    brand: brand.name,
    name,
    from: place(found.route?.from),
    to: place(found.route?.to),
    people: found.people,
  };
  const values = momentValues(found.moment, facts);
  const keys = (phrase: number) => momentKeys(found.moment, phrase);
  const kind = momentKind(found.moment);
  const driver = kind === 'driver' || kind === 'riders';
  return {
    values,
    title: t(key(keys(0).title), values),
    lead: t(key(keys(0).lead), values),
    whyTitle: t(key(keys(0).whyTitle), values),
    whyText: t(key(keys(0).whyText), values),
    phrases: Array.from({ length: PHRASES }, (_, phrase) => t(key(keys(phrase).phrase), values)),
    fact: t(key(keys(0).fact), values),
    who: found.route && kind !== 'join' ? t('growth.who', values) : name,
    link: t(key(keys(0).link), values),
    // The button names to whom (docs/123): the friends going the same way, or the own passengers.
    chat: driver
      ? t('growth.toRiders')
      : found.route && kind !== 'join'
        ? t('growth.toFriendsGoing', values)
        : t('growth.toFriends'),
  };
}

export type MomentWords = ReturnType<typeof useMomentWords>;
