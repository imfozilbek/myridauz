import { DriverChatsScreen, PassengerChatsScreen } from '../chats/role-chats';
import { FavoritesScreen } from '../comfort/favorites-screen';
import type { StartAction } from '../flow/start-action';
import { FAVORITES_SECTION } from './passenger-tiles';
import { CHATS_SECTION } from './shared-tiles';

// The sections opened only by the tiles of the main screens (G76, docs/165), never drawn as tiles.
const chats = (Screen: StartAction['Screen']): StartAction => ({
  id: CHATS_SECTION,
  icon: 'chat',
  tone: 'brand',
  labelKey: 'home.chats.title',
  hintKey: 'home.chats.title',
  Screen,
});

export const PASSENGER_TILE_SECTIONS: readonly StartAction[] = [
  chats(PassengerChatsScreen),
  {
    id: FAVORITES_SECTION,
    icon: 'favorite',
    tone: 'brand',
    labelKey: 'comfort.favorites.title',
    hintKey: 'comfort.favorites.title',
    Screen: FavoritesScreen,
  },
];

export const DRIVER_TILE_SECTIONS: readonly StartAction[] = [chats(DriverChatsScreen)];
