import type { CarColor, ChatAbout, Rating } from '@platform/contracts';

type Side = {
  readonly id: string;
  readonly firstName: string;
  readonly hasAvatar: boolean;
  // The car with its plate: the passenger sees whom they talk to (mockups g60/2, g64/4).
  readonly car: { readonly model: string; readonly color: CarColor; readonly plate: string | null } | null;
  // The passenger of a request, with the rating, for the driver (mockup g64/5).
  readonly rider: { readonly passenger: { readonly rating?: Rating | undefined } } | null;
};

// The other side of a chat (docs/07): the driver with the car for a passenger, the passenger for a
// driver. Before a booking, the sides of a talk about a request (G64, docs/118 path 7).
export function otherSide({ booking, request, role, driver, offer }: ChatAbout): Side | null {
  if (booking) {
    if (role !== 'passenger') return { ...booking.passenger, car: null, rider: null };
    const { id, firstName, hasAvatar, car } = booking.trip.driver;
    return { id, firstName, hasAvatar, car: { ...car, plate: booking.plate }, rider: null };
  }
  if (!request) return null;
  if (role === 'driver') return { ...request.passenger, car: null, rider: request };
  const person = driver ?? offer?.driver;
  return person ? { ...person, rider: null } : null;
}

export function otherName(about: ChatAbout): string | null {
  return otherSide(about)?.firstName ?? null;
}
