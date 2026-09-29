import type { Point } from '@platform/contracts';

// A point opens in the phone's map app: Yandex Maps is the one people use in Uzbekistan.
const ZOOM = 16;
export const mapUrl = ({ lat, lng }: Point) => `https://yandex.uz/maps/?pt=${lng},${lat}&z=${ZOOM}&l=map`;
