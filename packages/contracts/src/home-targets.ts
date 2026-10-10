// The taps of the main screen (G25): a trip of the block, the question card, the last route, the
// main button. The tiles of «Hamyon» and «Yordam» (G53).
// The block «Qayerdan / Qayerga» at the bottom of the main screen: its ends and ⇅ (G66).
export const HOME_TARGETS = [
  'item',
  'card',
  'last_route',
  'main_button',
  'retry',
  'wallet',
  'support',
  'dock_from',
  'dock_to',
  'dock_swap',
  // G66: the seat on the main screen, its chat and call, the way back, the row of drivers.
  'trip_chat',
  'trip_call',
  'come_back',
  'become_driver',
  // G76: the four tiles and the right part of the head (docs/165).
  'my_trips',
  'chats',
  'favorites',
  'side_photo',
  'side_look',
  'side_rating',
  'side_car',
] as const;
