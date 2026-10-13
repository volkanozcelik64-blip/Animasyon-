import React from 'react';
import { AbsoluteFill, Audio, Composition, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import * as Temel from './sahneler/NodTemel';
import * as Konusma from './sahneler/NodKonusma';
import * as Pil from './sahneler/NodPil';
import { YAZI_AILESI, YAZI_DOSYASI } from './karakter/Balon';

// balon yazı tipi (assets/fonts, public dizini assets): ilk kare çizilmeden önce yüklenir
if (typeof window !== 'undefined' && typeof FontFace !== 'undefined') {
  const bekle = delayRender('balon yazı tipi');
  const yazi = new FontFace(YAZI_AILESI, `url(${staticFile(YAZI_DOSYASI)})`);
  yazi.load().then((f) => { document.fonts.add(f); continueRender(bekle); }).catch(() => continueRender(bekle));
}

/** nod-temel: onaylanmış temel sahne. Yeni videolar src/karakter (Nod, hareketler) ve bu sahnenin
 *  yapısı (saf kare fonksiyonu + zaman çizelgesi) üzerine kurulur. */
const NodTemel: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Temel.Sahne kare={kare} />
    </AbsoluteFill>
  );
};

/** Lip sync testi: assets/ses.mp3 (public dizini: assets). */
const NodKonusma: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Konusma.Sahne kare={kare} />
      <Audio src={staticFile(Konusma.SES_DOSYASI)} />
    </AbsoluteFill>
  );
};

/** "1% Battery": konuşma yok; balonlar + sentezlenmiş ses efektleri (assets/sfx). */
const NodPil: React.FC = () => {
  const kare = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      <Pil.Sahne kare={kare} />
      {Pil.SESLER.map((s, i) => (
        <Sequence key={i} from={s.kare} durationInFrames={60}>
          <Audio src={staticFile(`sfx/${s.dosya}.wav`)} volume={s.ses ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="NodPil" component={NodPil} durationInFrames={Pil.SURE} fps={Pil.FPS} width={Pil.GENISLIK} height={Pil.YUKSEKLIK} />
    <Composition id="NodTemel" component={NodTemel} durationInFrames={Temel.SURE} fps={Temel.FPS} width={Temel.GENISLIK} height={Temel.YUKSEKLIK} />
    <Composition id="NodKonusma" component={NodKonusma} durationInFrames={Konusma.SURE} fps={Konusma.FPS} width={Konusma.GENISLIK} height={Konusma.YUKSEKLIK} />
  </>
);
