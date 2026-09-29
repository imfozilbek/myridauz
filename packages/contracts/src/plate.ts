import { z } from 'zod';

// Uzbek plates (docs/50): a person "01 A 123 BC" or a company "01 123 ABC". Kept without spaces.
// Each place is a digit (D) or a Latin letter (L); the third place tells which kind it is.
const KINDS = {
  person: { places: 'DDLDDDLL', groups: [2, 1, 3, 2], example: '01 A 123 BC' },
  company: { places: 'DDDDDLLL', groups: [2, 3, 3], example: '01 123 ABC' },
} as const;
type PlateKind = keyof typeof KINDS;
const KIND_PLACE = 2;

const PLATE_PATTERN = /^\d{2}(?:[A-Z]\d{3}[A-Z]{2}|\d{3}[A-Z]{3})$/;
export const plateSchema = z
  .string()
  .transform((value) => value.toUpperCase().replace(/[\s-]/g, ''))
  .pipe(z.string().regex(PLATE_PATTERN));

const fits = (char: string, place: string | undefined) =>
  place === 'D' ? /\d/.test(char) : place === 'L' ? /[A-Z]/.test(char) : false;

function group(chars: string, kind: PlateKind): string {
  const parts: string[] = [];
  let start = 0;
  for (const size of KINDS[kind].groups) {
    if (start < chars.length) parts.push(chars.slice(start, start + size));
    start += size;
  }
  return parts.join(' ');
}

// What the driver typed, kept only where it fits the plate: small letters become capitals,
// a letter in a digit place (or the other way) is dropped, spaces are put in by themselves.
// The rest of the example ("ghost") shows what comes next.
export function maskPlate(text: string): { readonly value: string; readonly ghost: string } {
  let kind: PlateKind = 'person';
  let chars = '';
  for (const char of text.toUpperCase()) {
    if (chars.length === KIND_PLACE) kind = /\d/.test(char) ? 'company' : 'person';
    if (fits(char, KINDS[kind].places[chars.length])) chars += char;
  }
  const value = group(chars, kind);
  return { value, ghost: KINDS[kind].example.slice(value.length) };
}

// A plate is stored without spaces and shown in groups, as on the car: "01 A 123 BC", "10 123 ABC".
export const formatPlate = (plate: string): string => maskPlate(plate).value || plate;
