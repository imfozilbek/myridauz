import type { CarModels } from './car-models';

// Cars of the Uzbek plants and their old names: Chevrolet, Daewoo, Ravon (UzAuto Motors).
export const GM_CARS: Readonly<Record<string, CarModels>> = {
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
    Monza: 4,
    Orlando: 6,
    Epica: 4,
    Menlo: 4,
    Cruze: 4,
    Aveo: 4,
    Trailblazer: 6,
  },
  Daewoo: {
    Nexia: 4,
    Matiz: 4,
    Tico: 4,
    Damas: 6,
    Lanos: 4,
    Espero: 4,
  },
  Ravon: {
    R2: 4,
    R3: 4,
    R4: 4,
    Gentra: 4,
  },
};
