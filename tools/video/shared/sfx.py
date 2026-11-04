#!/usr/bin/env python3
"""The sound-effect library for the lesson videos, synthesised from scratch (no samples, no licences).

    python3 tools/video/shared/sfx.py        writes tools/video/shared/sfx/<name>.wav (48 kHz stereo)

Every sound is built from noise, sines and simple filters, then given a little stereo room. The engine
schedules them with sfx(name, time, gain, pan) and mix.py lays them under the narration.
"""
import os, wave
import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx")
rng = np.random.default_rng(7)


def t_(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def pink(d):
    # pink-ish noise: white noise with a -3 dB/octave tilt (FFT shaping)
    n = int(d * SR); w = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    w[1:] /= np.sqrt(f[1:]); w[0] = 0
    x = np.fft.irfft(w, n); return x / (np.abs(x).max() + 1e-9)
def env_ad(n, a, d, curve=4.0):
    """attack (linear) then exponential decay, lengths in seconds"""
    na = max(1, int(a * SR)); e = np.zeros(n)
    e[:na] = np.linspace(0, 1, na)[:n]
    if n > na: e[na:] = np.exp(-curve * np.arange(n - na) / max(1, int(d * SR)))
    return e
def svf(x, fc, q=0.7, mode="bp"):
    """state-variable filter; fc may be a per-sample array (a sweep)"""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR); damp = 1 / q
    lp = bp = 0.0; out = np.empty_like(x)
    for i in range(len(x)):
        hp = x[i] - lp - damp * bp
        bp += f[i] * hp; lp += f[i] * bp
        out[i] = bp if mode == "bp" else lp if mode == "lp" else hp
    return out
def lp1(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def sweep(f0, f1, d, shape="exp"):
    k = np.linspace(0, 1, int(d * SR))
    return f0 * (f1 / f0) ** k if shape == "exp" else f0 + (f1 - f0) * k
def osc(freq, kind="sine"):
    ph = 2 * np.pi * np.cumsum(freq) / SR
    if kind == "sine": return np.sin(ph)
    if kind == "tri": return 2 / np.pi * np.arcsin(np.sin(ph))
    return np.tanh(3 * np.sin(ph))  # soft square


def _blockwise(x, D, fn):
    y = np.zeros(len(x) + D)
    for k in range(0, len(x), D):
        seg = x[k:k + D]; y[D + k:D + k + len(seg)] = fn(seg, y[k:k + len(seg)], k)
    return y[D:]
def comb(x, D, g):
    return _blockwise(x, D, lambda seg, prev, k: seg + g * prev)
def allpass(x, D, g):
    xp = np.concatenate([np.zeros(D), x])
    return _blockwise(x, D, lambda seg, prev, k: -g * seg + xp[k:k + len(seg)] + g * prev)
def room(x, size=1.0, wet=0.25, tail=1.2):
    """a small Schroeder reverb; returns stereo (2, n) with the tail appended"""
    x = np.concatenate([x, np.zeros(int(tail * SR))])
    outs = []
    for side, combs in ((0, (1557, 1617, 1491, 1422)), (1, (1277, 1356, 1188, 1116))):
        w = sum(comb(x, int(c * size), 0.80) for c in combs) / 4
        w = allpass(allpass(w, 225 + 23 * side, 0.5), 556 + 31 * side, 0.5)
        outs.append(x * (1 - wet) + lp1(w, 7000) * wet)
    return np.array(outs)
def pan(x, p):
    """mono -> stereo with a constant-power pan; p may be an array (-1 left … 1 right)"""
    p = np.broadcast_to(np.asarray(p, float), x.shape)
    a = (p + 1) * np.pi / 4
    return np.array([x * np.cos(a), x * np.sin(a)])
def write(name, st, peak=0.9):
    st = np.atleast_2d(st)
    if st.shape[0] == 1: st = np.vstack([st, st])
    fade = min(st.shape[1], int(0.004 * SR)); st[:, -fade:] *= np.linspace(1, 0, fade)
    rise = int(0.001 * SR); st[:, :rise] *= np.linspace(0, 1, rise)  # no click at the very first sample
    st = st / (np.abs(st).max() + 1e-9) * peak
    data = (st.T * 32767).astype("<i2")
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
    print(f"  {name:12s} {st.shape[1] / SR:.2f} s")


# ---------- the sounds ----------
def whoosh(d=0.75, f0=350, f1=3200, peak_at=0.6, name="whoosh", width=0.9):
    n = int(d * SR); k = np.linspace(0, 1, n)
    fc = np.where(k < peak_at, f0 * (f1 / f0) ** (k / peak_at), f1 * (f0 * 1.6 / f1) ** ((k - peak_at) / (1 - peak_at)))
    x = svf(pink(d), fc, q=1.4) + 0.35 * svf(pink(d), fc * 1.9, q=2.5)
    e = np.where(k < peak_at, (k / peak_at) ** 2.2, np.exp(-5 * (k - peak_at) / (1 - peak_at)))
    tail = int(.5 * SR)  # the air travels left to right, with a little room behind it
    moving = pan(np.concatenate([x * e, np.zeros(tail)]), np.concatenate([np.linspace(-width, width, n), np.full(tail, width)]))
    write(name, moving + 0.35 * room(x * e, 0.8, 0.18, 0.5))

def pop(name="pop", f0=1100, f1=320, d=0.16, bright=0.25):
    x = osc(sweep(f0, f1, d), "sine") * env_ad(int(d * SR), 0.002, d * 0.5, 5)
    click = svf(noise(0.01), 4000, 1.5) * np.linspace(1, 0, int(0.01 * SR))
    x[:len(click)] += bright * click
    write(name, room(x, 0.6, 0.12, 0.25))

def tick(name="tick", fc=5200, d=0.035, body=900):
    n = int(d * SR)
    x = svf(noise(d), fc, 2.5) * np.exp(-np.arange(n) / (0.004 * SR)) + 0.5 * np.sin(2 * np.pi * body * t_(d)) * np.exp(-np.arange(n) / (0.006 * SR))
    write(name, room(x, 0.5, 0.1, 0.15), 0.7)

def snap(name="snap"):
    d = 0.16; n = int(d * SR)
    hit = svf(noise(d), 2600, 1.2) * np.exp(-np.arange(n) / (0.012 * SR))
    thump = np.sin(2 * np.pi * np.cumsum(sweep(220, 90, d)) / SR) * np.exp(-np.arange(n) / (0.03 * SR))
    write(name, room(0.8 * hit + thump, 0.6, 0.12, 0.2))

def riser(name="riser", d=1.6):
    n = int(d * SR); k = np.linspace(0, 1, n)
    air = svf(pink(d), sweep(250, 7000, d), 1.6)
    tone = 0.25 * osc(sweep(180, 720, d), "tri") + 0.12 * osc(sweep(270, 1080, d), "sine")
    e = k ** 2.6
    x = (air + tone) * e
    x[-int(0.012 * SR):] *= np.linspace(1, 0, int(0.012 * SR))  # stops dead, so the impact lands on the cue
    write(name, room(x, 1.0, 0.22, 0.3))

def impact(name="impact", d=1.5):
    n = int(d * SR)
    sub = np.sin(2 * np.pi * np.cumsum(sweep(78, 38, d)) / SR) * np.exp(-np.arange(n) / (0.35 * SR))
    body = svf(noise(d), 180, 0.9, "lp") * np.exp(-np.arange(n) / (0.08 * SR)) * 1.6
    crack = svf(noise(d), 3200, 1.0) * np.exp(-np.arange(n) / (0.015 * SR)) * 0.5
    write(name, room(sub + body + crack, 1.2, 0.3, 1.4))

def bell(freq, d=2.2, amp=1.0):
    ts = t_(d); x = np.zeros_like(ts)
    for r, a, dec in ((1, 1, 1.4), (2.76, .45, .55), (5.4, .22, .3), (8.93, .1, .18), (2.0, .2, .9)):
        x += a * np.sin(2 * np.pi * freq * r * ts) * np.exp(-ts / dec)
    return amp * x * env_ad(len(ts), 0.002, d, 0.6)

def ding(name="ding"):
    write(name, room(bell(1318.5) + 0.5 * bell(1975.5, amp=.6), 1.3, 0.35, 1.5))

def shimmer(name="shimmer"):
    d = 2.8; x = np.zeros(int(d * SR))
    for k, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0, 2637.0)):
        s = int(k * 0.07 * SR); b = bell(f, d - k * 0.07, 0.55)
        x[s:s + len(b)] += b
    air = svf(pink(d), sweep(3000, 9000, d), 2.0) * env_ad(int(d * SR), 0.3, 1.2, 3) * 0.25
    write(name, room(x + air, 1.4, 0.4, 1.8))

def success(name="success"):
    d = 1.6; x = np.zeros(int(d * SR))
    for k, f in enumerate((1318.5, 1975.5)):
        s = int(k * 0.11 * SR); b = bell(f, d - k * 0.11, 0.8); x[s:s + len(b)] += b
    write(name, room(x, 1.1, 0.3, 1.0), 0.75)

def error(name="error"):
    d = 0.5; x = np.zeros(int(d * SR))
    for k, f in enumerate((233.1, 207.7)):
        s = int(k * 0.15 * SR); n = int(0.16 * SR)
        x[s:s + n] += lp1(osc(np.full(n, f), "square"), 1400) * env_ad(n, 0.004, 0.12, 4)
    write(name, room(x, 0.7, 0.15, 0.3), 0.7)

def swell(name="swell", d=2.4):
    ts = t_(d); x = np.zeros_like(ts)
    for f in (261.6, 329.6, 392.0, 523.3):
        x += np.sin(2 * np.pi * f * ts + rng.random() * 6) * (1 + 0.003 * np.sin(2 * np.pi * 5 * ts))
    e = np.sin(np.pi * np.clip(ts / d, 0, 1)) ** 2
    write(name, room(lp1(x, 1800) * e, 1.3, 0.35, 1.0), 0.6)

def blip(name="blip", f=1760, d=0.09):
    x = np.sin(2 * np.pi * f * t_(d)) * env_ad(int(d * SR), 0.002, d * .45, 5)
    write(name, room(x, 0.5, 0.12, 0.2), 0.55)

def slide(name="slide", d=0.42):
    n = int(d * SR); k = np.linspace(0, 1, n)
    x = svf(pink(d), sweep(1800, 600, d), 2.2) * np.sin(np.pi * k) ** 1.5
    write(name, room(x, 0.6, 0.15, 0.25))

def thud(name="thud"):
    d = 0.4; n = int(d * SR)
    x = np.sin(2 * np.pi * np.cumsum(sweep(140, 60, d)) / SR) * np.exp(-np.arange(n) / (0.07 * SR))
    x += 0.3 * svf(noise(d), 900, 1, "lp") * np.exp(-np.arange(n) / (0.02 * SR))
    write(name, room(x, 0.7, 0.15, 0.3))

if __name__ == "__main__":
    print("Synthesising sound effects into", OUT)
    whoosh(); whoosh(0.55, 500, 2400, 0.55, "whoosh_soft", 0.6); whoosh(1.0, 200, 1800, 0.7, "whoosh_low", 0.5)
    pop(); pop("pop_low", 700, 220, 0.2, 0.15)
    tick(); tick("tick_low", 2600, 0.04, 520)
    snap(); riser(); impact(); ding(); shimmer(); success(); error(); swell(); blip(); blip("blip_hi", 2349, 0.08); slide(); thud()
