// Everything that differs between brands (docs/22). Code reads brands only through these types.
import type { AppName, BrandTheme } from './brand-theme';
import type { PeopleRules } from './people-rules';

export type { AppName, BrandColors, BrandTheme, HexColor } from './brand-theme';

// How the recommended price is counted (docs/23): one strategy today.
type PricingStrategy = 'per-km';

// The driver's commission for a confirmed booking (docs/12): a percent of the price, per seat,
// never less than the minimum per seat. Whole sums.
export type CommissionRule = { readonly percent: number; readonly minPerSeat: number };

// The welcome bonus (docs/12, questions 27 and 28): each grant lives some days; the next one comes
// only when the previous one is spent, and only within the window after the approval.
export type PromoRule = {
  readonly amount: number;
  readonly grants: number;
  readonly days: number;
  readonly windowDays: number;
};

// Signals to the admin bot (docs/29): errors of the last hour against the usual hour, the drop
// of a funnel step today against the week. The same signal again only after repeatHours.
export type AlertRules = {
  readonly errorGrowth: number;
  readonly minErrors: number;
  readonly dropGrowth: number;
  readonly minPeople: number;
  readonly repeatHours: number;
};

// Voice calls (docs/08): an unanswered ring ends after ringSeconds, a call whose voice did not
// connect ends after connectSeconds; then the chat takes over. A ring first opens the Mini App of the
// callee (docs/115); the bot calls them in only if they are still not in the chat after inviteSeconds.
// requestRings: a driver rings a passenger about one request at most so many times before a booking
// (G64, docs/127); the owner changes it (docs/128).
type CallRules = {
  readonly ringSeconds: number;
  readonly connectSeconds: number;
  readonly inviteSeconds: number;
  readonly requestRings: number;
};

// The sounds of the brand (docs/115): each set has brands/<brand>/public/sounds/<set>-ring.wav (one
// loop) and <set>-notify.wav; the owner picks the set in the admin Mini App, until then the default.
type SoundRules = { readonly sets: readonly string[]; readonly defaultSet: string };

// Driver applications (G34, docs/50): team hours [from, to) in Tashkent; waiting ones remind, then the owner.
type ModerationRules = {
  readonly hours: { readonly from: number; readonly to: number };
  readonly remindMinutes: number;
  readonly ownerMinutes: number;
};

// When a driver may leave (G38, docs/103): at least leadMinutes after making the trip and at most
// daysAhead; another day opens at defaultTime; one live trip (docs/172). A trip moves at most
// shiftMinutes later (G39); the meeting opens meetMinutes before the departure (docs/126); the Cron
// departs a trip autoDepartHours after its time.
// The way back after a trip leaves today when it can at returnUntil the latest, else the next morning.
type ScheduleRules = {
  readonly leadMinutes: number;
  readonly daysAhead: number;
  readonly defaultTime: string;
  readonly shiftMinutes: number;
  readonly meetMinutes: number;
  readonly autoDepartHours: number;
  readonly returnUntil: string;
};

// The party of the legal documents (docs/30): requisites from the admin Mini App (G34).
type Company = { readonly email: string };

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
};

export type BrandConfig = PeopleRules & {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  // Search engines read the site (docs/60); the site of the internal environment stays out (docs/179).
  readonly indexed: boolean;
  readonly slogan: string;
  readonly monetization: 'commission'; // model A of docs/12; a subscription (B) comes as a new value
  readonly commission: CommissionRule;
  readonly promo: PromoRule;
  readonly theme: BrandTheme;
  // Photos of the 14 regions in public/regions (docs/48); the apps show their drawings (docs/118).
  readonly regionPhotos: boolean;
  readonly app?: AppName; // set by brandForApp: the colors and the drawings of one Mini App
  // Telegram usernames of the bots (docs/02, docs/46): deep links between them; support answers people (docs/50).
  readonly bots: {
    readonly passenger: string;
    readonly driver: string;
    readonly admin: string;
    readonly support: string;
    // The main bot of the waitlist and its questionnaire (G83, docs/181).
    readonly main: string;
  };
  // Telegram channels of the directions (docs/15, docs/176): a trip goes to the channels of each end.
  readonly channels: readonly BrandChannel[];
  // The public main channel, without "@": a guide to every channel of the directions (docs/176).
  readonly mainChannel: string;
  // New trips go to the channels (docs/15): the deploy sets CHANNEL_POSTS of the Worker by it (docs/179).
  readonly posts: boolean;
  readonly pricing: PricingStrategy;
  readonly alerts: AlertRules;
  readonly calls: CallRules;
  readonly sounds: SoundRules;
  readonly moderation: ModerationRules;
  readonly company: Company;
  readonly schedule: ScheduleRules;
};

// The environments of a brand (owner, 13.10.2026, docs/179): the internal one of the team and production.
export type EnvironmentName = 'internal' | 'production';
// What differs between them: the name, the address, the bots, the channels. The rest is one for both.
export type BrandEnvironment = Pick<
  BrandConfig,
  'name' | 'domain' | 'indexed' | 'bots' | 'channels' | 'mainChannel' | 'posts'
>;
export type BrandBase = Omit<BrandConfig, keyof BrandEnvironment>;
