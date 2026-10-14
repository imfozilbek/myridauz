const PERCENT = 100;

// The percent of a part in a whole, whole numbers; nothing in a whole of zero (docs/183).
export const shareOf = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * PERCENT);
