#!/usr/bin/env python3
"""GT-R vs C8 belgeseli için prosedürel müzik + ses efekti bedeni (telifsiz, sentezlenmiş).

Çıktı: public/tesla_togg/audio/music_tt.wav (stereo, 44.1 kHz)
Zaman çizelgesi seslendirme duraklamalarına ve sahne sınırlarına bağlıdır.
"""
import wave
import numpy as np

SR = 44100
DUR = 68.6
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def env(a, d):
    """[a, a+d] aralığında 0..1 yükselen eğri ( tam uzunlukta dizi )."""
    return np.clip((t - a) / d, 0, 1)


def lowpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def highpass(x, fc):
    return x - lowpass(x, fc)


def add(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    seg = sig[: N - i] * gain
    buf[0, i : i + len(seg)] += seg * (1 - max(pan, 0))
    buf[1, i : i + len(seg)] += seg * (1 + min(pan, 0))


out = np.zeros((2, N))

# --- Drone (La minör temelli): 55, 82.4, 110, 164.8 Hz, hafif ayarsız, yavaş LFO ---
drone = np.zeros(N)
for f, g in [(55.0, 0.55), (82.41, 0.35), (110.0, 0.28), (164.81, 0.14), (220.0, 0.07)]:
    for det in (-0.35, 0.0, 0.35):
        lfo = 1 + 0.12 * np.sin(2 * np.pi * (0.07 + 0.01 * det) * t + det)
        drone += g * lfo * np.sin(2 * np.pi * (f + det) * t + det)
drone = lowpass(drone, 520)
# Sahneye göre parlaklık/şiddet
level = 0.35 + 0.25 * env(9.7, 4) + 0.2 * env(22, 6) + 0.1 * env(46.5, 4) - 0.2 * env(63.5, 2.5)
level *= env(0, 2.5) * (1 - env(DUR - 3.0, 3.0))
drone *= level
out[0] += drone * 0.55
out[1] += drone * 0.55

# --- Açılış vuruşu ---
boom_t = np.arange(int(SR * 3.0)) / SR
boom = np.sin(2 * np.pi * (48 * np.exp(-boom_t * 1.3)) * boom_t) * np.exp(-boom_t * 1.4)
boom += 0.4 * lowpass(rng.standard_normal(len(boom_t)), 300) * np.exp(-boom_t * 3.0)
add(out, boom, 0.0, 0.75)


def kick(gain=0.5):
    kt = np.arange(int(SR * 0.5)) / SR
    ph = 2 * np.pi * (42 * kt + (110 - 42) * (1 - np.exp(-kt * 28)) / 28)
    return np.sin(ph) * np.exp(-kt * 9) * gain


def tick(gain=0.15, f=2400):
    kt = np.arange(int(SR * 0.05)) / SR
    return highpass(rng.standard_normal(len(kt)), f) * np.exp(-kt * 90) * gain


def riser(dur, gain=0.35):
    rt = np.arange(int(SR * dur)) / SR
    n = highpass(rng.standard_normal(len(rt)), 1200)
    return n * (rt / dur) ** 2.2 * gain


def impact(gain=0.6):
    it = np.arange(int(SR * 1.6)) / SR
    s = np.sin(2 * np.pi * (60 * np.exp(-it * 2.0)) * it) * np.exp(-it * 3.2)
    s += 0.35 * lowpass(rng.standard_normal(len(it)), 600) * np.exp(-it * 7)
    return s * gain


# --- Nabız (70 BPM) 5.0 → 65.4 s, şiddet sahneye göre ---
beat = 60 / 70
b = 9.75
while b < 61.0:
    g = 0.34
    if 22.0 <= b < 37.7:
        g = 0.46
    if 46.5 <= b < 61.0:
        g = 0.3
    add(out, kick(g), b, 1.0)
    if 22.0 <= b < 46.5:
        add(out, tick(0.10), b + beat / 2, 1.0, pan=0.3)
    b += beat

# --- Sahne geçişleri: riser + vuruş ---
for sec in (9.75, 21.95, 37.7, 46.55, 61.2):
    add(out, riser(1.1), sec - 1.1, 0.7, pan=-0.2)
    add(out, impact(0.55), sec, 1.0)

# --- Sayısal ifşa vuruşları + sayaç tıkları ---
for start, end in ((24.5, 26.4), (28.96, 31.5), (32.04, 34.6), (40.8, 42.0), (42.7, 43.7), (44.2, 45.3), (45.7, 46.4)):
    x = start
    while x < end:
        add(out, tick(0.12, 3200), x, 1.0, pan=0.2)
        x += 0.075
for hit in (26.45, 31.55, 34.65, 42.05, 43.75, 45.35):
    add(out, impact(0.6), hit, 1.0)

# --- Duygusal bölüm (46.6–61.2): ısınan majör akor (C-E-G), yavaş yükselen ---
warm = np.zeros(N)
for f, g in [(130.81, 0.5), (164.81, 0.4), (196.0, 0.4), (261.63, 0.3), (329.63, 0.18)]:
    for det in (-0.4, 0.0, 0.4):
        warm += g * np.sin(2 * np.pi * (f + det) * t + det)
warm = lowpass(warm, 900)
warm *= env(46.6, 5.0) * (1 - env(61.0, 2.5)) * 0.22 * (1 + 0.5 * env(55.6, 4.0))
out[0] += warm
out[1] += warm

# --- Final: "Sen hangisini seçerdin?" ---
add(out, impact(0.8), 63.8, 1.0)

# Yumuşak sınırlama ve normalleştirme (tepe ≈ -3 dBFS)
out = np.tanh(out * 1.1)
out *= 0.7 / np.max(np.abs(out))
pcm = (out.T * 32767).astype("<i2")
with wave.open("public/tesla_togg/audio/music_tt.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", DUR, "s")
