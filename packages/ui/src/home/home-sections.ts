import { DriverChatsScreen, PassengerChatsScreen } from '../chats/role-chats';
import { FavoritesScreen } from '../comfort/favorites-screen';
import type { StartAction } from '../flow/start-action';
import { FAVORITES_SECTION } from './passenger-tiles';
import { HelpScreen } from '../help/help-screen';
import { CHATS_SECTION, HELP_SECTION } from './shared-tiles';

// The sections opened only by the tiles of the main screens (G76, docs/165), never drawn as tiles.
const chats = (Screen: StartAction['Screen']): StartAction => ({
  id: CHATS_SECTION,
  icon: 'chat',
  tone: 'brand',
  labelKey: 'home.chats.title',
  hintKey: 'home.chats.title',
  Screen,
});

// «Yordam» of both roles (G97, docs/226): the answers first, «Boshqa savolim bor» to the team.
const help: StartAction = {
  id: HELP_SECTION,
  icon: 'help',
  tone: 'brand',
  labelKey: 'help.title',
  hintKey: 'help.title',
  Screen: HelpScreen,
};

export const PASSENGER_TILE_SECTIONS: readonly StartAction[] = [
  chats(PassengerChatsScreen),
  help,
  {
    id: FAVORITES_SECTION,
    icon: 'favorite',
    tone: 'brand',
    labelKey: 'comfort.favorites.title',
    hintKey: 'comfort.favorites.title',
    Screen: FavoritesScreen,
  },
];

export const DRIVER_TILE_SECTIONS: readonly StartAction[] = [chats(DriverChatsScreen), help];
