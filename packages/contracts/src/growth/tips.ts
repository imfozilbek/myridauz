// The tips of a step in the bots (G70a, docs/232): a person who stopped on a step hears one soft tip
// with a button to its screen. p: a passenger, d: a driver; req: a request without offers.
export const TIP_STEPS = ['p2', 'p3', 'p10', 'req', 'd1', 'd2', 'd7', 'd4'] as const;
export type TipStep = (typeof TIP_STEPS)[number];
