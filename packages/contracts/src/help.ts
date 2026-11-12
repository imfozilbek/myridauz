import { ANSWER_NIGHT } from './bookings';
import { hourLabel } from './team-hours';

// G97 (docs/226): one list of the help for the bots, the Mini Apps and the site. The texts are the keys
// help.<topic>.<question>.q and .a; the numbers come from the brand with the live «Cheklovlar».
// By role (owner decision 12.11.2026): the topics of a passenger (docs/230) and of a driver (docs/231).
const PASSENGER_TOPICS = ['basics', 'find', 'booking', 'request', 'ride_day', 'after', 'account'] as const;
const DRIVER_TOPICS = ['application', 'publish', 'riders', 'driver_day', 'wallet', 'driver_account'] as const;
// The support bot answers about itself too: when the team answers, what it takes (docs/231).
const SUPPORT_TOPIC = 'support';
export const HELP_TOPICS = [...PASSENGER_TOPICS, ...DRIVER_TOPICS, SUPPORT_TOPIC] as const;
export type HelpTopic = (typeof HELP_TOPICS)[number];

export const HELP_QUESTIONS = {
  basics: ['taxi', 'free', 'pay', 'price', 'checked'],
  find: ['how', 'none', 'ahead', 'pickup', 'range', 'woman'],
  booking: ['how', 'wait', 'refused', 'one', 'cancel', 'time'],
  request: ['what', 'offer', 'lasts', 'calls', 'cancel'],
  ride_day: ['meet', 'no_show', 'follow', 'arrived', 'marked'],
  after: ['lost', 'rate', 'complain', 'again'],
  account: ['phone', 'photo', 'alerts', 'app', 'delete', 'driver'],
  application: ['need', 'when', 'during', 'returned', 'car'],
  publish: ['how', 'when', 'count', 'price', 'change', 'cancel'],
  riders: ['booking', 'time', 'requests', 'contact', 'low'],
  driver_day: ['depart', 'meet', 'no_show', 'rate', 'complain', 'hidden'],
  wallet: ['fee', 'bonus', 'top_up', 'refund', 'no_show'],
  driver_account: ['phone', 'photo', 'blocked', 'delete'],
  support: ['when', 'media', 'who', 'phone'],
} as const satisfies Readonly<Record<HelpTopic, readonly string[]>>;
export type HelpQuestion = { [T in HelpTopic]: `${T}.${(typeof HELP_QUESTIONS)[T][number]}` }[HelpTopic];

// The questions marked [A] in docs/231: only while the application of a driver is not approved.
const BEFORE_APPROVAL: readonly HelpQuestion[] = [
  'application.need',
  'application.when',
  'application.during',
  'application.returned',
];

// The questions of a topic; an approved driver has no questions of the application left.
export const helpQuestions = (topic: HelpTopic, approved = false): HelpQuestion[] =>
  HELP_QUESTIONS[topic]
    .map((question) => `${topic}.${question}` as HelpQuestion)
    .filter((question) => !approved || !BEFORE_APPROVAL.includes(question));

const isTopic = (value: string): value is HelpTopic => (HELP_TOPICS as readonly string[]).includes(value);
// A question of a button or a link: «find.how»; anything else is no question.
export function helpQuestionOf(value: string): HelpQuestion | null {
  const [topic = '', question = ''] = value.split('.');
  if (!isTopic(topic)) return null;
  return (HELP_QUESTIONS[topic] as readonly string[]).includes(question) ? (value as HelpQuestion) : null;
}
export const helpTopicOf = (value: string): HelpTopic | null => (isTopic(value) ? value : null);

// Whose topics a person sees (docs/231): a passenger, a driver, or someone with no role yet, who
// sees the topics of a passenger and how to become a driver.
const AUDIENCES = ['passenger', 'driver', 'guest'] as const;
export type HelpAudience = (typeof AUDIENCES)[number];
export const helpAudienceOf = (value: string): HelpAudience | null =>
  (AUDIENCES as readonly string[]).includes(value) ? (value as HelpAudience) : null;

const TOPICS_OF: Readonly<Record<HelpAudience, readonly HelpTopic[]>> = {
  passenger: PASSENGER_TOPICS,
  driver: DRIVER_TOPICS,
  guest: [...PASSENGER_TOPICS, 'application'],
};
// The support bot adds «Yordam xizmati» to the topics of the person.
export const helpTopicsFor = (audience: HelpAudience, support = false): readonly HelpTopic[] =>
  support ? [...TOPICS_OF[audience], SUPPORT_TOPIC] : TOPICS_OF[audience];

// What the answers take from a brand: a BrandConfig fits it as it is.
export type HelpFacts = {
  readonly name: string;
  readonly bots: { readonly support: string };
  readonly promo: {
    readonly amount: number;
    readonly grants: number;
    readonly days: number;
    readonly windowDays: number;
  };
  readonly commission: { readonly percent: number; readonly minPerSeat: number };
  readonly moderation: { readonly hours: { readonly from: number; readonly to: number } };
  readonly bookings: { readonly answerHours: number };
  readonly schedule: {
    readonly meetMinutes: number;
    readonly daysAhead: number;
    readonly leadMinutes: number;
    readonly rangeMaxHours: number;
    readonly shiftMinutes: number;
    readonly autoDepartHours: number;
  };
  readonly calls: { readonly requestRings: number };
  readonly shares: { readonly followers: number };
  readonly chat: { readonly afterTripHours: number };
  readonly ratings: { readonly days: number };
  readonly complaints: { readonly days: number; readonly hideAfter: number; readonly windowDays: number };
};

export const helpValues = (facts: HelpFacts, formatMoney: (amount: number) => string) => ({
  brand: facts.name,
  supportBot: facts.bots.support,
  bonus: formatMoney(facts.promo.amount),
  bonusGrants: String(facts.promo.grants),
  bonusDays: String(facts.promo.days),
  bonusWindow: String(facts.promo.windowDays),
  percent: String(facts.commission.percent),
  minPerSeat: formatMoney(facts.commission.minPerSeat),
  from: hourLabel(facts.moderation.hours.from),
  to: hourLabel(facts.moderation.hours.to),
  hours: String(facts.bookings.answerHours),
  morning: hourLabel(ANSWER_NIGHT.morning),
  meetMinutes: String(facts.schedule.meetMinutes),
  daysAhead: String(facts.schedule.daysAhead),
  leadMinutes: String(facts.schedule.leadMinutes),
  rangeMaxHours: String(facts.schedule.rangeMaxHours),
  shiftMinutes: String(facts.schedule.shiftMinutes),
  autoDepartHours: String(facts.schedule.autoDepartHours),
  requestRings: String(facts.calls.requestRings),
  followers: String(facts.shares.followers),
  afterTripHours: String(facts.chat.afterTripHours),
  ratingDays: String(facts.ratings.days),
  complaintDays: String(facts.complaints.days),
  hideAfter: String(facts.complaints.hideAfter),
  complaintWindow: String(facts.complaints.windowDays),
});
