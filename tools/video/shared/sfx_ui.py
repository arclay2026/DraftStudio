#!/usr/bin/env python3
"""A second sound library in the style of a phone's interface sounds: glassy taps, bubbly pops, clean
two-note chimes, airy swishes, soft haptic thumps and a keynote-style hit. Original sounds, synthesised
from sines, bell partials and filtered noise (no samples, nothing copied).

    python3 -I tools/video/shared/sfx_ui.py      writes tools/video/shared/sfx/ui/<name>.wav

Use them from a video with sfx("ui/<name>", time, gain, pan); mix.py knows their hit points.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import sfx as base                      # the shared filters, reverb and writer
from sfx import SR, t_, noise, pink, env_ad, svf, lp1, sweep, osc, room, pan

base.OUT = os.path.join(base.OUT, "ui")
write = base.write
rng = np.random.default_rng(11)


def hp1(x, fc):
    return x - lp1(x, fc)


def bell(f, d, partials=((1, 1), (2.0, .32), (3.01, .12), (4.16, .05), (5.43, .03)), dec=4.0):
    """a glass/bell note: a few partials, the higher ones dying faster"""
    ts = t_(d); x = np.zeros_like(ts)
    for r, a in partials:
        x += a * np.sin(2 * np.pi * f * r * ts) * np.exp(-dec * (1 + (r - 1) * .9) * ts / d)
    return x * env_ad(len(ts), .0015, d, 1.0)


def click(d=0.004, fc=5000):
    """a tiny bright transient"""
    x = hp1(noise(d), fc) * np.exp(-np.arange(int(d * SR)) / (0.0009 * SR))
    return x


def place(n, *parts):
    """sum (offset seconds, signal) parts into a buffer n seconds long"""
    out = np.zeros(int(n * SR))
    for o, s in parts:
        i = int(o * SR); m = min(len(s), len(out) - i)
        if m > 0: out[i:i + m] += s[:m]
    return out


# ---------- taps and pops ----------
def tap(name="tap", f=2350, peak=.32):
    """a glassy 'tink': a short bright bell with a crisp edge"""
    x = place(.25, (0, bell(f, .22, dec=7)), (0, .35 * click()))
    write(name, room(x, .7, .12, .25), peak)

def tick(name="tick", peak=.22):
    """a keyboard-like tick: a click with a short wooden body"""
    ts = t_(.03)
    body = np.sin(2 * np.pi * 1150 * ts) * np.exp(-ts / .006)
    write(name, room(place(.05, (0, body), (0, .6 * click(.003, 3500))), .5, .06, .1), peak)

def pop(name="pop", f0=520, f1=1250, d=.075, peak=.4):
    """a bubbly pop: a quick upward pitch flick with a round body"""
    n = int(d * SR)
    x = osc(sweep(f0, f1, d)) * env_ad(n, .003, d, 3.5)
    x += .25 * osc(sweep(f0 * 2, f1 * 2, d)) * env_ad(n, .002, d * .6, 5)
    write(name, room(place(d + .05, (0, x)), .6, .1, .2), peak)

def snap(name="snap", peak=.36):
    """a crisp latch: two clicks and a small metallic ping, like something clicking into place"""
    ping = bell(1760, .12, ((1, 1), (2.7, .4), (5.1, .15)), dec=9)
    x = place(.16, (0, .9 * click(.004, 3000)), (.011, click(.004, 4500)), (.011, .45 * ping))
    write(name, room(x, .6, .1, .2), peak)

def thud(name="thud", peak=.42):
    """a soft haptic thump: felt more than heard"""
    d = .16; n = int(d * SR)
    x = osc(sweep(92, 50, d)) * env_ad(n, .004, d, 3.2)
    x += .12 * lp1(noise(d), 500) * env_ad(n, .002, .03, 4)
    write(name, room(x, .7, .08, .2), peak)

# ---------- air ----------
def swish(name="whoosh", d=.55, f0=500, f1=3200, peak_at=.5, peak=.42, p0=-.6, p1=.6):
    """a clean airy swish: smooth band of air sweeping up then settling, panning across"""
    n = int(d * SR); k = np.linspace(0, 1, n)
    fc = np.where(k < peak_at, f0 * (f1 / f0) ** (k / peak_at), f1 * (f0 * 1.6 / f1) ** ((k - peak_at) / (1 - peak_at)))
    x = svf(pink(d), fc, q=1.1)
    e = np.where(k < peak_at, (k / peak_at) ** 2.2, np.exp(-5 * (k - peak_at) / (1 - peak_at)))
    x = hp1(lp1(x * e, 9000), 250)
    st = pan(x, np.linspace(p0, p1, n))
    write(name, np.array([room(st[0], .8, .14, .3)[0], room(st[1], .8, .14, .3)[1]]), peak)

def riser(name="riser", d=1.6, peak=.36):
    """a smooth tonal rise into the cue: air and a soft glide, cut clean on the beat"""
    n = int(d * SR); k = np.linspace(0, 1, n)
    air = svf(pink(d), sweep(400, 5000, d), .9) * k ** 2.2
    glide = osc(sweep(220, 880, d), "tri") * k ** 2.6 * (.75 + .25 * np.sin(2 * np.pi * sweep(5, 16, d).cumsum() / SR))
    x = .7 * air + .18 * lp1(glide, 3000)
    x[-int(.012 * SR):] *= np.linspace(1, 0, int(.012 * SR))
    write(name, room(x, .9, .12, .2), peak)

def slide(name="slide", peak=.24):
    """a soft slide, like a card moving across glass"""
    swish(name, .3, 900, 2600, .45, peak, -.2, .2)

# ---------- chimes ----------
def ding(name="ding", peak=.34):
    """a clean two-note chime: a fifth up, glassy and bright"""
    x = place(1.4, (0, bell(1568, 1.2)), (.085, .9 * bell(2349, 1.2)))
    write(name, room(x, 1.1, .28, .9), peak)

def shimmer(name="shimmer", peak=.26):
    """four quick glass notes rising (a pentatonic sparkle), wide and airy"""
    notes = [1047, 1319, 1568, 2093]
    parts = [(i * .055, (.8 + .1 * i) * bell(f, .9, dec=5.5)) for i, f in enumerate(notes)]
    x = place(1.3, *parts)
    l = place(1.3, *[(o, s * (1.1 - .25 * i)) for i, (o, s) in enumerate(parts)])
    r = place(1.3, *[(o, s * (.6 + .25 * i)) for i, (o, s) in enumerate(parts)])
    write(name, np.array([room(l, 1.2, .3, .9)[0], room(r, 1.2, .3, .9)[1]]), peak)

def success(name="success", peak=.32):
    """a rising major chime (three notes), the 'done' sound"""
    x = place(1.4, (0, bell(1319, 1.1)), (.07, bell(1661, 1.1)), (.14, 1.1 * bell(1976, 1.2)))
    write(name, room(x, 1.1, .26, .9), peak)

# ---------- big moments ----------
def impact(name="impact", peak=.62):
    """a keynote-style hit: a deep soft boom, a low air burst and a high glass ring under it"""
    d = 1.6; n = int(d * SR); ts = t_(d)
    boom = osc(sweep(64, 36, d)) * env_ad(n, .006, .9, 3.6)
    burst = lp1(noise(d), 380) * env_ad(n, .003, .18, 4) * .5
    glass = (bell(1319, 1.4, dec=3) + .7 * bell(1976, 1.4, dec=3.4) + .4 * bell(2637, 1.4, dec=4)) * .07
    x = boom + burst + place(d, (.01, glass))
    write(name, room(x, 1.2, .22, 1.0), peak)

def swell(name="swell", d=2.2, peak=.3):
    """a warm, slowly opening chord (no attack), for the final reveal"""
    ts = t_(d); e = np.sin(np.pi * np.clip(ts / d, 0, 1) * .85) ** 2
    x = sum(a * np.sin(2 * np.pi * f * ts) + a * .5 * np.sin(2 * np.pi * f * 1.003 * ts) for f, a in ((262, 1), (330, .7), (392, .6), (523, .4), (659, .2)))
    write(name, room(lp1(x * e, 2400), 1.2, .3, .8), peak)


if __name__ == "__main__":
    print("Synthesising UI sound effects into", base.OUT)
    tap(); tap("tap_hi", 3136, .26); tick()
    pop(); pop("pop_low", 360, 860, .09, .38)
    snap(); thud()
    swish(); swish("whoosh_soft", .38, 700, 2800, .5, .3, .5, -.5); riser(); slide()
    ding(); shimmer(); success()
    impact(); swell()
