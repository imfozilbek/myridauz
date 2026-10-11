// The clock of the stand at another hour (pnpm stand:check --at, G77): now and a new Date without a
// moment move by the shift; timers and every other use of Date stay as they are. The same function
// moves the clock of the Worker of the stand (scripts/stand/shift-clock.mjs) and of its pages
// (e2e/test-clock.ts), so all of the stand lives at one hour.
export function shiftDate(shift: number): void {
  const RealDate = Date;
  class StandDate extends RealDate {
    constructor(...moment: readonly (string | number | Date)[]) {
      super(...((moment.length === 0 ? [RealDate.now() + shift] : moment) as [number]));
    }

    static override now(): number {
      return RealDate.now() + shift;
    }
  }
  globalThis.Date = StandDate as DateConstructor;
}
