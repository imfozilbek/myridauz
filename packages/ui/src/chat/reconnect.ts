// A dropped chat comes back by itself (docs/65 B7): the next try waits a little longer each time.
// After the last one the screen shows the error with "Qayta urinish" and "Back".
const DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

export const reconnectDelay = (failures: number): number | null => DELAYS_MS[failures] ?? null;
