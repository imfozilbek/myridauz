import { momentCount, momentKind, type MomentKind, type ShareMoment } from './loops';

// The screen, the card, the chat message and the story of a moment say the same words
// (docs/123): the keys of its texts in the language files (growth.json of packages/i18n).
type Group = 'join' | 'trip' | 'driver' | 'riders';
const GROUP = {
  join: 'join',
  trip1: 'trip',
  trips: 'trip',
  driver: 'driver',
  riders: 'riders',
} as const satisfies Record<MomentKind, Group>;
// A driver's benefit is the same at every moment: full seats share the cost of the road.
const WHY = { join: 'join', trip: 'trip', driver: 'driver', riders: 'driver' } as const;

export function momentKeys(moment: ShareMoment, phrase: number) {
  const kind = momentKind(moment);
  const group = GROUP[kind];
  return {
    title: `growth.title.${kind}`,
    lead: `growth.lead.${group}`,
    whyTitle: `growth.why.${WHY[group]}.title`,
    whyText: `growth.why.${WHY[group]}.text`,
    phrase: `growth.phrase.${kind}.${phrase}`,
    fact: `growth.fact.${group}`,
    link: `growth.link.${group}`,
  } as const;
}

// A driver's card has a second button: the start of the brand for a person who is new (docs/123).
export const isDriverMoment = (moment: ShareMoment) => WHY[GROUP[momentKind(moment)]] === 'driver';
// The side of a moment: its card goes from the app of that side.
export const momentSide = (moment: ShareMoment) => (isDriverMoment(moment) ? 'driver' : 'passenger');

// The values of every text of a moment: only true facts (docs/123, lesson 9).
export type MomentFacts = {
  readonly brand: string;
  readonly name: string;
  readonly from: string;
  readonly to: string;
  readonly people: number;
};
export const momentValues = (moment: ShareMoment, facts: MomentFacts) => ({
  ...facts,
  people: String(facts.people),
  count: String(momentCount(moment)),
});
