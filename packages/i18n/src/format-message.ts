import { IntlMessageFormat } from 'intl-messageformat';

export type MessageValues = Readonly<Record<string, string | number>>;

const cache = new Map<string, IntlMessageFormat>();

// ICU MessageFormat: placeholders and plural forms (docs/13).
export function formatMessage(pattern: string, locale: string, values: MessageValues = {}): string {
  const cacheKey = `${locale}\u0000${pattern}`;
  let format = cache.get(cacheKey);
  if (!format) {
    format = new IntlMessageFormat(pattern, locale);
    cache.set(cacheKey, format);
  }
  return String(format.format(values));
}
