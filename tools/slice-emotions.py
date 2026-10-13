#!/usr/bin/env python3
"""assets/duygular.png -> assets/emotions/<duygu>.png (şeffaf arka planlı).

Her hücre elle ölçülmüş bir kutudan kırpılır (etiket yazısı hariç). Kağıt
arka planı, kırpıntının kenarından mürekkebe değmeden ulaşılabilen bölgedir;
o bölge "beyaza karşı renk-alfa" ile şeffaflaştırılır (kenar yumuşaklığı
korunur). Kontur içindeki beyaz dolgu (kafa, gövde) opak kalır.

    python3 tools/slice-emotions.py   # gerekli: pillow, numpy, scipy
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "duygular.png")
OUT = os.path.join(ROOT, "assets", "emotions")

# (dosya adı, x0, x1) — satırların y aralıkları etiket yazılarını dışarıda bırakır
# (dikeyde dolgu yok; yatayda PAD kadar pay bırakılır).
ROWS = [
    ((78, 232), [("mutlu", 286, 404), ("cok-mutlu", 452, 578), ("heyecanli", 646, 744),
                 ("gulen", 817, 885), ("sok-olmus", 949, 1047), ("kizgin", 1090, 1223)]),
    ((272, 401), [("somurtan", 315, 382), ("uzgun", 480, 559), ("aglayan", 648, 745),
                  ("huzunlu", 809, 900), ("hayal-kirikligi", 977, 1044),
                  ("hayal-kirikligi-2", 1125, 1195)]),
    ((432, 555), [("utangac", 313, 381), ("kizarmis", 489, 557), ("mahcup", 659, 741),
                  ("kafasi-karisik", 833, 907), ("dusunceli", 984, 1051)]),
    ((589, 705), [("yorgun", 316, 384), ("hasta", 481, 572), ("uyuyan", 653, 748),
                  ("sinirli", 838, 917), ("gizemli", 1037, 1127)]),
]
PAD = 6


def cut(img, x0, y0, x1, y1):
    a = np.asarray(img.crop((x0, y0, x1, y1)).convert("RGB")).astype(np.float32)
    # Kağıt rengini kenar piksellerinden kestir ve beyaza normalize et.
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    paper = np.median(border, axis=0)
    n = np.clip(a / paper * 255.0, 0, 255)

    lum = n.mean(2)
    sat = n.max(2) - n.min(2)
    ink = (lum < 200) | (sat > 40)
    # Kontur boşluklarını kapat ki dolgu dışarıya "sızmasın".
    sealed = ndimage.binary_closing(ink, structure=np.ones((3, 3)), iterations=2)
    lab, _ = ndimage.label(~sealed)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    # Arka plan maskesini kapatmanın yediği kenar piksellerini geri ver.
    bg |= ndimage.binary_dilation(bg, iterations=2) & ~ink

    # Beyaz arka plana karşı renk-alfa (GIMP "Color to Alpha" mantığı).
    alpha_bg = np.clip((255.0 - n).max(2) / 255.0, 0, 1)
    alpha_bg = np.clip((alpha_bg - 0.06) / 0.94, 0, 1)  # kağıt dokusunu sil
    alpha = np.where(bg, alpha_bg, 1.0)
    safe = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.where(bg[..., None], 255.0 - (255.0 - n) / safe, n)
    rgba = np.dstack([np.clip(rgb, 0, 255), alpha * 255.0]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    return out.crop(out.getbbox())


def main():
    img = Image.open(SRC)
    os.makedirs(OUT, exist_ok=True)
    for (y0, y1), cells in ROWS:
        for name, x0, x1 in cells:
            out = cut(img, x0 - PAD, y0, x1 + PAD, y1)
            out.save(os.path.join(OUT, name + ".png"))
            print(f"{name:20s} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main()
