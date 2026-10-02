import { readFileSync } from 'node:fs';
import { loadBrand } from '@platform/brands';
import type { Page } from '@playwright/test';
import type { Reply } from './bot-kit';
import { t } from './screen-tour';

// The first contact of a person with a bot (docs/95): Telegram itself is not on the stand, so its
// chat screen is drawn here from what the bot really sends, to be shot like a Mini App screen.
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
  .mine { align-self: flex-end; background: rgb(225, 254, 198); }
  .button { margin-top: 4px; background: rgba(0,0,0,.25); color: rgb(255, 255, 255); border-radius: 8px;
    padding: 8px; text-align: center; max-width: 80%; }
  footer { position: fixed; bottom: 0; left: 0; right: 0; background: rgb(255, 255, 255); padding: 12px;
    text-align: center; color: rgb(51, 144, 236); font-weight: 600; }
`;

const escape = (text: string) =>
  text.replace(/[&<>]/gu, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char);

type Bot = { readonly name: string; readonly avatar: string; readonly picture: string };
export const DRIVER_BOT: Bot = {
  name: t('bot.profile.driver.name', { brand: brand.name }),
  avatar: 'bot-driver-avatar.png',
  picture: 'bot-driver-description.png',
};

async function draw(page: Page, bot: Bot, body: string, footer = '') {
  const header = `<header><img src="${image(bot.avatar)}"><div><b>${escape(bot.name)}</b><small>bot</small></div></header>`;
  const html = `<style>${STYLE}</style>${header}<main>${body}</main>${footer ? `<footer>${footer}</footer>` : ''}`;
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

// The chat after «Start»: the command of the person and the answer of the bot with its buttons.
export function afterStart(page: Page, bot: Bot, reply: Reply) {
  const buttons = (reply.reply_markup?.inline_keyboard ?? [])
    .flat()
    .map((button) => `<div class="button">${escape(button.text)}</div>`)
    .join('');
  const answer = `<div class="bubble">${escape(reply.text ?? '')}</div>${buttons}`;
  return draw(page, bot, `<div class="bubble mine">/start</div>${answer}`);
}
