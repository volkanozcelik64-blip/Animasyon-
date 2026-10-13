"""Ses efektleri: dış kaynak yok, hepsi sentezle üretilir (numpy) → assets/sfx/*.wav (44.1 kHz, mono, 16 bit).
python3 scripts/sfx-uret.py
"""
import numpy as np, wave, os

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sfx')
rng = np.random.default_rng(7)  # sabit tohum: her çalıştırmada aynı ses


def t(sure):
    return np.arange(int(SR * sure)) / SR


def zarf(n, atak=0.005, birakma=0.1, sure=None):
    """basit ADSR benzeri: hızlı atak, üstel sönüm"""
    x = np.arange(n) / SR
    a = np.clip(x / max(atak, 1e-4), 0, 1)
    d = np.exp(-x / max(birakma, 1e-4))
    return a * d


def alcak_gecis(x, kesim):
    """tek kutuplu alçak geçiren (kesim Hz)"""
    a = np.exp(-2 * np.pi * kesim / SR)
    y = np.zeros_like(x)
    s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s
        y[i] = s
    return y


def yaz(ad, x, sessizlik=0.05):
    x = np.concatenate([x, np.zeros(int(SR * sessizlik))])
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.85
    with wave.open(os.path.join(OUT, ad + '.wav'), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    print('yazıldı', ad, f'{len(x) / SR:.2f} sn')


def ton(f, sure, dalga='sin'):
    tt = t(sure)
    faz = 2 * np.pi * np.cumsum(np.full_like(tt, f) if np.isscalar(f) else f) / SR
    if dalga == 'kare':
        return np.sign(np.sin(faz))
    if dalga == 'testere':
        return 2 * ((faz / (2 * np.pi)) % 1) - 1
    return np.sin(faz)


os.makedirs(OUT, exist_ok=True)

# düşük pil: iki kısa bip (kare dalga, yumuşatılmış)
bip = alcak_gecis(ton(880, 0.12, 'kare'), 3000) * zarf(int(SR * 0.12), 0.003, 0.08)
yaz('dusuk-pil', np.concatenate([bip, np.zeros(int(SR * 0.08)), bip]))

# "dun-dun!": iki alçak, sert vuruş (testere + alt oktav), ikincisi daha uzun
def dun(f, sure):
    x = ton(f, sure, 'testere') + 0.6 * ton(f / 2, sure)
    return alcak_gecis(x, 900) * zarf(len(x), 0.004, sure * 0.45)
yaz('dun-dun', np.concatenate([dun(98, 0.35), np.zeros(int(SR * 0.12)), dun(92, 0.9)]))

# whoosh: frekansı kayan filtreli gürültü
n = int(SR * 0.4); g = rng.standard_normal(n)
kes = np.linspace(400, 3500, n) * np.sin(np.linspace(0, np.pi, n)) + 200
y = np.zeros(n); s = 0.0
for i in range(n):
    a = np.exp(-2 * np.pi * kes[i] / SR); s = (1 - a) * g[i] + a * s; y[i] = s
yaz('whoosh', y * np.sin(np.linspace(0, np.pi, n)) ** 1.5)

# çekmece: tahta sürtünmesi (alçak gürültü, titreşimli) + sonda tok vuruş
n = int(SR * 0.45); g = alcak_gecis(rng.standard_normal(n), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t(0.45)))
g *= np.clip(np.linspace(0, 6, n), 0, 1) * np.clip(np.linspace(6, 0, n), 0, 1)
vurus = alcak_gecis(rng.standard_normal(int(SR * 0.08)), 500) * zarf(int(SR * 0.08), 0.001, 0.02) * 2.5
yaz('cekmece', np.concatenate([g, vurus]))

# bonk: hızla düşen perde (sinüs 320→70 Hz) + tok darbe
n = int(SR * 0.3); f = np.geomspace(320, 70, n)
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * zarf(n, 0.002, 0.12)
x[: int(SR * 0.01)] += rng.standard_normal(int(SR * 0.01)) * 0.6
yaz('bonk', x)

# ding: zil (temel + uyumsuz kısmi tonlar, uzun sönüm)
n = int(SR * 1.3); tt = t(1.3)
x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in
        [(1318.5, 1.0, 0.6), (2637, 0.35, 0.35), (3550, 0.18, 0.2), (659.3, 0.25, 0.8)])
yaz('ding', x * np.clip(tt / 0.003, 0, 1))

# balon pop: kısa yukarı kayan sinüs + tık
n = int(SR * 0.07); f = np.geomspace(500, 1400, n)
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * zarf(n, 0.001, 0.025)
yaz('pop', x)

# lamba tık: çok kısa iki parçalı tık
k1 = alcak_gecis(rng.standard_normal(int(SR * 0.012)), 4000) * zarf(int(SR * 0.012), 0.0005, 0.004)
k2 = alcak_gecis(rng.standard_normal(int(SR * 0.01)), 2500) * zarf(int(SR * 0.01), 0.0005, 0.003) * 0.6
yaz('tik', np.concatenate([k1, np.zeros(int(SR * 0.025)), k2]))
