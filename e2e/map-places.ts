// Places of the search by name (G23) as the index has them: real names inside the piece of the map,
// and the home of the passenger in Samarqand (G24).
export const FOUND = [
  {
    name: 'Mustaqillik maydoni',
    kind: 'transport',
    area: 'Yakkasaroy',
    district: '1726287',
    point: { lat: 41.31495, lng: 69.27107 },
  },
  {
    name: 'Registon maydoni',
    kind: 'place',
    area: 'Samarqand shahri',
    district: '1718401',
    point: { lat: 39.6547, lng: 66.9758 },
  },
];
// The point the map asks the name of: «at=lat,lng».
export const pinOf = (url: string) => (new URL(url).searchParams.get('at') ?? '').split(',').map(Number);
// The map flies to a found place and, landed, asks the name under the pin there (G24). A slow machine
// flies longer: a test waits for this ask, never for a time (lesson 257). As near as `closeTo(…, 5)`.
const NEAR_DEGREES = 5e-6;
const near = (a = NaN, b = NaN) => Math.abs(a - b) < NEAR_DEGREES;
export function landedOn(url: string, name: string) {
  const [lat, lng] = pinOf(url);
  const place = FOUND.find((each) => each.name === name)?.point;
  return url.includes('/map/where?') && near(lat, place?.lat) && near(lng, place?.lng);
}
