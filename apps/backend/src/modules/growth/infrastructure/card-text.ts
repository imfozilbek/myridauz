import type { BrandConfig } from '@platform/brands';
import { isDriverMoment, momentKeys, momentValues } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import type { CardInput, CardMessage } from '../application/ports';

const { t } = createI18n(DEFAULT_LOCALE);
const key = (value: string) => value as TranslationKey;

// The ready message of «Doʻstlarimga yuborish» (docs/123, goals/g69/1-share-cards.png 4): the phrase
// the person chose in their own voice, the name and the route, the button to the link.
export function cardMessage(brand: BrandConfig, input: CardInput): CardMessage {
  const keys = momentKeys(input.moment, input.phrase);
  const values = momentValues(input.moment, {
    brand: brand.name,
    name: input.name,
    from: input.route?.from ?? '',
    to: input.route?.to ?? '',
    people: input.people,
  });
  const text = t('growth.message.text', {
    ...values,
    phrase: t(key(keys.phrase), values),
    who: input.route ? t('growth.who', values) : input.name,
    fact: t(key(keys.fact), values),
  });
  const words = { title: t('growth.message.title', values), button: t(key(keys.link), values) };
  if (!isDriverMoment(input.moment)) return { text, words };
  return {
    text,
    words: { ...words, second: { text: t('growth.message.join', values), url: input.joinLink } },
  };
}
