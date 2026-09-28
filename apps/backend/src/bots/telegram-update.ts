import { z } from 'zod';

// Only the part of a Telegram update the bots read now; everything else is ignored.
export const telegramUpdateSchema = z.object({
  message: z
    .object({
      text: z.string().optional(),
      chat: z.object({ id: z.number() }),
      from: z.object({ id: z.number() }).optional(),
    })
    .optional(),
});

export const isStartCommand = (text: string | undefined) =>
  text === '/start' || text?.startsWith('/start ') === true;
