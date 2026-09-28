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
