// A text column read back as one of the known values; a value no longer known is null.
export const oneOf = <T extends string>(values: readonly T[], value: string | null): T | null =>
  values.find((item) => item === value) ?? null;
