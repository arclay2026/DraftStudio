#!/usr/bin/env python3
"""Mixes a lesson video's soundtrack: the narration plus every sound effect the timeline scheduled.

    python3 mix.py events.json duration out.wav [--voice narration.mp3 --offset 6.4] [--sfx-level 0.55]

events.json is window.SFX from the engine: [{"n": name, "t": seconds, "g": gain, "p": pan}, …].
t is the moment the sound should *hit* (a riser's peak, a whoosh's loudest point), so the mixer
starts each file early by its HIT offset. The effects dip under the voice (sidechain ducking) and
the final mix is soft-limited; render.js then levels it to YouTube loudness (-14 LUFS).
"""
import json, os, subprocess, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
# seconds from the start of each file to its hit point
HIT = {"whoosh": 0.45, "whoosh_soft": 0.30, "whoosh_low": 0.70, "riser": 1.60, "swell": 1.2, "slide": 0.2,
       # the UI library (sfx_ui.py), used as "ui/<name>"
       "ui/whoosh": 0.275, "ui/whoosh_soft": 0.19, "ui/slide": 0.135, "ui/riser": 1.60, "ui/swell": 1.29}


def load_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()).T / 32768.0
    return x if x.shape[0] == 2 else np.vstack([x, x])


def load_any(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<f4").reshape(-1, 2).T.astype(np.float64)


def follow(x, attack=0.01, release=0.3):
    """an envelope follower on |x| (block-wise, fast enough for a few minutes of audio)"""
    a = np.abs(x).max(axis=0)
    hop = 240; n = len(a) // hop + 1
    blocks = np.array([a[i * hop:(i + 1) * hop].max() if i * hop < len(a) else 0 for i in range(n)])
    ka, kr = np.exp(-hop / (attack * SR)), np.exp(-hop / (release * SR))
    env = np.zeros(n); s = 0.0
    for i, v in enumerate(blocks):
        s = ka * s + (1 - ka) * v if v > s else kr * s + (1 - kr) * v
        env[i] = s
    return np.interp(np.arange(len(a)), np.arange(n) * hop, env)


def main():
    args = sys.argv[1:]
    def opt(k, d=None):
        if k in args:
            i = args.index(k); v = args[i + 1]; del args[i:i + 2]; return v
        return d
    voice, offset, level = opt("--voice"), float(opt("--offset", 0)), float(opt("--sfx-level", 0.55))
    events_path, duration, out = args[0], float(args[1]), args[2]
    n = int(duration * SR) + SR
    if not os.path.exists(os.path.join(HERE, "sfx", "whoosh.wav")):   # first run: synthesise the library
        subprocess.run([sys.executable, "-I", os.path.join(HERE, "sfx.py")], check=True)
    if not os.path.exists(os.path.join(HERE, "sfx", "ui", "whoosh.wav")):
        subprocess.run([sys.executable, "-I", os.path.join(HERE, "sfx_ui.py")], check=True)
    sfx = np.zeros((2, n)); cache = {}
    # restraint: small sounds never chatter. A small sound within 0.18 s of one already kept is dropped;
    # the big moments (air, impacts, swells) always play.
    BIG = {"whoosh", "whoosh_soft", "whoosh_low", "riser", "impact", "swell", "shimmer"}
    BIG |= {"ui/" + b for b in BIG} | {"ui/ding", "ui/success"}
    kept, last = [], -9
    for e in sorted(json.load(open(events_path)), key=lambda e: e["t"]):
        if e["n"] in BIG: kept.append(e); continue
        if e["t"] - last >= 0.18: kept.append(e); last = e["t"]
    print(f"{len(kept)} sound effects kept of {len(json.load(open(events_path)))}")
    for e in kept:
        name = e["n"]
        if name not in cache:   # a library name, or a path to any audio file (a lesson's own click, say)
            lib = os.path.join(HERE, "sfx", name + ".wav")
            cache[name] = load_wav(lib) if os.path.exists(lib) else load_any(name)
        x = cache[name] * e.get("g", 1)
        p = e.get("p", 0)
        if p: x = x * np.array([[min(1, 1 - p)], [min(1, 1 + p)]])
        s = int(round((e["t"] - HIT.get(name, 0)) * SR))
        if s < 0: x = x[:, -s:]; s = 0
        m = min(x.shape[1], n - s)
        if m > 0: sfx[:, s:s + m] += x[:, :m]
    mix = sfx * level
    if voice:
        v = load_any(voice); s = int(round(offset * SR))
        if s < 0: v = v[:, -s:]; s = 0          # a render that starts after the voice began
        m = min(v.shape[1], n - s)
        bus = np.zeros((2, n)); bus[:, s:s + m] = v[:, :m]
        # the effects dip by up to 7 dB while the voice speaks
        env = follow(bus)
        duck = 1 - 0.55 * np.clip(env / (np.percentile(env[env > 1e-4], 70) + 1e-9), 0, 1)
        mix = bus + sfx * level * duck
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)          # gentle soft limit
    mix = mix[:, :int(duration * SR)]
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1).T * 32767).astype("<i2").tobytes())
    print(f"Mixed {len(kept)} sound effects{' under the voice' if voice else ''} into {out}")


if __name__ == "__main__":
    main()
