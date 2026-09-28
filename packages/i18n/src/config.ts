// Languages (docs/13). A new language: add its files to locales/ and its code here.
export const ENABLED_LOCALES = ['uz-Latn'] as const;
export type Locale = (typeof ENABLED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz-Latn';
// All dates and times are shown in Uzbekistan time (docs/35).
export const TIME_ZONE = 'Asia/Tashkent';
