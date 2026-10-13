// Atkının sarkan ucu için gecikmeli sallanma (follow-through): iki bağlı, sönümlü yay.
// Girdi: her karede boyun noktasının dünya konumu ve gövde eğimi. Çıktı: AtkiUcu a1/a2 açıları.
// Kök bölüm boynun hareketine geç kalır; alt bölüm kök bölüme daha da geç kalır → kamçı etkisi.

export interface AtkiDurumu { a1: number; a2: number }

export class AtkiYayi {
  private a1 = 0; private v1 = 0;
  private a2 = 0; private v2 = 0;
  private onceX?: number; private onceY?: number;
  private onceVx = 0; private onceVy = 0;

  constructor(
    private sertlik1 = 0.16, private sonum1 = 0.80,
    private sertlik2 = 0.22, private sonum2 = 0.76,
    private kazanc = 1.3,
  ) {}

  /** Bir kare ilerlet. boyunX/Y: dünya birimi, egim: gövde eğimi (derece). */
  adim(boyunX: number, boyunY: number, egim = 0): AtkiDurumu {
    const vx = this.onceX === undefined ? 0 : boyunX - this.onceX;
    const vy = this.onceY === undefined ? 0 : boyunY - this.onceY;
    const ax = vx - this.onceVx;
    this.onceX = boyunX; this.onceY = boyunY; this.onceVx = vx; this.onceVy = vy;

    return this.ilerle(ax, egim);
  }

  /** İvmeyle ilerlet (yerel x ivmesi; dönüp aynalanınca konum sıçraması atkıyı fırlatmasın diye). */
  ilerle(ax: number, egim = 0, vx = 0): AtkiDurumu {
    // Uç yerçekimiyle aşağı sarkmak ister: gövde eğilince yerel açısı -egim'e çekilir.
    // Boyun +x'e ivmelenince uç geride kalır → +açı (saat yönü, -x tarafına savrulur).
    // Alt bölüm, kök bölümün açısal hızına geç kalır (kamçı).
    // hızla giderken rüzgâr: uç geriye savrulur (vx: yerel x hızı, + ileri)
    const hedef1 = -egim + Math.max(-75, Math.min(75, vx * 7));
    this.v1 += (hedef1 - this.a1) * this.sertlik1 + ax * this.kazanc;
    this.v1 *= this.sonum1;
    this.a1 += this.v1;
    this.v2 += (-this.a2) * this.sertlik2 - this.v1 * 0.35;
    this.v2 *= this.sonum2;
    this.a2 += this.v2;
    const sinir = (x: number, m: number) => Math.max(-m, Math.min(m, x));
    this.a1 = sinir(this.a1, 70); this.a2 = sinir(this.a2, 50);
    return { a1: this.a1, a2: this.a2 };
  }
}

/** Kısa yol: bir boyun yolu için tüm karelerin atkı açıları. */
export function atkiSimule(yol: { x: number; y: number; egim?: number }[]): AtkiDurumu[] {
  const y = new AtkiYayi();
  return yol.map((p) => y.adim(p.x, p.y, p.egim ?? 0));
}
