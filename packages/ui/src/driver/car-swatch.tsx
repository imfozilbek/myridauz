import type { CarColor } from '@platform/contracts';
import { useBrand } from '../context/brand-context';

// A dot of the car's paint next to its name: the driver finds the color at a glance (docs/04).
export function CarSwatch({ color }: { readonly color: CarColor }) {
  const paint = useBrand().theme.carColors[color];
  return <span className="car-swatch" style={{ background: paint }} aria-hidden />;
}
