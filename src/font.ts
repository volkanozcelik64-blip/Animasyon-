import {continueRender, delayRender, staticFile} from 'remotion';

// Yerel yazı tipleri (SIL OFL), assets/fonts içinden yüklenir.
export const YAZI = '"Patrick Hand", "Comic Sans MS", sans-serif'; // el yazısı başlıklar
export const ETIKET = '"PT Sans Narrow", "Arial Narrow", sans-serif'; // referans görseldeki etiketler

const yukle = (ad: string, dosya: string) => {
  const h = delayRender(`${ad} yükleniyor`);
  new FontFace(ad, `url(${staticFile(dosya)})`)
    .load()
    .then((y) => {
      (document.fonts as unknown as Set<FontFace>).add(y);
      continueRender(h);
    })
    .catch(() => continueRender(h));
};

if (typeof document !== 'undefined') {
  yukle('Patrick Hand', 'fonts/PatrickHand-Regular.ttf');
  yukle('PT Sans Narrow', 'fonts/PTSansNarrow-Regular.ttf');
}
