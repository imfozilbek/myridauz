import type { BrandConfig } from '@platform/brands';
import { momentKeys } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import { passengerValue } from '../../../shared/share/value-lines';
import type { CardInput, CardMessage } from '../application/ports';

const { t } = createI18n(DEFAULT_LOCALE);
const key = (value: string) => value as TranslationKey;

// The ready message of «Yoʻlovchilarimga yuborish» (docs/123, goals/g69/1-share-cards.png 4): the phrase
// the person chose in their own voice, the name, why the brand (G88, docs/193), the button to the link.
export function cardMessage(brand: BrandConfig, input: CardInput): CardMessage {
  const keys = momentKeys(input.moment, input.phrase);
  const values = { brand: brand.name, name: input.name };
  const text = t('growth.message.text', {
    ...values,
    phrase: t(key(keys.phrase), values),
    fact: t(key(keys.fact), values),
    value: passengerValue(),
  });
  return { text, words: { title: t('growth.message.title', values), button: t(key(keys.link), values) } };
}
