import { readdirSync, readFileSync } from 'node:fs';
import { loadBrand } from '@platform/brands';
import type { Page } from '@playwright/test';
import type { Reply } from './bot-kit';
import { t } from './screen-tour';

// The chat of a person with a bot (docs/95, G68): Telegram itself is not on the stand, so its chat
// screen is drawn here from what the bot really sends, to be shot like a Mini App screen.
const brand = loadBrand();
const KIT = `brands/${brand.id}/brand-kit/kit/telegram`;
const image = (file: string) => `data:image/png;base64,${readFileSync(`${KIT}/${file}`).toString('base64')}`;

const STYLE = `
  body { margin: 0; font: 15px/1.35 -apple-system, Roboto, sans-serif; background: rgb(230, 235, 238); }
  header { display: flex; gap: 10px; align-items: center; padding: 10px 12px; background: rgb(255, 255, 255); }
  header img { width: 40px; height: 40px; border-radius: 50%; }
  header b { display: block; } header small { color: rgb(112, 117, 121); }
  main { padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 600px; }
  .card { background: rgb(255, 255, 255); border-radius: 12px; overflow: hidden; align-self: center; width: 300px; }
  .card img { width: 100%; display: block; } .card p { margin: 10px 12px; white-space: pre-line; }
  .bubble { background: rgb(255, 255, 255); border-radius: 12px; padding: 8px 10px; max-width: 80%; white-space: pre-line; }
  .photo { display: block; width: 100%; border-radius: 8px; margin-bottom: 6px; }
  .mine { align-self: flex-end; background: rgb(225, 254, 198); }
  .button { margin-top: 4px; background: rgba(0,0,0,.25); color: rgb(255, 255, 255); border-radius: 8px;
    padding: 8px; text-align: center; max-width: 80%; }
  footer { position: fixed; bottom: 0; left: 0; right: 0; background: rgb(255, 255, 255); padding: 12px;
    text-align: center; color: rgb(51, 144, 236); font-weight: 600; }
  .pin, .quote { color: rgb(51, 144, 236); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pin { background: rgb(255, 255, 255); border-top: 1px solid rgb(229, 229, 229); padding: 6px 12px; }
  .quote, blockquote { border-left: 3px solid rgb(51, 144, 236); background: rgb(233, 243, 251);
    border-radius: 4px; padding: 2px 8px; margin: 2px 0; font-size: 14px; }
  .keys { display: flex; flex-direction: column; gap: 4px; max-width: 80%; }
  .keys div { display: flex; gap: 4px; } .keys .button { flex: 1; max-width: none; margin: 0; }
`;

export const escape = (text: string) =>
  text.replace(/[&<>]/gu, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char);

export type Bot = { readonly name: string; readonly avatar: string; readonly picture: string };
export const botOf = (role: 'passenger' | 'driver' | 'admin'): Bot => ({
  name: t(`bot.profile.${role}.name`, { brand: brand.name }),
  avatar: `bot-${role}-avatar.png`,
  picture: `bot-${role}-description.png`,
});
export const DRIVER_BOT = botOf('driver');

// A channel as its own chat (G68, mockup g68/5): its title and its round picture of the brand kit.
export function channelChat(zone: { readonly title: string; readonly username: string }): Bot {
  const slug = zone.username.split('_').at(-1) ?? '';
  const round = readdirSync(`${KIT}/channels`).find(
    (file) => file.includes('avatar') && file.endsWith(`-${slug}.png`),
  );
  return { name: zone.title, avatar: round ? `channels/${round}` : 'bot-passenger-avatar.png', picture: '' };
}

// pinned: the first line of the message on top of the chat (docs/122 rule 6).
export async function draw(page: Page, bot: Bot, body: string, footer = '', pinned = '') {
  const header = `<header><img src="${image(bot.avatar)}"><div><b>${escape(bot.name)}</b><small>bot</small></div></header>`;
  const pin = pinned ? `<div class="pin">📌 ${pinned}</div>` : '';
  const html = `<style>${STYLE}</style>${header}${pin}<main>${body}</main>${footer ? `<footer>${footer}</footer>` : ''}`;
  await page.setContent(html);
}

// The empty chat of a bot before «Start»: its picture and description (docs/62).
export const beforeStart = (page: Page, bot: Bot, description: string) =>
  draw(
    page,
    bot,
    `<div class="card"><img src="${image(bot.picture)}"><p>${escape(description)}</p></div>`,
    'START',
  );

// A picture of the bot is served by the landing from brands/<brand>/landing (G34): the stand reads
// the same file instead of the internet.
const landingImage = (url: string) =>
  `data:image/png;base64,${readFileSync(`brands/${brand.id}/landing${new URL(url).pathname}`).toString('base64')}`;

// The chat after a message of the person: the answer of the bot, its picture and buttons.
export function answered(page: Page, bot: Bot, said: string, reply: Reply) {
  const buttons = (reply.reply_markup?.inline_keyboard ?? [])
    .flat()
    .map((button) => `<div class="button">${escape(button.text)}</div>`)
    .join('');
  const picture = reply.photo ? `<img class="photo" src="${landingImage(reply.photo)}">` : '';
  const words = escape(reply.caption ?? reply.text ?? '');
  const answer = `<div class="bubble">${picture}${words}</div>${buttons}`;
  return draw(page, bot, `<div class="bubble mine">${escape(said)}</div>${answer}`);
}
