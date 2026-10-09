// The time buttons of an offer (G64, mockups g64/1 and g64/3): the free times of the day every two
// hours from the morning, three of them; «Boshqa» opens every time. 14:00, 16:00, 18:00 today after
// noon; 06:00, 08:00, 10:00 on another day.
const CHIPS = 3;
const MORNING = '06:00';
const EVERY_HOURS = 2;

export const offerTimes = (slots: readonly string[]): string[] =>
  slots
    .filter((slot) => slot >= MORNING && slot.endsWith(':00') && Number(slot.slice(0, 2)) % EVERY_HOURS === 0)
    .slice(0, CHIPS);
