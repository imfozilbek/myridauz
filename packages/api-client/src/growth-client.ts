import {
  LOOP_CARD_PATH,
  MOMENT_CARD_PATH,
  MOMENT_OFFERED_PATH,
  MOMENT_PATH,
  MOMENT_STORY_PATH,
  momentSchema,
  momentStorySchema,
  MY_GROWTH_PATH,
  myGrowthSchema,
  preparedCardSchema,
  type LoopCard,
  type Moment,
  type MyGrowth,
  type PreparedCard,
  type ShareMoment,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The loops of growth (G69, docs/123): the moment of «Men Rida bilan», its cards for a chat and a
// story, the cards of a request and of free seats, «Sizning taʼsiringiz».
export function createGrowthClient(options: SignedOptions) {
  const { request, post, put } = signedRequest(options);
  const side = options.app === 'driver' ? 'driver' : 'passenger';
  const prepared = async (response: Response): Promise<PreparedCard> =>
    preparedCardSchema.parse(await response.json());
  return {
    mine: async (): Promise<MyGrowth> => myGrowthSchema.parse(await (await request(MY_GROWTH_PATH)).json()),
    moment: async (): Promise<Moment> =>
      momentSchema.parse(await (await request(`${MOMENT_PATH}?side=${side}`)).json()),
    offered: async (moment: ShareMoment): Promise<void> => void (await post(MOMENT_OFFERED_PATH, { moment })),
    momentCard: async (moment: ShareMoment, phrase: number): Promise<PreparedCard> =>
      prepared(await post(MOMENT_CARD_PATH, { moment, phrase })),
    momentStory: async (image: Blob): Promise<string> =>
      momentStorySchema.parse(await (await put(MOMENT_STORY_PATH, image)).json()).imageUrl,
    loopCard: async (card: LoopCard): Promise<PreparedCard> => prepared(await post(LOOP_CARD_PATH, card)),
  };
}

export type GrowthClient = ReturnType<typeof createGrowthClient>;
