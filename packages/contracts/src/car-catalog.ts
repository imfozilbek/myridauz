// Cars people drive in Uzbekistan: the driver chooses from the list, "Boshqa" lets them type (docs/19).
// Brand and model names are the same in every language, so they are data, not translations.
export const CAR_CATALOG: Readonly<Record<string, readonly string[]>> = {
  Chevrolet: [
    'Cobalt',
    'Nexia',
    'Gentra',
    'Lacetti',
    'Spark',
    'Malibu',
    'Onix',
    'Tracker',
    'Captiva',
    'Damas',
  ],
  Kia: ['K5', 'Sportage', 'Seltos', 'Sonet', 'Carnival'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Creta', 'Santa Fe'],
  BYD: ['Song Plus', 'Chazor', 'Han', 'Seagull'],
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser'],
  Chery: ['Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 8'],
  Haval: ['Jolion', 'H6', 'Dargo'],
  Lada: ['Vesta', 'Granta', 'Largus'],
};

// Seats for passengers of the models that differ from the usual 4 (owner decision 30.09.2026).
// The smallest common version: a driver of a bigger one adds seats, a car never gets more than it has.
export const CAR_SEATS: Readonly<Record<string, number>> = {
  Damas: 6,
  Captiva: 6,
  Carnival: 6,
  'Tiggo 8': 6,
  Seagull: 3,
};
