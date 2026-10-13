// Önizleme/kare betikleri için balon yazı tipini (Patrick Hand) sayfaya gömer.
import fs from 'node:fs';
import path from 'node:path';
import { YAZI_AILESI, YAZI_DOSYASI } from '../src/karakter/Balon';

export function yaziCss(): string {
  const dosya = path.resolve(__dirname, '..', 'assets', YAZI_DOSYASI);
  const b64 = fs.readFileSync(dosya).toString('base64');
  return `<style>@font-face{font-family:'${YAZI_AILESI}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-weight:100 900;}</style>`;
}
