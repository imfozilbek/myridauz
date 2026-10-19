import { fontStack } from '@platform/brands';
import { useBrand } from '../context/brand-context';

// The font of a picture (story, moment, QR, trip card): the font of the brand, as on the screens (G73).
// A canvas draws a web font only once it is loaded: both weights are asked for before it draws.
const WEIGHTS = ['400', '700'];

export function usePictureFont(): () => Promise<string> {
  const { font } = useBrand().theme;
  return async () => {
    if ('fonts' in document)
      await Promise.all(WEIGHTS.map((weight) => document.fonts.load(`${weight} 16px "${font}"`)));
    return fontStack(font);
  };
}
