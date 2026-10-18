import type { Car } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { UzPlate } from '../plate/uz-plate';
import './car-sketch.css';

// A headlight on the left; the right one is its mirror.
const LIGHT =
  'M42 124 Q42 116 52 116 L94 118 Q100 119 98 125 L95 131 Q93 135 87 135 L50 135 Q42 135 42 128 Z';

// The front photo before it is taken (owner decision 18.10.2026): the driver's own car drawn from the
// front, in its color, with its plate where the photo must show it. A drawing of the photo, not an icon.
export function CarSketch({ car }: { readonly car: Car }) {
  const { carColors, art } = useBrand().theme;
  const body = carColors[car.color] ?? art.slate;
  const edge = { stroke: art.slate, strokeWidth: 1.5 };
  return (
    <span className="car-sketch" aria-hidden>
      <svg viewBox="0 0 320 200">
        <ellipse cx="160" cy="187" rx="134" ry="9" fill={art.shadow} opacity="0.12" />
        <rect x="46" y="146" width="40" height="38" rx="9" fill={art.phone} />
        <rect x="234" y="146" width="40" height="38" rx="9" fill={art.phone} />
        <path d="M76 108 L90 66 Q96 49 118 47 L202 47 Q224 49 230 66 L244 108 Z" fill={body} {...edge} />
        <path d="M94 104 L104 70 Q108 57 123 56 L197 56 Q212 57 216 70 L226 104 Z" fill={art.skyGrey} />
        <path d="M112 100 L122 61 L146 61 L133 100 Z" fill={art.skyGreyLight} opacity="0.9" />
        <ellipse cx="60" cy="99" rx="13" ry="8" fill={body} {...edge} />
        <ellipse cx="260" cy="99" rx="13" ry="8" fill={body} {...edge} />
        <rect x="30" y="102" width="260" height="64" rx="22" fill={body} {...edge} />
        <path d="M58 112 Q160 104 262 112" fill="none" {...edge} opacity="0.6" />
        <path d={LIGHT} fill={art.skyGreyLight} {...edge} />
        <path d={LIGHT} transform="matrix(-1 0 0 1 320 0)" fill={art.skyGreyLight} {...edge} />
        <rect x="112" y="116" width="96" height="12" rx="6" fill={art.phone} {...edge} />
        <circle cx="62" cy="152" r="5" fill={art.skyGreyLight} {...edge} />
        <circle cx="258" cy="152" r="5" fill={art.skyGreyLight} {...edge} />
      </svg>
      <span className="car-sketch-plate">
        <UzPlate plate={car.plate} size="s" />
      </span>
    </span>
  );
}
