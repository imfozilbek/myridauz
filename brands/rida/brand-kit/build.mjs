// Builds the Rida brand kit into ./kit: SVG masters, PNG renders, motion videos, tokens, fonts.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import * as brand from './lib/brand.mjs';
import * as social from './lib/social.mjs';
import * as motion from './lib/motion.mjs';
import * as channels from './lib/channels.mjs';
import * as extras from './lib/extras.mjs';
import * as welcome from './lib/welcome.mjs';
import { botAvatar } from './lib/avatar.mjs';
import { C, TOKENS } from './lib/palette.mjs';

const OUT = 'kit';
const FFMPEG = process.env.FFMPEG;
const regions = JSON.parse(fs.readFileSync('data/regions.json', 'utf8'));
const qr = JSON.parse(fs.readFileSync('data/qr.json', 'utf8'));
fs.rmSync(OUT, { recursive: true, force: true });
const put = (path, data) => { fs.mkdirSync(path.split('/').slice(0, -1).join('/'), { recursive: true }); fs.writeFileSync(path, data); };
const resize = (s, w, h) => s.replace(/^<svg([^>]*?) width="[\d.]+" height="[\d.]+"/, `<svg$1 width="${w}" height="${h}"`);

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
await page.setContent('<html><body style="margin:0;background:transparent"><div id="s"></div></body></html>');
async function png(svgStr, w, h, path) {
  await page.setViewportSize({ width: Math.ceil(w), height: Math.ceil(h) });
  await page.evaluate((s) => { document.getElementById('s').innerHTML = s; }, resize(svgStr, w, h));
  await page.screenshot({ path, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}
// Master SVG + PNG renders at the listed sizes.
async function asset(name, svgStr, sizes) {
  put(`${OUT}/${name}.svg`, svgStr);
  const [, w, h] = svgStr.match(/width="([\d.]+)" height="([\d.]+)"/).map(Number);
  for (const s of sizes) await png(svgStr, s, Math.round(s * h / w), `${OUT}/${name}${sizes.length > 1 ? `-${s}` : ''}.png`);
}

// Logo
for (const c of [1, 2, 3, 4, 5, 6]) await asset(`logo/rida-icon-${c}`, brand.icon(c, 'squircle'), [1024]);
await asset('logo/rida-icon-1-circle', brand.icon(1, 'circle'), [1024]);
await asset('logo/rida-mark-teal', brand.mark(C.teal), [620]);
await asset('logo/rida-mark-white', brand.mark(C.white), [620]);
await asset('logo/rida-wordmark-teal', brand.wordmark(C.teal), [1480]);
await asset('logo/rida-lockup-horizontal', brand.lockupH(), [1640]);
await asset('logo/rida-lockup-vertical', brand.lockupV(), [1000]);
// Telegram
for (const r of ['passenger', 'driver', 'admin', 'support']) await asset(`telegram/bot-${r}-avatar`, botAvatar(r), [640]);
for (const r of ['passenger', 'driver', 'admin']) await asset(`telegram/bot-${r}-description`, brand.botDescription(r), [640]);
await asset('telegram/bot-driver-welcome', welcome.botWelcome(), [1280]);
put(`${OUT}/telegram/miniapp-splash.svg`, brand.splash());
for (const r of regions) {
  const id = `${String(r.n).padStart(2, '0')}-${r.user.replace('rida_', '')}`;
  await asset(`telegram/channels/rida-kanal-avatar-${id}`, channels.channelAvatar(r), [640]);
  await asset(`telegram/channels/rida-kanal-${id}`, channels.channelPost(r), [1280]);
}
// Web
put(`${OUT}/web/favicon.svg`, brand.icon(1, 'squircle', 64));
for (const s of [16, 32, 48]) await png(brand.icon(1, 'squircle', 64), s, s, `${OUT}/web/favicon-${s}.png`);
put(`${OUT}/web/favicon.ico`, extras.ico([16, 32, 48].map((size) => ({ size, png: fs.readFileSync(`${OUT}/web/favicon-${size}.png`) }))));
await png(brand.icon(1, 'square', 1024), 180, 180, `${OUT}/web/apple-touch-icon.png`);
for (const s of [192, 512]) await png(brand.icon(1, 'square', 1024), s, s, `${OUT}/web/icon-${s}.png`);
await asset('web/og-image', brand.ogImage(), [1200]);
// Social and print
await asset('social/post-tez-orada', social.postSoon(), [1080]);
await asset('social/post-ishga-tushdi', social.postLaunch(), [1080]);
await asset('social/post-mashinada-ayol-bor', social.postWoman(), [1080]);
await asset('social/story-haydovchi', social.storyDriver(), [1080]);
await asset('social/story-yangi-safar', social.storyRoute(), [1080]);
await asset('print/avto-nakleyka-200mm', social.carSticker(), [2362]);
await asset('print/qr-poster-a4', social.qrPoster(qr), [2480]);

// Motion: frames -> MP4 (H.264) + GIF preview.
async function video(name, fn, w, h, seconds, fps = 30) {
  const dir = `${OUT}/_frames/${name}`;
  fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(seconds * fps);
  for (let i = 0; i < n; i++) await png(fn(i / fps), w, h, `${dir}/${String(i).padStart(4, '0')}.png`);
  const mp4 = `${OUT}/motion/${name}.mp4`;
  fs.mkdirSync(`${OUT}/motion`, { recursive: true });
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${dir}/%04d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4]);
  const gw = Math.min(540, w);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', mp4, '-vf', `fps=20,scale=${gw}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse`, `${OUT}/motion/${name}.gif`]);
  fs.rmSync(dir, { recursive: true, force: true });
}
await video('rida-logo-reveal-1920x1080', (t) => motion.logoReveal(t), 1920, 1080, 3.5);
await video('rida-logo-reveal-1080', (t) => motion.logoReveal(t, { wide: false }), 1080, 1080, 3.5);
await video('rida-hududlar-1080', (t) => motion.plateFlip(t, regions), 1080, 1080, regions.length * 0.75);
await video('rida-yangi-safar-1080x1920', (t) => social.storyRoute(t), 1080, 1920, 4.5);
fs.rmSync(`${OUT}/_frames`, { recursive: true, force: true });
// Layered SVGs for motion designers (groups have ids).
put(`${OUT}/motion/layers/logo-layers.svg`, motion.logoReveal(99));
put(`${OUT}/motion/layers/plate-layers.svg`, motion.plateFlip(0.5, regions));
put(`${OUT}/motion/layers/route-layers.svg`, social.storyRoute());
await browser.close();
// Tokens, fonts and README: copied or generated without rendering.
put(`${OUT}/tokens/rida-colors.json`, `${JSON.stringify({ name: TOKENS.name, theme: TOKENS.theme, colors: TOKENS.colors, motion: TOKENS.motion }, null, 2)}\n`);
put(`${OUT}/tokens/rida-tokens.css`, extras.tokensCss(TOKENS));
for (const f of fs.readdirSync('fonts/rubik')) put(`${OUT}/fonts/${f}`, fs.readFileSync(`fonts/rubik/${f}`));
put(`${OUT}/README.txt`, fs.readFileSync('data/kit-readme.txt'));
console.log('built');
