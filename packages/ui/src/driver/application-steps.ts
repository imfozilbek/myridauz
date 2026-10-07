// The two screens of the application (G62, docs/118 path 5): the car, then its photos.
const STEPS = ['car', 'photos'] as const;
export type Step = (typeof STEPS)[number];

export const isStep = (value: unknown): value is Step => STEPS.some((step) => step === value);
