// Cars people drive in Uzbekistan: the driver chooses from the list, "Boshqa" lets them type (docs/19).
// Brand and model names are the same in every language, so they are data, not translations.
// The longest list of makes and models (owner decision 12.11.2026), kept by groups in their files.
import { ASIAN_CARS } from './car-catalog-asia';
import { CHINESE_CARS } from './car-catalog-china';
import { CHINESE_CARS_2 } from './car-catalog-china-2';
import { WESTERN_CARS } from './car-catalog-europe';
import { GM_CARS } from './car-catalog-gm';
import type { CarModels } from './car-models';

export const CAR_CATALOG: Readonly<Record<string, CarModels>> = {
  ...GM_CARS,
  ...ASIAN_CARS,
  ...CHINESE_CARS,
  ...CHINESE_CARS_2,
  ...WESTERN_CARS,
};

// The buttons of «Mashinangiz»: the cars most people have, chosen by one tap without the make (G62).
export const POPULAR_CARS: readonly { readonly make: string; readonly model: string }[] = [
  { make: 'Chevrolet', model: 'Cobalt' },
  { make: 'Chevrolet', model: 'Nexia' },
  { make: 'Chevrolet', model: 'Gentra' },
  { make: 'Chevrolet', model: 'Lacetti' },
  { make: 'Chevrolet', model: 'Spark' },
  { make: 'Chevrolet', model: 'Damas' },
  { make: 'Chevrolet', model: 'Malibu' },
];

// Seats of a model from the list; a name typed after "Boshqa" has none, the driver answers.
export const catalogSeats = (make: string, model: string): number | undefined => CAR_CATALOG[make]?.[model];
