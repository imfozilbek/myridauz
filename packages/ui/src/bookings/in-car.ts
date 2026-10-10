import { MINUTE_MS, type Booking } from '@platform/contracts';

// The passenger is in the car (G76, owner decision 10.10.2026, docs/43): the driver marked «Keldi»,
// or the time of the trip passed by the minutes of the meeting without «Kelmadi», so a driver who
// forgot the mark never leaves the passenger without «Yetib keldim».
export const inCar = (booking: Booking, now: number, meetMinutes: number) =>
  booking.boardedAt !== null ||
  (booking.noShowAt === null && now >= booking.trip.departAt + meetMinutes * MINUTE_MS);
