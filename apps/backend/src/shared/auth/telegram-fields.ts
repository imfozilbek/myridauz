import { z } from 'zod';

// The JSON fields Telegram puts into signed data. Only what the API needs is read.
const userSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string(),
  allows_write_to_pm: z.boolean().optional(),
});
const contactSchema = z.object({
  user_id: z.number().int().positive(),
  phone_number: z.string().min(5).max(20),
});

export type TelegramUser = {
  readonly id: number;
  readonly firstName: string;
  readonly allowsWriteToPm: boolean;
};
export type TelegramContact = { readonly userId: number; readonly phone: string };

function readJson<T>(fields: ReadonlyMap<string, string>, key: string, schema: z.ZodType<T>): T | undefined {
  try {
    const parsed = schema.safeParse(JSON.parse(fields.get(key) ?? 'null'));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function readTelegramUser(fields: ReadonlyMap<string, string>): TelegramUser | undefined {
  const user = readJson(fields, 'user', userSchema);
  return (
    user && { id: user.id, firstName: user.first_name, allowsWriteToPm: user.allows_write_to_pm ?? false }
  );
}

export function readTelegramContact(fields: ReadonlyMap<string, string>): TelegramContact | undefined {
  const contact = readJson(fields, 'contact', contactSchema);
  return contact && { userId: contact.user_id, phone: contact.phone_number };
}
