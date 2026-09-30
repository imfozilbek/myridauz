// Templates come from the translations in data attributes: the script has no text of its own.
export const fill = (template: string, key: string, value: string) => template.replace(`{${key}}`, value);

export function groupThousands(value: number, separator: string) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/gu, separator);
}
