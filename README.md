# Nod ile Matematik

Dört işlemi **Nod**'un (beyaz, kırmızı atkılı defter karakteri) süper güçleriyle çözdüğü, tarayıcıda çalışan matematik animasyonu.
Sahne bir defter sayfası; sayılar kalın, elle çizilmiş rakamlardır ve Nod onlarla fiziksel olarak boğuşur ("Animator vs Math" tarzı). Her işlemde farklı bir alet kullanır:

| İşlem | Silah | Ne oluyor? |
|---|---|---|
| ➕ Toplama | Mıknatıs | `+` işareti mıknatısa dönüşür, iki sayıyı çekip tek sayıda kaynaştırır. |
| ➖ Çıkarma | Çekiç | Eksilen sayı büyük sayıya yapışır, çekiç darbesiyle koparılıp uçurulur; kalan sayı küçülerek sayar. |
| ✖️ Çarpma | Sihirli değnek | İkinci sayı yıldızlara dönüşür, her yıldız bir kopya yaratır (`4 + 4 + 4`), sonra hepsi birleşir. |
| ➗ Bölme | Kılıç | Ninja tek hamlede sayıyı eşit parçalara keser, parçalar sonuca dönüşür. |

Gösteri: Nod yürüyerek gelir, el sallar ("Merhaba! Ben Nod.") ve zıplar → aletler tanıtılır → 8 soru (her biri "Sen de düşün!" geri sayımıyla) → karışık **Boss sorusu** `(6 + 2) × 3 ÷ 4` → kapanış ("Sen kaçını bildin? Yorumlara yaz!", göz kırpıp "Abone olmayı unutma!").

## Çalıştırma

Ek kurulum yok. `index.html` dosyasını tarayıcıda açıp **▶ Başlat**'a ya da sahneye tıkla.

## Özellikler

- **Kendi sorun:** `24 ÷ 4`, `9 - 4`, `6 x 3`, `20 / 4` gibi yazıp **Çöz!**
- **📱 Dikey (9:16)** mod: Shorts / Reels / TikTok için.
- **⏺ Video Kaydet:** gösteriyi baştan oynatır ve bitince sesli `.webm` olarak indirir (Chrome / Edge).
- Hız ayarı (0.75×–1.5×), duraklatma (Boşluk tuşu), müzik aç/kapa.
- Efektler: kamera yakınlaştırma, darbe anında donma (hit-stop), anime hız çizgileri, renk ters çevirme flaşı, çizgi roman patlama balonları, ışık huzmeleri, toz bulutları, ateş ve yıldız izleri, sakura yaprakları, havai fişekler.
- Tüm grafikler ve sesler kodla üretilir (Canvas + Web Audio); dış dosya yok.
