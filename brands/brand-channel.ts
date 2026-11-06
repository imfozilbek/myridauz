// A channel of a direction (docs/63, docs/176): a private channel the bot posts to by its chat number,
// the places of its name for the texts, the plate code of its region (docs/36) and the SOATO codes of
// the districts and cities its posts are for.
export type BrandChannel = {
  readonly chat: string;
  readonly title: string;
  // The name the channel has in Telegram, as it is: the apps and the site show it (owner 13.10.2026).
  readonly name: string;
  readonly code: string;
  readonly places: readonly string[];
  // The big town that opens the name: the channel only passes it, its own channel is another one.
  readonly hubs?: readonly string[];
  // The invite link: a private channel has no public name.
  readonly link: string;
  // The page of the direction on the site: its picture shows above the board of the day (G68).
  readonly page?: string;
  // A group of the direction in place of its channel (owner, 04.11.2026, docs/222): the trip posts go
  // there as to a channel; its name, avatar, welcome and pin are the group's own, no board of the day.
  readonly group?: boolean;
};

// The cards of a direction group in the group's own look (owner, 05.11.2026, docs/223): the R of the
// brand's emoji set beside the head, amber on a trip, turquoise on a request (ids of Telegram custom
// emoji: the owner of the bot has Telegram Premium); cyrillic: the cards are in Uzbek Cyrillic, as the
// group's own cards. tiles: the turquoise emoji of a request card, as the group's own request cards
// show them (owner, 06.11.2026: «максимально похож»); without them the plain emoji.
export type GroupCards = {
  readonly cyrillic: boolean;
  readonly marks: { readonly trip: string; readonly request: string };
  readonly tiles?: RequestTiles;
};
type RequestTiles = {
  readonly hand: string;
  readonly finish: string;
  readonly clock: string;
  readonly people: string;
  readonly money: string;
};
