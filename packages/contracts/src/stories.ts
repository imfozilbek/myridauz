import { z } from 'zod';

// «Hikoyaga joylash» (docs/88 L19): the driver puts an open trip into a Telegram story. The Mini App
// draws the picture, the API keeps it behind a public link: a trip is public like a channel post (docs/15).
export const driverTripStoryPath = (tripId: string) => `/driver/trips/${tripId}/story`;
export const STORIES_PATH = '/stories';
export const storyImagePath = (tripId: string) => `${STORIES_PATH}/${tripId}`;
export const STORY_TYPE = 'image/jpeg';
export const MAX_STORY_BYTES = 1_000_000;

// imageUrl: the picture for Telegram; bookLink: the story's link that opens the trip in the passenger bot.
export const storySchema = z.object({ imageUrl: z.string(), bookLink: z.string() });
export type Story = z.infer<typeof storySchema>;
