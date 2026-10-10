// The taps of the main screen (G25): a trip of the block, the main button. The tiles of «Hamyon» and
// «Yordam» (G53).
// The block «Qayerdan / Qayerga» at the bottom of the main screen: its ends and ⇅ (G66).
export const HOME_TARGETS = [
  'item',
  'main_button',
  'retry',
  'wallet',
  'support',
  'dock_from',
  'dock_to',
  'dock_swap',
  // G66: the chat and the call of a trip, «Haydovchi boʻling».
  'trip_chat',
  'trip_call',
  'become_driver',
  // G76: the four tiles and the right part of the head (docs/165).
  'my_trips',
  'chats',
  'favorites',
  'side_photo',
  'side_look',
  'side_rating',
  'side_car',
  'dock_request',
  'dock_requests',
] as const;
