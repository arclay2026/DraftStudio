#!/usr/bin/env python3
"""Join a lesson's narration into one file and time every paragraph.

  python3 tools/align-audio.py colour "Color lesson.mp3" "Color lesson continuation.mp3"

Takes the recording in any number of pieces (in order), joins them into
audio/<lesson>.mp3, then finds the pause before each paragraph and writes
audio/<lesson>.json with the second each highlighted block starts, so the Learn
page highlights in step with the narrator. Needs ffmpeg and node.
The blocks come from js/academy-lessons.js (the same script as voiceover/).
"""
import json, os, re, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
key, pieces = sys.argv[1], sys.argv[2:]
if not pieces: sys.exit(__doc__)

# the lesson's blocks, as read aloud
js = ("global.window={};require(%r);const L=window.DS_LESSONS,i=L.findIndex(l=>l.key===%r);"
      "if(i<0){console.error('no lesson %s');process.exit(1)}console.log(JSON.stringify(window.DS_LESSON_SCRIPT(L[i],i).blocks))") % (os.path.join(ROOT, "js", "academy-lessons.js"), key, key)
blocks = json.loads(subprocess.check_output(["node", "-e", js]))

# 1. join the pieces (speech is fine at 96 kbps mono)
out = os.path.join(ROOT, "audio", key + ".mp3")
os.makedirs(os.path.dirname(out), exist_ok=True)
inputs = sum((["-i", p] for p in pieces), [])
chain = "".join(f"[{k}:a]" for k in range(len(pieces))) + f"concat=n={len(pieces)}:v=0:a=1[a]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", chain, "-map", "[a]", "-ar", "44100", "-ac", "1", "-b:a", "96k", out], check=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", out]))

# 2. every pause in the recording
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", out, "-af", "silencedetect=noise=-38dB:d=0.35", "-f", "null", "-"], capture_output=True, text=True).stderr
starts_ = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends_ = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
sil = [(a, b, b - a) for a, b in zip(starts_, ends_)]

# 3. pick the pauses between blocks: each block should last about as long as its text
#    takes to say, and paragraph breaks are usually the longer pauses
n, m = len(blocks), len(sil)
if m < n - 1: sys.exit(f"Only {m} pauses for {n} blocks: is this the right lesson?")
rate = (dur - sum(s[2] for s in sil)) / sum(len(b) for b in blocks)
exp = [len(b) * rate for b in blocks]
cost = lambda k, d, pause: (d - exp[k]) ** 2 / (exp[k] + 1) - 2.5 * min(pause, 1.5)
INF = float("inf")
dp = [[INF] * m for _ in range(n - 1)]
back = [[-1] * m for _ in range(n - 1)]
for j in range(m): dp[0][j] = cost(0, sil[j][0], sil[j][2])
for k in range(1, n - 1):
    for j in range(k, m):
        best, bi = INF, -1
        for i in range(k - 1, j):
            if dp[k - 1][i] < INF:
                v = dp[k - 1][i] + cost(k, sil[j][0] - sil[i][1], sil[j][2])
                if v < best: best, bi = v, i
        dp[k][j], back[k][j] = best, bi
last = min(range(m), key=lambda j: dp[n - 2][j] + ((dur - sil[j][1]) - exp[-1]) ** 2 / (exp[-1] + 1) if dp[n - 2][j] < INF else INF)
path = [last]
for k in range(n - 2, 0, -1): path.append(back[k][path[-1]])
path.reverse()
times = [0.0] + [round(max(0, sil[j][1] - .15), 2) for j in path]

with open(os.path.join(ROOT, "audio", key + ".json"), "w") as f:
    json.dump({"duration": round(dur, 2), "starts": times}, f)
print(f"audio/{key}.mp3: {dur / 60:.0f} min {dur % 60:.0f} s, {len(pieces)} piece(s) joined; audio/{key}.json: {n} blocks timed")
for k in range(n):
    end = sil[path[k]][0] if k < n - 1 else dur
    print(f"  {times[k]:7.2f}s  {end - times[k]:5.1f}s (text suggests {exp[k]:4.1f}s)  {blocks[k][:56]}")
