import common from '../locales/uz-Latn/common.json' with { type: 'json' };

// uz-Latn is the reference language: its keys are the only valid keys (docs/13).
type TranslationKey = keyof typeof common;
type Params = Readonly<Record<string, string>>;

const PLACEHOLDER = /\{(\w+)\}/g;

export function t(key: TranslationKey, params: Params = {}): string {
  return common[key].replace(PLACEHOLDER, (match, name: string) => params[name] ?? match);
}
