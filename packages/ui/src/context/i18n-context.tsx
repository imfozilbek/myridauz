import { createI18n, DEFAULT_LOCALE, ENABLED_LOCALES, type I18n, type Locale } from '@platform/i18n';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Cell, Section } from '../components';
import { Icon } from '../icons';

type I18nState = I18n & { readonly setLocale: (locale: Locale) => void };

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const value = useMemo(() => ({ ...createI18n(locale), setLocale }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error('ui.i18n_missing');
  return i18n;
}

// Hidden while only one language is enabled; appears by itself when a second one is added (docs/13).
export function LanguageSwitcher({ locales = ENABLED_LOCALES }: { readonly locales?: readonly Locale[] }) {
  const { t, locale, setLocale } = useI18n();
  if (locales.length < 2) return null;
  return (
    <Section header={t('common.language')}>
      {locales.map((option) => (
        <Cell
          key={option}
          before={<Icon name="language" />}
          after={option === locale ? <Icon name="selected" /> : undefined}
          onClick={() => setLocale(option)}
        >
          {new Intl.DisplayNames(option, { type: 'language' }).of(option)}
        </Cell>
      ))}
    </Section>
  );
}
