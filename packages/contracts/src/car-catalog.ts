// Cars people drive in Uzbekistan: the driver chooses from the list, "Boshqa" lets them type (docs/19).
// Brand and model names are the same in every language, so they are data, not translations.
// Each model has its seats for passengers: the biggest common version (owner decision 30.09.2026).
// A trip offers from 1 to these seats, the team checks them on the photo of the interior (docs/50).
type Models = Readonly<Record<string, number>>;

export const CAR_CATALOG: Readonly<Record<string, Models>> = {
  Chevrolet: {
    Cobalt: 4,
    Nexia: 4,
    Gentra: 4,
    Lacetti: 4,
    Spark: 4,
    Matiz: 4,
    Damas: 6,
    Malibu: 4,
    Onix: 4,
    Tracker: 4,
    Equinox: 4,
    Captiva: 6,
    Traverse: 7,
    Tahoe: 7,
  },
  Daewoo: { Nexia: 4, Matiz: 4, Tico: 4 },
  Ravon: { R2: 4, R3: 4, R4: 4, Gentra: 4 },
  Kia: { K5: 4, K8: 4, Rio: 4, Seltos: 4, Sonet: 4, Sportage: 4, Sorento: 6, Carnival: 7 },
  Hyundai: { Accent: 4, Elantra: 4, Sonata: 4, Creta: 4, Tucson: 4, 'Santa Fe': 6, Palisade: 7, Staria: 7 },
  BYD: { Seagull: 3, 'Qin Plus': 4, Chazor: 4, Han: 4, 'Yuan Plus': 4, 'Song Plus': 4, Tang: 6 },
  Chery: { 'Tiggo 2': 4, 'Tiggo 4': 4, 'Tiggo 7': 4, 'Tiggo 8': 6, 'Arrizo 8': 4 },
  Haval: { Jolion: 4, H6: 4, M6: 4, Dargo: 4 },
  Toyota: { Corolla: 4, Camry: 4, RAV4: 4, Highlander: 6, Prado: 6, 'Land Cruiser': 6 },
  Lada: { Granta: 4, Vesta: 4, Niva: 4, Largus: 6 },
};

// The first screen: the cars most people have, chosen by one tap without the make.
export const POPULAR_CARS: readonly { readonly make: string; readonly model: string }[] = [
  { make: 'Chevrolet', model: 'Cobalt' },
  { make: 'Chevrolet', model: 'Nexia' },
  { make: 'Chevrolet', model: 'Gentra' },
  { make: 'Chevrolet', model: 'Lacetti' },
  { make: 'Chevrolet', model: 'Spark' },
  { make: 'Chevrolet', model: 'Damas' },
];

// Seats of a model from the list; a name typed after "Boshqa" has none, the driver answers.
export const catalogSeats = (make: string, model: string): number | undefined => CAR_CATALOG[make]?.[model];
