import {continueRender, delayRender, staticFile} from 'remotion';

// Patrick Hand (SIL OFL) — el yazısı etiketler için, yerel dosyadan yüklenir.
export const YAZI = '"Patrick Hand", "Comic Sans MS", sans-serif';

if (typeof document !== 'undefined') {
  const h = delayRender('Patrick Hand yükleniyor');
  const f = new FontFace('Patrick Hand', `url(${staticFile('PatrickHand-Regular.ttf')})`);
  f.load()
    .then((y) => {
      (document.fonts as unknown as Set<FontFace>).add(y);
      continueRender(h);
    })
    .catch(() => continueRender(h));
}
