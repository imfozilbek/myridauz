import { askTelegram, callTelegram, type Fetch } from '../shared/telegram/telegram-api';
import type { botProfile } from './bot-profile';

type Profile = ReturnType<typeof botProfile>;
// Each text of the profile: how Telegram reads it and sets it, and its field in both answers.
const TEXTS = [
  ['getMyName', 'setMyName', 'name'],
  ['getMyDescription', 'setMyDescription', 'description'],
  ['getMyShortDescription', 'setMyShortDescription', 'short_description'],
] as const;

// The name, the text of an empty chat and the profile line (G16): only a text that differs is sent.
// Telegram limits these calls hard; the same name sent again and again answers 429 (lesson 308).
export async function setTextsWhenChanged(fetch: Fetch, token: string, profile: Profile): Promise<void> {
  for (const [get, set, field] of TEXTS) {
    const seen = await askTelegram<Partial<Profile>>(fetch, token, get);
    if (seen?.[field] !== profile[field]) await callTelegram(fetch, token, set, { [field]: profile[field] });
  }
}
