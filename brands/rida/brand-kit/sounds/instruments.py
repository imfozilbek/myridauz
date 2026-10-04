# The instruments of the Rida sounds (docs/115): jaw harp (chanqovuz), reed flute (sibizg'a),
# 808 bass, hats and a clap. All made by numbers: no recording of anybody, the rights are ours.
import numpy as np
import scipy.signal as ss

SR = 44100
BPM = 117
BEAT = 60 / BPM
S16 = BEAT / 4
G2, G4, Ab4, Bb4, C5, D5, G5, Ab5, Bb5 = 43, 67, 68, 70, 72, 74, 79, 80, 82
rng = np.random.default_rng(7)


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def twang_env(n, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / 0.004) * np.exp(-np.maximum(t - 0.004, 0) / decay)


def jaw(dur, f_from=450, f_to=1300, q=6):
    # One pluck: a bright drone whose mouth formant sweeps up (the «boing»).
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = hz(G2)
    src = ss.sawtooth(2 * np.pi * f0 * t) * 0.6 + np.sign(np.sin(2 * np.pi * f0 * t)) * 0.4
    out, zi, blk = np.zeros(n), np.zeros(2), 256
    for i in range(0, n, blk):
        k = min(1, i / n * 1.6)
        b, a = ss.iirpeak(f_from + (f_to - f_from) * np.sin(k * np.pi / 2), q, fs=SR)
        out[i:i + blk], zi = ss.lfilter(b, a, src[i:i + blk], zi=zi)
    out = out * twang_env(n, 0.35)
    return out / np.max(np.abs(out)) * 0.6


def jaw_line(dur, plucks, melody, f0=hz(37), q=22, floor=0.3):
    # The jaw harp plays a tune: the mouth picks one overtone, plucks keep it ringing.
    n = int(dur * SR)
    t = np.arange(n) / SR
    src = ss.sawtooth(2 * np.pi * f0 * t) * 0.6 + np.sign(np.sin(2 * np.pi * f0 * t)) * 0.4
    target = np.zeros(n)
    for at, harmonic in melody:
        target[int(at * SR):] = harmonic * f0
    target = ss.lfilter([0.003], [1, -0.997], target, zi=[target[0] * 0.997])[0]
    out, zi, blk = np.zeros(n), np.zeros(2), 128
    for i in range(0, n, blk):
        b, a = ss.iirpeak(target[i], q, fs=SR)
        out[i:i + blk], zi = ss.lfilter(b, a, src[i:i + blk], zi=zi)
    env = np.full(n, floor)
    for p in plucks:
        k = int(p * SR)
        env[k:] = np.maximum(env[k:], floor + (1 - floor) * np.exp(-np.arange(n - k) / SR / 0.16))
    x = (out / np.max(np.abs(out)) + np.sin(2 * np.pi * f0 * t) * 0.07) * env
    return x / np.max(np.abs(x))


def flute(note, dur, bend=0.0, vib=True, to=None):
    # Sibizg'a: a breathy reed flute; a small bend into the note, vibrato on long notes, an
    # optional turn to another note at the end (the Uzbek ornament).
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(note) * (1 + bend * np.exp(-t / 0.05))
    if to is not None:
        f = f * (hz(to) / hz(note)) ** np.clip((t - dur * 0.35) / (dur * 0.2), 0, 1)
    if vib:
        f = f * (1 + 0.012 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.12) / 0.15, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.06 * np.sin(4 * ph)
    b, a = ss.iirpeak(hz(note) * 2, 4, fs=SR)
    breath = ss.lfilter(b, a, rng.standard_normal(n)) * 0.25
    env = np.minimum(1, t / 0.035) * np.clip((dur - t) / 0.06, 0, 1)
    return (tone + breath) * env * 0.5


def bass(dur, note, glide_to=None):
    # The 808: a deep sine with a click, sliding to another note on some hits.
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(note) * (1 + 2.5 * np.exp(-t / 0.012))
    if glide_to is not None:
        f = f * (hz(glide_to) / hz(note)) ** np.clip((t - dur * 0.45) / (dur * 0.3), 0, 1)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32)) * 0.8


def hat(dur=0.05, amp=0.25):
    n = int(dur * SR)
    b, a = ss.butter(4, 7000, 'hp', fs=SR)
    return ss.lfilter(b, a, rng.standard_normal(n)) * np.exp(-np.arange(n) / SR / 0.012) * amp


def clap():
    n = int(0.25 * SR)
    b, a = ss.butter(2, [900, 3500], 'bp', fs=SR)
    return ss.lfilter(b, a, rng.standard_normal(n)) * np.exp(-np.arange(n) / SR / 0.07) * 0.7


def put(buf, x, at):
    i = int(at * SR)
    buf[i:i + len(x)] += x[:max(0, len(buf) - i)]


def master(x, peak=0.89):
    x = np.tanh(1.3 * x / np.max(np.abs(x)))
    return x / np.max(np.abs(x)) * peak
