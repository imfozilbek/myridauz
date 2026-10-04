import type { Gender } from '@platform/contracts';
import { STAND_OWNER_ID } from '../../scripts/stand/paths.ts';
import type { Person } from './stand-kit';

// The people of the stand (docs/75). Each goal has its own driver and route, so the scenarios of
// one goal never see the trips of another.
export const OWNER: Person = { id: STAND_OWNER_ID, name: 'Ali', phone: '998900000001' };
// A moderator of the team (G27, docs/79): made in the database of the stand, as the owner's button does.
export const KAMRON: Person = { id: 900301, name: 'Kamron', phone: '998901110301' };

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
export const OYBEK: Person = { id: 900108, name: 'Oybek', phone: '998901110108' };
export const JAHONGIR: Person = { id: 900109, name: 'Jahongir', phone: '998901110109' };
export const GAYRAT: Person = { id: 900110, name: 'Gʻayrat', phone: '998901110110' };
export const KOMIL: Person = { id: 900111, name: 'Komil', phone: '998901110111' };
// The walk through every screen (e2e/stand/all-*.spec.ts).
export const MUROD: Person = { id: 900112, name: 'Murod', phone: '998901110112' };
// The driver of the admin walk only: the trips of Jahongir stay under the limit (lesson 63).
export const SHERZOD: Person = { id: 900113, name: 'Sherzod', phone: '998901110113' };
// G35: the second trip on the route, for a passenger who went before (docs/97 K4, K5).
export const DOSTON: Person = { id: 900114, name: 'Doston', phone: '998901110114' };
// G36: the screen of a point, Toshkent → Guliston (docs/100): two trips, the second by the last place.
export const ELYOR: Person = { id: 900115, name: 'Elyor', phone: '998901110115' };
export const FARRUX: Person = { id: 900116, name: 'Farrux', phone: '998901110116' };
// G37: the requests of a passenger and the search of a driver, Toshkent → Termiz (docs/101).
export const HUMOYUN: Person = { id: 900117, name: 'Humoyun', phone: '998901110117' };
// G39: the driver moves the time and lowers the price, Toshkent → Andijon (docs/104).
export const ANVAR: Person = { id: 900118, name: 'Anvar', phone: '998901110118' };
export const AZIZA: Person = { id: 900231, name: 'Aziza', phone: '998901110231' };
export const FERUZA: Person = { id: 900232, name: 'Feruza', phone: '998901110232' };
export const MALIKA: Person = { id: 900233, name: 'Malika', phone: '998901110233' };
export const SEVARA: Person = { id: 900234, name: 'Sevara', phone: '998901110234' };
export const TIMUR: Person = { id: 900235, name: 'Timur', phone: '998901110235' };
// Leave Rida in a scenario: one deletes the account, one is blocked (docs/81 F07, F08).
export const LAZIZA: Person = { id: 900236, name: 'Laziza', phone: '998901110236' };
export const DIYORA: Person = { id: 900237, name: 'Diyora', phone: '998901110237' };
export const NARGIZA: Person = { id: 900238, name: 'Nargiza', phone: '998901110238' };
// The screens of a driver show her seat and her request (e2e/stand/screens-driver.spec.ts).
export const ROZA: Person = { id: 900239, name: 'Roza', phone: '998901110239' };
// Blocked by the team in the scenarios of the bots (e2e/stand/bots.spec.ts).
export const SANJAR: Person = { id: 900240, name: 'Sanjar', phone: '998901110240' };
export const ZEBO: Person = { id: 900241, name: 'Zebo', phone: '998901110241' };

type Driver = { readonly person: Person; readonly plate: string; readonly gender: Gender };
export const DRIVERS: readonly Driver[] = [
  { person: DRIVER, plate: '01A123BC', gender: 'male' },
  { person: BEKZOD, plate: '01B234CD', gender: 'male' },
  { person: SARDOR, plate: '01C345DE', gender: 'male' },
  { person: ULUGBEK, plate: '01D456EF', gender: 'male' },
  { person: RUSTAM, plate: '01E567FG', gender: 'male' },
  { person: NIGORA, plate: '01F678GH', gender: 'female' },
  { person: BOBUR, plate: '01G789HI', gender: 'male' },
  { person: OYBEK, plate: '01H890IJ', gender: 'male' },
  { person: JAHONGIR, plate: '01I901JK', gender: 'male' },
  { person: GAYRAT, plate: '01J012KL', gender: 'male' },
  { person: KOMIL, plate: '01K123MN', gender: 'male' },
  { person: MUROD, plate: '01L234NO', gender: 'male' },
  { person: SHERZOD, plate: '01M345PQ', gender: 'male' },
  { person: DOSTON, plate: '01N456QR', gender: 'male' },
  { person: ELYOR, plate: '01O567ST', gender: 'male' },
  { person: FARRUX, plate: '01P678TU', gender: 'male' },
  { person: HUMOYUN, plate: '01Q789UV', gender: 'male' },
  { person: ANVAR, plate: '01R890VW', gender: 'male' },
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
  LAZIZA,
  DIYORA,
  NARGIZA,
  ROZA,
  ZEBO,
];
// Men among the passengers: «Mashinada ayol bor» is about them (docs/06).
export const MEN: readonly Person[] = [TIMUR, SANJAR];
