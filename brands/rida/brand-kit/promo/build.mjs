// Renders the promo video: SVG frames in Chromium piped into ffmpeg (H.264), then the music track.
// Usage: FFMPEG=… CHROMIUM=… MUSIC=track.mp3 node promo/build.mjs        (full video)
//        FFMPEG=… CHROMIUM=… node promo/build.mjs --preview 1.5,9,30  (PNG frames at these seconds)
import fs from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { frame, DURATION, FPS } from './timeline.mjs';
import { W, H } from './kit.mjs';

const OUT = 'kit/promo';
const [mode, list] = process.argv.slice(2);
const preview = mode === '--preview' ? list.split(',').map(Number) : null;
const { FFMPEG, MUSIC, CHROMIUM } = process.env;
if (!preview && !MUSIC) throw new Error('Set MUSIC to the licensed track (docs/41).');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent('<html><body style="margin:0"><div id="s"></div></body></html>');
async function shot(t) {
  await page.evaluate((s) => { document.getElementById('s').innerHTML = s; }, frame(t));
  return page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
}

if (preview) {
  for (const t of preview) fs.writeFileSync(`${OUT}/frame-${t.toFixed(2)}.png`, await shot(t));
} else {
  const silent = `${OUT}/silent.mp4`, total = Math.ceil(DURATION * FPS);
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve) => ff.on('close', resolve));
  for (let i = 0; i < total; i++) {
    if (!ff.stdin.write(await shot(i / FPS))) await new Promise((resolve) => ff.stdin.once('drain', resolve));
    if (i % 300 === 0) console.log(`frame ${i} / ${total}`);
  }
  ff.stdin.end();
  await done;
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', MUSIC, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', `${OUT}/rida-promo-1080x1920.mp4`]);
  fs.rmSync(silent);
}
await browser.close();
console.log('promo done');
