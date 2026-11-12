// The order of the regions of «Qayerga» for passengers and drivers alike (owner decision 12.11.2026,
// docs/118): never the own region, the busy ones first, the busiest on top, then this fixed order.
// Toshkent shahri leads the fixed order: from the regions most people go to the capital.
export const REGION_ORDER = [
  '1726', // Toshkent shahri
  '1710', // Qashqadaryo
  '1718', // Samarqand
  '1706', // Buxoro
  '1722', // Surxondaryo
  '1730', // Fargʻona
  '1703', // Andijon
  '1714', // Namangan
  '1733', // Xorazm
  '1712', // Navoiy
  '1708', // Jizzax
  '1724', // Sirdaryo
  '1727', // Toshkent viloyati
  '1735', // Qoraqalpogʻiston
] as const;

const fixedPlace = (region: string) => {
  const index = REGION_ORDER.findIndex((id) => id === region);
  return index === -1 ? REGION_ORDER.length : index;
};

// activity: how much happens toward each region (trips for a passenger, requests for a driver);
// home: the region of «Qayerdan»; places: only the regions the directory knows are shown.
export function regionOrder(
  activity: ReadonlyMap<string, number>,
  home: string,
  places: ReadonlyMap<string, unknown>,
): string[] {
  const busiest = [...activity]
    .filter(([, count]) => count > 0)
    .sort(([a, one], [b, other]) => other - one || fixedPlace(a) - fixedPlace(b))
    .map(([region]) => region);
  return [...new Set([...busiest, ...REGION_ORDER])].filter(
    (region) => region !== home && places.has(region),
  );
}
