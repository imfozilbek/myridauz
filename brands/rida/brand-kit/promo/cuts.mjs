// Short versions of the promo video (docs/41): parts of the master with its own music, joined
// with short sound fades, every cut ends with the logo and the final card.
// Usage: FFMPEG=… node promo/cuts.mjs   (after promo/build.mjs made the master)
import { execFileSync } from 'node:child_process';

const OUT = 'kit/promo';
const MASTER = `${OUT}/rida-promo-1080x1920.mp4`;
const JOIN = 0.08; // seconds of sound fade at each join: no click between the parts
const END = 0.8; // seconds of the last sound fade

// A part ends before the circle wipe into the next scene starts (wipe in kit.mjs): no flash of its color.
const WIPE = 0.45;
// The seconds of the master (docs/41 timing): the question, the passenger, the driver, trust, the logo.
const QUESTION = [0, 2.2], HOOK = [0, 7.96 - WIPE], PASSENGER = [17.77, 27.19 - WIPE], DRIVER = [27.19, 37.3 - WIPE];
const TRUST = [37.3, 44.5], LOGO = [57.1, 60.94], CROWD = [55.6, 60.94], FINALE = [54.6, 60.94];

const CUTS = {
  'rida-promo-6s': [QUESTION, LOGO],
  'rida-promo-15s-yolovchi': [QUESTION, PASSENGER, LOGO],
  'rida-promo-15s-haydovchi': [DRIVER, CROWD],
  'rida-promo-30s': [HOOK, PASSENGER, TRUST, FINALE],
};

function filter(parts) {
  const total = parts.reduce((sum, [from, to]) => sum + to - from, 0);
  const chains = parts.map(([from, to], i) => {
    const length = (to - from).toFixed(3);
    const out = (to - from - JOIN).toFixed(3);
    return (
      `[0:v]trim=${from}:${to},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=${from}:${to},asetpts=PTS-STARTPTS,afade=t=in:d=${JOIN},afade=t=out:st=${out}:d=${JOIN},apad=whole_dur=${length}[a${i}]`
    );
  });
  const inputs = parts.map((_, i) => `[v${i}][a${i}]`).join('');
  const fadeFrom = (total - END).toFixed(3);
  return `${chains.join(';')};${inputs}concat=n=${parts.length}:v=1:a=1[v][joined];[joined]afade=t=out:st=${fadeFrom}:d=${END}[a]`;
}

for (const [name, parts] of Object.entries(CUTS)) {
  execFileSync(process.env.FFMPEG, ['-y', '-loglevel', 'error', '-i', MASTER, '-filter_complex', filter(parts),
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', `${OUT}/${name}.mp4`]);
  console.log(`${name}.mp4`);
}
