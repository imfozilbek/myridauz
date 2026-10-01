import { STAND_OWNER_ID } from '../../scripts/stand/paths.ts';
import type { Person } from './stand-kit';

// The people of the stand (docs/75). Each goal has its own driver and route, so the scenarios of
// one goal never see the trips of another.
export const OWNER: Person = { id: STAND_OWNER_ID, name: 'Ali', phone: '998900000001' };

// G26: the search by lists, Toshkent → Urgut.
export const DRIVER: Person = { id: 900101, name: 'Jasur', phone: '998901110101' };
export const NODIRA: Person = { id: 900201, name: 'Nodira', phone: '998901110201' };
export const MADINA: Person = { id: 900202, name: 'Madina', phone: '998901110202' };
export const DILNOZA: Person = { id: 900203, name: 'Dilnoza', phone: '998901110203' };

// G21: clear screens, Toshkent → Fargʻona.
export const BEKZOD: Person = { id: 900102, name: 'Bekzod', phone: '998901110102' };
export const ZARINA: Person = { id: 900211, name: 'Zarina', phone: '998901110211' };

// G24: the requests near the way and the map of the trip, Toshkent → Buxoro.
export const SARDOR: Person = { id: 900103, name: 'Sardor', phone: '998901110103' };
export const KAMOLA: Person = { id: 900221, name: 'Kamola', phone: '998901110221' };
export const LOLA: Person = { id: 900222, name: 'Lola', phone: '998901110222' };
export const SHAHNOZA: Person = { id: 900223, name: 'Shahnoza', phone: '998901110223' };
export const GULNORA: Person = { id: 900224, name: 'Gulnora', phone: '998901110224' };

export const DRIVERS: readonly { person: Person; plate: string }[] = [
  { person: DRIVER, plate: '01A123BC' },
  { person: BEKZOD, plate: '01B234CD' },
  { person: SARDOR, plate: '01C345DE' },
];
export const PASSENGERS: readonly Person[] = [
  NODIRA,
  MADINA,
  DILNOZA,
  ZARINA,
  KAMOLA,
  LOLA,
  SHAHNOZA,
  GULNORA,
];
