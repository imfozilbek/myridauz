import type { Gender } from '@platform/contracts';
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

// G27: every path of every person, Toshkent → Samarqand (docs/76 … 82).
export const ULUGBEK: Person = { id: 900104, name: 'Ulugʻbek', phone: '998901110104' };
export const RUSTAM: Person = { id: 900105, name: 'Rustam', phone: '998901110105' };
export const NIGORA: Person = { id: 900106, name: 'Nigora', phone: '998901110106' };
export const BOBUR: Person = { id: 900107, name: 'Bobur', phone: '998901110107' };
export const AZIZA: Person = { id: 900231, name: 'Aziza', phone: '998901110231' };
export const FERUZA: Person = { id: 900232, name: 'Feruza', phone: '998901110232' };
export const MALIKA: Person = { id: 900233, name: 'Malika', phone: '998901110233' };
export const SEVARA: Person = { id: 900234, name: 'Sevara', phone: '998901110234' };
export const TIMUR: Person = { id: 900235, name: 'Timur', phone: '998901110235' };

type Driver = { readonly person: Person; readonly plate: string; readonly gender: Gender };
export const DRIVERS: readonly Driver[] = [
  { person: DRIVER, plate: '01A123BC', gender: 'male' },
  { person: BEKZOD, plate: '01B234CD', gender: 'male' },
  { person: SARDOR, plate: '01C345DE', gender: 'male' },
  { person: ULUGBEK, plate: '01D456EF', gender: 'male' },
  { person: RUSTAM, plate: '01E567FG', gender: 'male' },
  { person: NIGORA, plate: '01F678GH', gender: 'female' },
  { person: BOBUR, plate: '01G789HI', gender: 'male' },
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
  AZIZA,
  FERUZA,
  MALIKA,
  SEVARA,
];
// Men among the passengers: «Mashinada ayol bor» is about them (docs/06).
export const MEN: readonly Person[] = [TIMUR];
