import { useBrand } from '../context/brand-context';

// The line drawing of a region in the color of this Mini App (docs/118): the driver app amber,
// the others turquoise. Null when the brand has no region pictures.
export function useRegionArt(): (regionId: string) => string | null {
  const { regionPhotos, app } = useBrand();
  const folder = app === 'driver' ? 'driver' : 'passenger';
  return (regionId) =>
    regionPhotos ? `${import.meta.env.BASE_URL}regions/lines/${folder}/${regionId}.webp` : null;
}
