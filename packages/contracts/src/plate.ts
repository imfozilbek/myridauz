import { z } from 'zod';

// Uzbek plates (docs/50): a person "01 A 123 BC" or a company "01 123 ABC". Kept without spaces.
// Each place is a digit (D) or a Latin letter (L); the third place tells which kind it is.
const KINDS = {
  person: { places: 'DDLDDDLL', groups: [2, 1, 3, 2], example: '01 A 123 BC' },
  company: { places: 'DDDDDLLL', groups: [2, 3, 3], example: '01 123 ABC' },
} as const;
type PlateKind = keyof typeof KINDS;
const KIND_PLACE = 2;

// The region is 01 to 99: Tashkent 01 to 09 … Qoraqalpogʻiston 95 to 99; 00 is no region (G62, docs/50).
const PLATE_PATTERN = /^(?!00)\d{2}(?:[A-Z]\d{3}[A-Z]{2}|\d{3}[A-Z]{3})$/;
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

const REGION = 2;

// The region cell and the number of an Uzbek plate (G62, mockup g62/2-plate): the first two digits go
// to the region, the rest to the number; each part keeps the grey rest of its example.
export function plateParts(text: string) {
  const { value, ghost } = maskPlate(text);
  const example = value + ghost;
  const typedRegion = value.slice(0, REGION);
  const typedNumber = value.slice(REGION + 1);
  return {
    region: typedRegion,
    regionGhost: example.slice(typedRegion.length, REGION),
    number: typedNumber,
    numberGhost: example.slice(REGION + 1 + typedNumber.length),
  };
}
