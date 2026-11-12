import { ANSWER_NIGHT } from './bookings';
import { hourLabel } from './team-hours';

// G97 (docs/226): one list of the help for the bots, the Mini Apps and the site. The texts are the keys
// help.<topic>.<question>.q and .a; the numbers come from the brand with the live «Cheklovlar».
export const HELP_TOPICS = ['find', 'booking', 'driver', 'wallet', 'account'] as const;
export type HelpTopic = (typeof HELP_TOPICS)[number];

export const HELP_QUESTIONS = {
  find: ['how', 'none', 'price', 'taxi'],
  booking: ['how', 'wait', 'cancel', 'contact'],
  driver: ['need', 'check', 'when', 'returned'],
  wallet: ['fee', 'top_up', 'no_show'],
  account: ['phone', 'app', 'delete'],
} as const satisfies Readonly<Record<HelpTopic, readonly string[]>>;
export type HelpQuestion = { [T in HelpTopic]: `${T}.${(typeof HELP_QUESTIONS)[T][number]}` }[HelpTopic];

export const helpQuestions = (topic: HelpTopic): HelpQuestion[] =>
  HELP_QUESTIONS[topic].map((question) => `${topic}.${question}` as HelpQuestion);

const isTopic = (value: string): value is HelpTopic => (HELP_TOPICS as readonly string[]).includes(value);
// A question of a button or a link: «find.how»; anything else is no question.
export function helpQuestionOf(value: string): HelpQuestion | null {
  const [topic = '', question = ''] = value.split('.');
  if (!isTopic(topic)) return null;
  return (HELP_QUESTIONS[topic] as readonly string[]).includes(question) ? (value as HelpQuestion) : null;
}
export const helpTopicOf = (value: string): HelpTopic | null => (isTopic(value) ? value : null);

// The topics of a driver come first in the driver app; a passenger sees the trips first (docs/226).
const DRIVER_FIRST: readonly HelpTopic[] = ['driver', 'wallet', 'find', 'booking', 'account'];
export const helpTopicsFor = (app: 'passenger' | 'driver' | 'other'): readonly HelpTopic[] =>
  app === 'driver' ? DRIVER_FIRST : HELP_TOPICS;

// «Yordam» of a Mini App shows only the topics of its people (owner decision 12.11.2026): a passenger
// has no wallet and no fee, a driver books his own trips in the passenger app. Bots and the site keep all.
const APP_TOPICS: Readonly<Record<'passenger' | 'driver', readonly HelpTopic[]>> = {
  passenger: ['find', 'booking', 'driver', 'account'],
  driver: ['driver', 'wallet', 'account'],
};
export const appHelpTopics = (app: 'passenger' | 'driver'): readonly HelpTopic[] => APP_TOPICS[app];

// What the answers take from a brand: a BrandConfig fits it as it is.
export type HelpFacts = {
  readonly name: string;
  readonly bots: { readonly support: string; readonly driver: string };
  readonly promo: { readonly amount: number };
  readonly commission: { readonly percent: number; readonly minPerSeat: number };
  readonly moderation: { readonly hours: { readonly from: number; readonly to: number } };
  readonly bookings: { readonly answerHours: number };
  readonly schedule: { readonly meetMinutes: number };
};

export const helpValues = (facts: HelpFacts, formatMoney: (amount: number) => string) => ({
  brand: facts.name,
  supportBot: facts.bots.support,
  driverBot: facts.bots.driver,
  bonus: formatMoney(facts.promo.amount),
  percent: String(facts.commission.percent),
  minPerSeat: formatMoney(facts.commission.minPerSeat),
  from: hourLabel(facts.moderation.hours.from),
  to: hourLabel(facts.moderation.hours.to),
  hours: String(facts.bookings.answerHours),
  morning: hourLabel(ANSWER_NIGHT.morning),
  meetMinutes: String(facts.schedule.meetMinutes),
});
