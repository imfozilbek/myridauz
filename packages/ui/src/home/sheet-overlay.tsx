import { Modal } from '../components';
import { useBrand } from '../context/brand-context';

const SHADE = '35%';

// The shade under a sheet of the main screen (mockups g60/6, g60/7): the screen goes darker, not
// lighter like the default of the library. The sheet lives in a portal, so the colour comes inline.
export function SheetOverlay() {
  const { colors } = useBrand().theme;
  return (
    <Modal.Overlay style={{ background: `color-mix(in srgb, ${colors.scrim} ${SHADE}, transparent)` }} />
  );
}
