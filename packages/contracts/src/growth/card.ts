import type { ShareMoment } from './loops';

// The screen, the card, the chat message and the story of a moment say the same words
// (docs/123): the keys of its texts in the language files (growth.json of packages/i18n).
export function momentKeys(moment: ShareMoment, phrase: number) {
  return {
    title: `growth.title.${moment}`,
    lead: `growth.lead.${moment}`,
    whyTitle: `growth.why.${moment}.title`,
    whyText: `growth.why.${moment}.text`,
    phrase: `growth.phrase.${moment}.${phrase}`,
    fact: `growth.fact.${moment}`,
    link: `growth.link.${moment}`,
  } as const;
}

// The side of a moment: its card goes from the app of that side.
export const momentSide = (moment: ShareMoment) => (moment === 'driver' ? 'driver' : 'passenger');
