import {
  ADMIN_AD_LINKS_PATH,
  ADMIN_WAITLIST_PATH,
  ADMIN_WAITLIST_STATS_PATH,
  ADMIN_WAITLIST_SWITCH_PATH,
  adLinkSchema,
  adLinksSchema,
  adminAdLinkPath,
  adminWaitlistDirectionPath,
  adminWaitlistOpenPath,
  openingSchema,
  WAITLIST_INVITE_PATH,
  WAITLIST_PATH,
  waitlistDirectionSchema,
  waitlistInvitedSchema,
  waitlistMeSchema,
  waitlistOverviewSchema,
  waitlistStatsSchema,
  waitlistSwitchSchema,
  type AdLinkInput,
  type StatsPeriod,
  type WaitlistAnswers,
  type WaitlistRole,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The waitlist of G83 (docs/181 … 184): the questionnaire of the main bot, and the team's screens.
export function createWaitlistClient(options: SignedOptions) {
  const { request, post, putJson } = signedRequest(options);
  const read = async <T>(answer: Promise<Response>, schema: { parse: (value: unknown) => T }) =>
    schema.parse(await (await answer).json());
  return {
    // The first opening tells the source and the platform once (docs/116).
    open: (via: string | null, client: string | null) => {
      const query = new URLSearchParams({
        ...(via ? { via } : {}),
        ...(client ? { client } : {}),
      }).toString();
      return read(request(query ? `${WAITLIST_PATH}?${query}` : WAITLIST_PATH), waitlistMeSchema);
    },
    save: (answers: WaitlistAnswers) => read(putJson(WAITLIST_PATH, answers), waitlistMeSchema),
    invite: (role: WaitlistRole) => read(post(WAITLIST_INVITE_PATH, { role }), waitlistInvitedSchema),
    overview: () => read(request(ADMIN_WAITLIST_PATH), waitlistOverviewSchema),
    direction: (region: string) => read(request(adminWaitlistDirectionPath(region)), waitlistDirectionSchema),
    openDirection: (region: string) => read(post(adminWaitlistOpenPath(region), {}), openingSchema),
    stats: (period: StatsPeriod) =>
      read(request(`${ADMIN_WAITLIST_STATS_PATH}?period=${period}`), waitlistStatsSchema),
    switchState: () => read(request(ADMIN_WAITLIST_SWITCH_PATH), waitlistSwitchSchema),
    setSwitch: (open: boolean) => read(putJson(ADMIN_WAITLIST_SWITCH_PATH, { open }), waitlistSwitchSchema),
    adLinks: async () => (await read(request(ADMIN_AD_LINKS_PATH), adLinksSchema)).links,
    createAd: (input: AdLinkInput) => read(post(ADMIN_AD_LINKS_PATH, input), adLinkSchema),
    adLink: (code: string) => read(request(adminAdLinkPath(code)), adLinkSchema),
  };
}

export type WaitlistClient = ReturnType<typeof createWaitlistClient>;
