import { z } from 'zod';

// The waitlist (G83, docs/181): before the trips open, both sides say their direction and «when».
// One record a person and a role; it can be changed, and only the deletion of the data removes it.
export const WAITLIST_ROLES = ['passenger', 'driver'] as const;
export type WaitlistRole = (typeof WAITLIST_ROLES)[number];

// The pains of the market, v5 (owner's texts, 14.10.2026): each role in the order of its screen.
export const PAINS = ['chats', 'fixed', 'phone', 'wait', 'price', 'woman', 'empty', 'safety'] as const;
export type Pain = (typeof PAINS)[number];
export const ROLE_PAINS = {
  passenger: ['chats', 'fixed', 'phone', 'wait', 'price', 'woman'],
  driver: ['chats', 'fixed', 'phone', 'wait', 'empty', 'woman', 'safety'],
} as const satisfies Record<WaitlistRole, readonly Pain[]>;

// «Qachon»: how often the person goes, never a date (owner, 14.10.2026).
export const CADENCES = ['daily', 'weekly', 'monthly', 'holidays', 'once', 'sometimes'] as const;
export type Cadence = (typeof CADENCES)[number];
export const ROLE_CADENCES = {
  passenger: ['weekly', 'monthly', 'holidays', 'once'],
  driver: ['daily', 'weekly', 'monthly', 'sometimes'],
} as const satisfies Record<WaitlistRole, readonly Cadence[]>;

// The 14 regions by their SOATO codes, group after group of the map: neighbours stand side by side.
// The route is always Toshkent shahri and one region, both ways (owner, 14.10.2026).
export const TASHKENT_CITY = '1726';
export const MAP_GROUPS = ['tashkent', 'valley', 'center', 'south', 'west'] as const;
export type MapGroup = (typeof MAP_GROUPS)[number];
export const REGION_GROUPS = {
  tashkent: ['1726', '1727'],
  valley: ['1730', '1703', '1714'],
  center: ['1718', '1708', '1724', '1712', '1706'],
  south: ['1710', '1722'],
  west: ['1733', '1735'],
} as const satisfies Record<MapGroup, readonly string[]>;
export const WAITLIST_REGIONS: readonly string[] = MAP_GROUPS.flatMap((group) => REGION_GROUPS[group]);
export const regionSchema = z.string().refine((id) => WAITLIST_REGIONS.includes(id));
// The counter «N kishi kutmoqda» shows from 10 people: an empty counter scares (docs/181).
export const WAITLIST_MIN_COUNT = 10;

// The answers of the questionnaire. home: «Qaysi viloyatdansiz?»; region: the other end of the route,
// the same region for everyone but a person of Toshkent shahri, who answers «Qaysi viloyatga qatnaysiz?».
export const waitlistAnswersSchema = z
  .object({
    role: z.enum(WAITLIST_ROLES),
    pains: z.array(z.enum(PAINS)).min(1).max(PAINS.length),
    home: regionSchema,
    region: regionSchema,
    cadence: z.enum(CADENCES),
  })
  .refine(({ role, pains }) => pains.every((pain) => (ROLE_PAINS[role] as readonly Pain[]).includes(pain)))
  .refine(({ role, cadence }) => (ROLE_CADENCES[role] as readonly Cadence[]).includes(cadence))
  .refine(({ home, region }) => region !== TASHKENT_CITY && (home === TASHKENT_CITY || home === region));
export type WaitlistAnswers = z.infer<typeof waitlistAnswersSchema>;
