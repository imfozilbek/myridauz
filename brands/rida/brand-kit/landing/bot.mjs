// Pictures the bots take by link (G34, docs/95): the driver welcome (sendPhoto) and the four bot
// avatars (setMyProfilePhoto). They live in brands/rida/landing/bot, which the landing serves at
// https://<domain>/bot/…: Telegram and the Worker fetch them from there, no upload by hand.
// Usage: CHROMIUM=… pnpm bot
import fs from 'node:fs';
import { chromium } from 'playwright';
import { botAvatar } from '../lib/brand.mjs';
import { botWelcome } from '../lib/welcome.mjs';

const OUT = new URL('../../landing/bot/', import.meta.url);
const AVATAR = 640;
const JPEG_QUALITY = 90;
// The support bot is answered by the team: it wears the team colors.
const AVATARS = { passenger: 'passenger', driver: 'driver', admin: 'admin', support: 'admin' };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
await page.setContent('<html><body style="margin:0;background:transparent"><div id="s"></div></body></html>');

async function save(name, body, width, height, type) {
  await page.setViewportSize({ width, height });
  await page.evaluate((s) => { document.getElementById('s').innerHTML = s; }, body);
  const clip = { x: 0, y: 0, width, height };
  const shot = await page.screenshot(type === 'jpeg' ? { clip, type, quality: JPEG_QUALITY } : { clip, type });
  fs.writeFileSync(new URL(name, OUT), shot);
  console.log(`${name} ${Math.round(shot.length / 1024)} KB`);
}

fs.mkdirSync(OUT, { recursive: true });
await save('driver-welcome.png', botWelcome(), 1280, 720, 'png');
for (const [role, look] of Object.entries(AVATARS)) {
  await save(`${role}-avatar.jpg`, botAvatar(look), AVATAR, AVATAR, 'jpeg');
}
await browser.close();
