# The three sound sets of Rida (docs/115): a ring for an incoming call (one loop of two bars that
# repeats without a seam) and a notification. Run: python3 sounds.py (numpy, scipy, soundfile).
from pathlib import Path

import numpy as np
import scipy.signal as ss
import soundfile as sf
from instruments import (BEAT, G2, G4, Ab4, Ab5, Bb4, Bb5, C5, D5, G5, S16, SR, bass, clap,
                         flute, hat, jaw, jaw_line, master, put)

OUT = Path(__file__).resolve().parents[2] / 'public' / 'sounds'
# Phones play these through a small speaker: a lighter file is enough.
FILE_RATE = 22050
LOOP = int(BEAT * 8 * SR)
# The 808 of every bar: when, how long (beats) and where it slides.
BASS = [(0, 0.7, None), (0.75, 0.7, None), (1.5, 0.9, 5), (2.5, 0.7, None), (3.25, 0.7, -2)]


def beat(buf, root, level=0.6, hats=(0.22, 0.12)):
    for bar in range(2):
        o = bar * BEAT * 4
        for at, d, slide in BASS:
            put(buf, bass(BEAT * d, root, None if slide is None else root + slide) * level, o + BEAT * at)
        put(buf, clap(), o + BEAT * 2)
        for s in range(16):
            put(buf, hat(amp=hats[0] if s % 2 == 0 else hats[1]), o + s * S16)


def plucks(buf):
    for bar in range(2):
        for s in [0, 3, 4, 6, 8, 11, 12, 14]:
            put(buf, jaw(S16 * 2.2, f_to=2200 if s % 4 == 0 else 1300) * 1.1, bar * BEAT * 4 + s * S16)


def rida(buf, at, low=False, amp=1.0):
    # «ri» short, «DA» long: the name, stressed like in Uzbek.
    ri, da = (C5, G4) if low else (D5, G5)
    put(buf, flute(ri, S16 * 1.6, bend=-0.03, vib=False) * amp, at)
    put(buf, flute(da, BEAT * 1.6, bend=-0.06) * amp, at + S16 * 1.5)


def signature(buf, at, amp=1.0):
    # The sound of Rida, always the same: «ri-da, ri-DAAA» (docs/115).
    for note, start, length in [(D5, 0, 1.3), (G5, 1, 1.8), (D5, 3, 1.3), (Bb5, 4, 1.6)]:
        put(buf, flute(note, S16 * length, bend=-0.03, vib=False) * amp, at + S16 * start)
    put(buf, flute(Ab5, BEAT * 1.6, to=G5) * amp, at + S16 * 5.4)


def ring_1():
    buf = np.zeros(LOOP)
    plucks(buf)
    beat(buf, G2 - 12, level=0.6)
    rida(buf, 0)
    rida(buf, BEAT * 2, amp=0.8)
    rida(buf, BEAT * 4, low=True)
    for note, at, length in [(Bb4, 6.2, 0.5), (Ab4, 6.7, 0.4)]:
        put(buf, flute(note, BEAT * length, vib=False) * 0.8, BEAT * at)
    put(buf, flute(G4, BEAT * 0.8) * 0.8, BEAT * 7.1)
    return buf


def ring_2():
    buf = np.zeros(LOOP)
    melody = [(0, 30)]
    for k, at in enumerate([0, 1.25, 2, 3.25, 4, 5.25, 6, 7]):
        melody += [(BEAT * at, 14 if k % 2 == 0 else 18), (BEAT * at + 0.22, 30 if k < 6 else 24)]
    gallop = [b * BEAT * 4 + s * S16 for b in range(2) for s in [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]]
    put(buf, jaw_line(BEAT * 8, gallop, melody), 0)
    beat(buf, 37, level=0.45, hats=(0.16, 0.08))
    return buf


def ring_3():
    buf = np.zeros(LOOP)
    plucks(buf)
    beat(buf, G2 - 12, level=0.6)
    signature(buf, 0, 1.8)
    signature(buf, BEAT * 4, 1.8)
    return buf


def notify(length, fill):
    buf = np.zeros(int(length * SR))
    fill(buf)
    fade = np.minimum(1, (len(buf) - np.arange(len(buf))) / SR / 0.15)
    return buf * fade


NOTIFY = {
    '1': notify(1.3, lambda b: (put(b, jaw(0.7, 400, 2400) * 1.2, 0), rida(b, 0.06))),
    '2': notify(1.4, lambda b: put(b, jaw_line(1.4, [0, 0.2], [(0, 30), (0, 14), (0.2, 30)], floor=0.12), 0)),
    '3': notify(1.75, lambda b: (put(b, jaw(0.7, 400, 2400) * 1.2, 0), signature(b, 0.06))),
}
RING = {'1': ring_1, '2': ring_2, '3': ring_3}


def save(name, x):
    x = ss.resample_poly(master(x), FILE_RATE, SR)
    sf.write(OUT / f'{name}.wav', x, FILE_RATE, subtype='PCM_16')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for key in RING:
        save(f'{key}-ring', RING[key]())
        save(f'{key}-notify', NOTIFY[key])
