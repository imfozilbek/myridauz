// Port: the use case gets time from outside, so tests control it (docs/11).
export type Clock = {
  now(): Date;
};
