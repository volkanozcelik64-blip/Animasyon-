// ElevenLabs ile metin seslendirme. Anahtar .env içindeki ELEVENLABS_API_KEY'den okunur (asla yazdırılmaz).
// npx tsx scripts/seslendir.ts "Hey, I'm Nod!" assets/test-ses.mp3
// Ses: önce "Liam - Viral Short-Form Storyteller" aranır (hesap sesleri, sonra ses kütüphanesi);
// bulunamaz ya da API'den kullanılamazsa hazır "Liam" (TX3LPaxmHKxFdv7VOQHJ). Model: eleven_multilingual_v2.
// Hatalar olduğu gibi (HTTP durum kodu + yanıt gövdesi) gösterilir.
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(__dirname, '..');
const API = 'https://api.elevenlabs.io';
const ARANAN = 'Liam - Viral Short-Form Storyteller';
const YEDEK_SES = { voice_id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (hazır ses)' };
const MODEL = 'eleven_multilingual_v2';

function anahtar(): string {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const env = path.join(KOK, '.env');
  if (fs.existsSync(env)) {
    for (const satir of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
      const m = satir.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  throw new Error('ELEVENLABS_API_KEY bulunamadı (.env)');
}

async function istek(yol: string, secenek: RequestInit = {}) {
  const yanit = await fetch(API + yol, {
    ...secenek,
    headers: { 'xi-api-key': anahtar(), ...(secenek.headers ?? {}) },
  });
  return yanit;
}

async function hataGoster(baslik: string, yanit: Response) {
  console.error(`${baslik}: HTTP ${yanit.status} ${yanit.statusText}`);
  console.error(await yanit.text());
}

/** Aranan sesi bul: hesap sesleri → ses kütüphanesi (kütüphanedekini hesaba eklemeyi dener). */
async function sesBul(): Promise<{ voice_id: string; name: string; not: string }> {
  const ad = ARANAN.toLowerCase();
  const hesap = await istek(`/v2/voices?search=${encodeURIComponent('Liam')}&page_size=50`);
  if (!hesap.ok) await hataGoster('Hesap sesleri', hesap);
  else {
    const v = (await hesap.json()).voices?.find((x: any) => String(x.name).toLowerCase() === ad);
    if (v) return { voice_id: v.voice_id, name: v.name, not: 'hesapta bulundu' };
  }
  const kut = await istek(`/v1/shared-voices?search=${encodeURIComponent('Viral Short-Form Storyteller')}&page_size=20`);
  if (!kut.ok) { await hataGoster('Ses kütüphanesi', kut); return { ...YEDEK_SES, not: 'kütüphane aranamadı → yedek' }; }
  const s = (await kut.json()).voices?.find((x: any) => String(x.name).toLowerCase().includes('viral short-form storyteller'));
  if (!s) return { ...YEDEK_SES, not: 'kütüphanede bulunamadı → yedek' };
  // kütüphane sesini hesaba ekle (ücretsiz planda API'den izin verilmeyebilir)
  const ekle = await istek(`/v1/voices/add/${s.public_owner_id}/${s.voice_id}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_name: s.name }),
  });
  if (!ekle.ok) { await hataGoster('Kütüphane sesini ekleme', ekle); return { ...YEDEK_SES, not: 'kütüphane sesi API ile eklenemedi → yedek' }; }
  const eklenen = await ekle.json();
  return { voice_id: eklenen.voice_id ?? s.voice_id, name: s.name, not: 'kütüphaneden eklendi' };
}

async function seslendir(metin: string, cikti: string, ses: { voice_id: string; name: string }) {
  const yanit = await istek(`/v1/text-to-speech/${ses.voice_id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: metin, model_id: MODEL }),
  });
  if (!yanit.ok) { await hataGoster(`Seslendirme (${ses.name})`, yanit); return false; }
  fs.mkdirSync(path.dirname(cikti), { recursive: true });
  fs.writeFileSync(cikti, Buffer.from(await yanit.arrayBuffer()));
  console.log(`yazıldı ${path.relative(KOK, cikti)} — ses: ${ses.name} (${ses.voice_id}), model: ${MODEL}`);
  return true;
}

async function main() {
  const metin = process.argv[2] ?? "Hey, I'm Nod!";
  const cikti = path.resolve(process.argv[3] ?? path.join(KOK, 'assets', 'test-ses.mp3'));
  const ses = await sesBul();
  console.log(`ses: ${ses.name} — ${ses.not}`);
  const tamam = await seslendir(metin, cikti, ses);
  // seçilen ses kullanılamadıysa hazır Liam ile bir kez daha dene
  if (!tamam && ses.voice_id !== YEDEK_SES.voice_id) await seslendir(metin, cikti, YEDEK_SES);
}

main().catch((e) => {
  // ağ hataları (ör. proxy engeli) olduğu gibi
  console.error(e?.cause ? `${e.message}\n  neden: ${e.cause?.message ?? e.cause} ${e.cause?.code ?? ''}` : e);
  process.exit(1);
});
