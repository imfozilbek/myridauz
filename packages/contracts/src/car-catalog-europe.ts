import type { CarModels } from './car-models';

// European, American and Russian cars.
export const WESTERN_CARS: Readonly<Record<string, CarModels>> = {
  Volkswagen: {
    Polo: 4,
    Jetta: 4,
    Passat: 4,
    Tiguan: 4,
    Touareg: 4,
    Teramont: 6,
    ID3: 4,
    ID4: 4,
    ID6: 6,
  },
  Skoda: {
    Octavia: 4,
    Rapid: 4,
    Kodiaq: 6,
  },
  'Mercedes-Benz': {
    'C-Class': 4,
    'E-Class': 4,
    'S-Class': 4,
    GLE: 4,
    GLS: 6,
    'V-Class': 7,
    Vito: 7,
  },
  BMW: {
    '3 Series': 4,
    '5 Series': 4,
    '7 Series': 4,
    X3: 4,
    X5: 4,
    X7: 6,
  },
  Audi: {
    A4: 4,
    A6: 4,
    Q5: 4,
    Q7: 6,
  },
  Tesla: {
    'Model 3': 4,
    'Model Y': 4,
    'Model S': 4,
    'Model X': 5,
  },
  Ford: {
    Focus: 4,
    Explorer: 6,
  },
  Renault: {
    Logan: 4,
    Sandero: 4,
    Duster: 4,
  },
  Lada: {
    Granta: 4,
    Vesta: 4,
    Niva: 4,
    Largus: 6,
    Priora: 4,
    Kalina: 4,
    XRAY: 4,
    '2107': 4,
    '2106': 4,
    '2114': 4,
  },
  UAZ: {
    Patriot: 4,
    Hunter: 4,
  },
};
