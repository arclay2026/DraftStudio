#!/usr/bin/env python3
"""The sound-effect library for the lesson videos, synthesised from scratch (no samples, no licences):
quiet, Apple-style product-film sound (air, tactile clicks, felt thumps), never tones or bells.

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
# The palette is restrained, in the spirit of product-film sound design: air, soft tactile clicks and
# deep felt thumps. There are no tones, bells or pitch sweeps. Each file is levelled to its own peak, so
# small sounds stay small (a tick is far quieter than a whoosh).
def air(name, d=0.7, f0=300, f1=1600, peak_at=0.55, width=0.7, peak=0.5, lp=3200):
    """breath of air moving past: broad filtered noise, a smooth swell, a gentle pan"""
    n = int(d * SR); k = np.linspace(0, 1, n)
    fc = np.where(k < peak_at, f0 * (f1 / f0) ** (k / peak_at), f1 * (f0 * 1.3 / f1) ** ((k - peak_at) / (1 - peak_at)))
    x = lp1(svf(pink(d), fc, q=0.55), lp)
    e = np.where(k < peak_at, np.clip(np.sin(np.pi / 2 * k / peak_at), 0, 1) ** 2.2, np.clip(np.cos(np.pi / 2 * (k - peak_at) / (1 - peak_at)), 0, 1) ** 1.6)
    tail = int(.35 * SR)
    moving = pan(np.concatenate([x * e, np.zeros(tail)]), np.concatenate([np.linspace(-width, width, n), np.full(tail, width)]))
    write(name, moving + 0.25 * room(x * e, 0.9, 0.2, 0.35), peak)

def click(fc=2400, body=170, dec=0.0016, bdec=0.007):
    """one soft tactile click: a damped noise tick with a little low body (no pitch)"""
    d = 0.06; n = int(d * SR)
    x = svf(noise(d), fc, 0.9) * np.exp(-np.arange(n) / (dec * SR))
    x += 0.35 * np.sin(2 * np.pi * body * t_(d)) * np.exp(-np.arange(n) / (bdec * SR))
    return lp1(x, 6500)

def tap(name, fc=2400, body=170, peak=0.22):
    write(name, room(click(fc, body), 0.45, 0.08, 0.12), peak)

def double_tap(name, a=(2200, 160), b=(2800, 190), gap=0.085, peak=0.24):
    x = np.zeros(int((gap + 0.08) * SR)); c1, c2 = click(*a), click(*b) * 0.8
    x[:len(c1)] += c1; s = int(gap * SR); x[s:s + len(c2)] += c2
    write(name, room(x, 0.5, 0.1, 0.15), peak)

def snap(name="snap", peak=0.28):
    """a magnetic snap: a muted low click, then a crisp one 16 ms later"""
    x = np.zeros(int(0.1 * SR)); c1 = click(1500, 120, 0.002, 0.01); c2 = click(3200, 210, 0.0012, 0.005) * 0.7
    x[:len(c1)] += c1; s = int(0.016 * SR); x[s:s + len(c2)] += c2
    write(name, room(x, 0.5, 0.1, 0.15), peak)

def thock(name, f0=105, f1=68, d=0.22, peak=0.32):
    """a soft felt thump: a short low sine with a padded attack"""
    n = int(d * SR)
    x = np.sin(2 * np.pi * np.cumsum(sweep(f0, f1, d)) / SR) * env_ad(n, 0.003, 0.05, 4.5)
    x += 0.15 * lp1(noise(d), 500) * np.exp(-np.arange(n) / (0.006 * SR))
    write(name, room(lp1(x, 700), 0.6, 0.12, 0.2), peak)

def sub(name="sub", d=1.3, peak=0.45):
    """a deep, soft sub hit, felt more than heard (no crack, no ring)"""
    n = int(d * SR)
    x = np.sin(2 * np.pi * np.cumsum(sweep(62, 44, d)) / SR) * env_ad(n, 0.012, 0.45, 3.2)
    x += 0.25 * lp1(noise(d), 120) * env_ad(n, 0.01, 0.2, 4)
    write(name, room(lp1(x, 180), 1.0, 0.18, 0.6), peak)

def gather(name="riser", d=1.4, peak=0.42):
    """air gathering towards a moment: rising filtered noise that stops dead on the cue (no tone)"""
    n = int(d * SR); k = np.linspace(0, 1, n)
    x = lp1(svf(pink(d), sweep(250, 2600, d), 0.6), 4000) * k ** 2.4
    x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    write(name, room(x, 0.9, 0.15, 0.2), peak)

def breath(name, d=1.6, peak=0.18):
    """a faint, bright airy lift for reveals (in place of sparkles and bells)"""
    n = int(d * SR)
    x = svf(pink(d), sweep(5000, 8000, d), 0.7) * env_ad(n, 0.35, 0.9, 2.5)
    write(name, room(lp1(x, 11000), 1.2, 0.3, 0.8), peak)

def warm(name="swell", d=2.2, peak=0.3):
    """a slow, warm low swell: dark noise and a quiet sub, rising and falling"""
    ts = t_(d); e = np.sin(np.pi * np.clip(ts / d, 0, 1)) ** 2
    x = lp1(pink(d), 260) * 0.8 + 0.4 * np.sin(2 * np.pi * 55 * ts)
    write(name, room(lp1(x, 400) * e, 1.2, 0.25, 0.6), peak)

if __name__ == "__main__":
    print("Synthesising sound effects into", OUT)
    # the names stay as the engine and lessons use them; each now holds the restrained sound
    air("whoosh"); air("whoosh_soft", 0.5, 400, 1400, 0.5, 0.5, 0.32, 2800); air("whoosh_low", 0.95, 160, 800, 0.6, 0.45, 0.45, 1600)
    air("slide", 0.38, 600, 1300, 0.45, 0.35, 0.26, 2600)
    tap("pop", 2300, 160, 0.24); thock("pop_low", 120, 80, 0.16, 0.22)
    tap("tick", 3200, 210, 0.14); tap("tick_low", 1900, 150, 0.14)
    tap("blip", 2600, 180, 0.14); tap("blip_hi", 3400, 220, 0.12)
    snap(); gather(); sub("impact"); thock("thud")
    double_tap("success"); thock("error", 90, 60, 0.18, 0.2)
    breath("shimmer"); breath("ding", 1.2, 0.14); warm()
