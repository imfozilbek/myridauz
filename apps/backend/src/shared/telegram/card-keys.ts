// The keys of the live trip cards (G68, docs/122): the passenger bot has one card per booking, the
// driver bot one per trip. A ring of another module answers them by these keys.
export const passengerTripCard = (bookingId: string) => `trip:${bookingId}`;
export const driverTripCard = (tripId: string) => `trip:${tripId}`;
// A request of a passenger has one card in the passenger bot until it is answered or burned.
export const passengerRequestCard = (requestId: string) => `request:${requestId}`;
