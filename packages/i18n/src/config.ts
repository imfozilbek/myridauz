// Languages (docs/13). The texts are written in Uzbek Latin (uz-Latn, the reference); people see them
// in Uzbek Cyrillic, made from the reference by a program (owner, 11.11.2026; G98, docs/228).
export type Locale = 'uz-Latn' | 'uz-Cyrl';
export const ENABLED_LOCALES: readonly Locale[] = ['uz-Cyrl'];
export const DEFAULT_LOCALE: Locale = 'uz-Cyrl';
// All dates and times are shown in Uzbekistan time (docs/35).
export const TIME_ZONE = 'Asia/Tashkent';
