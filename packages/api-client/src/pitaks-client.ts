import {
  ADMIN_PITAK_DIRECTIONS_PATH,
  ADMIN_PITAK_HISTORY_PATH,
  ADMIN_PITAKS_PATH,
  adminPitakPath,
  adminPitakSchema,
  adminPitaksSchema,
  pitakDirectionSchema,
  pitakHistorySchema,
  type AdminPitak,
  type PitakChange,
  type PitakDirection,
  type PitakInput,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The pitaks of the team in the admin Mini App (G24, docs/72).
export function createPitaksClient(options: SignedOptions) {
  const { request, post, putJson } = signedRequest(options);
  return {
    all: async () => adminPitaksSchema.parse(await (await request(ADMIN_PITAKS_PATH)).json()),
    add: async (input: PitakInput): Promise<AdminPitak> =>
      adminPitakSchema.parse(await (await post(ADMIN_PITAKS_PATH, input)).json()),
    change: async (id: string, input: PitakInput): Promise<AdminPitak> =>
      adminPitakSchema.parse(await (await putJson(adminPitakPath(id), input)).json()),
    direction: async (direction: PitakDirection): Promise<PitakDirection> =>
      pitakDirectionSchema.parse(await (await putJson(ADMIN_PITAK_DIRECTIONS_PATH, direction)).json()),
    history: async (): Promise<PitakChange[]> =>
      pitakHistorySchema.parse(await (await request(ADMIN_PITAK_HISTORY_PATH)).json()).changes,
  };
}

export type PitaksClient = ReturnType<typeof createPitaksClient>;
