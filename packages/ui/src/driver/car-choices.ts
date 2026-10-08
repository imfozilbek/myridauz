import { CAR_CATALOG, carSchema, catalogSeats, MAX_SEATS, type CarInput } from '@platform/contracts';

export type CarName = { readonly make: string; readonly model: string };

// Most cars take 4 passengers: a typed car starts there, the driver may change it (G62).
const USUAL_SEATS = 4;

// A model of the list brings its seats and never goes above them; a typed car may go up to the app
// limit, the team checks the seats on the photo of the inside (docs/50).
export const seatsOf = (car: CarName): number => catalogSeats(car.make, car.model) ?? USUAL_SEATS;
export const seatLimit = (car: Partial<CarInput>): number =>
  catalogSeats(car.make ?? '', car.model ?? '') ?? MAX_SEATS;

const CATALOG_CARS: readonly CarName[] = Object.entries(CAR_CATALOG).flatMap(([make, models]) =>
  Object.keys(models).map((model) => ({ make, model })),
);

// «Boshqa ›» (G62): every word typed is a part of the make or the model, whatever the letter case.
export function findCars(query: string): CarName[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return CATALOG_CARS.filter((car) => {
    const name = `${car.make} ${car.model}`.toLowerCase();
    return words.every((word) => name.includes(word));
  });
}

// A car not in the list: the first word is the make, the rest the model, by the rule of the server.
export function typedCar(text: string): CarName | null {
  const [make = '', ...rest] = text.trim().split(/\s+/);
  const car = carSchema.pick({ make: true, model: true }).safeParse({ make, model: rest.join(' ') });
  return car.success ? car.data : null;
}

// A button of the list says the model, a typed car its make and model (mockup g62/1, screen 2).
export const carLabel = (car: CarName): string =>
  catalogSeats(car.make, car.model) === undefined ? `${car.make} ${car.model}` : car.model;
