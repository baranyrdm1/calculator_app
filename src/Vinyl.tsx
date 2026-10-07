import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

// ============================================================================
// AYARLAR — tüm sabitler burada. 1920x1080'e geçmek için WIDTH/HEIGHT'i değiştir.
// ============================================================================
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const DURATION = 10; // saniye
export const DURATION_FRAMES = Math.round(DURATION * FPS);

export const MOTION_ENABLED = true; // süzülme + plak dönüşü
export const INTRO_ENABLED = true; // kırmızı giriş

// Yerleşim — kenarlarda ve altta şarkı sözleri için boşluk
const VINYL_DIAMETER_RATIO = 0.62; // ekranın kısa kenarına oranı
const VINYL_CENTER_X = 0.5; // ekran genişliğine oran
const VINYL_CENTER_Y = 0.38; // ekran yüksekliğine oran (altta söz alanı kalır)

// Plak detayları
const GROOVE_COUNT = 110; // ince oluk sayısı
const TRACK_GAPS = 5; // parçalar arası boşluk halkaları
const LABEL_RATIO = 0.34; // etiket yarıçapı / plak yarıçapı
const GROOVE_INNER = 0.38; // oluklu alanın iç sınırı (plak yarıçapına oran)
const GROOVE_OUTER = 0.975;
const SHEEN_ANGLE = -135; // sabit ışık yansımasının açısı (derece, sol üst)
const SHEEN_OPACITY = 0.42;
const SHEEN_WIDTH = 15; // yansıma kamasının yarı açısı (derece)
const LABEL_BASE = '#e8dcc0';
const LABEL_ACCENT = '#c8642c';

// Dönüş: hız(t) = ROT_BASE + ROT_AMP * sin(2π t / ROT_PERIOD + ROT_PHASE)  [derece/sn]
export const ROT_BASE = 18;
export const ROT_AMP = 14;
export const ROT_PERIOD = 3.2;
export const ROT_PHASE = 0.6;
export const ROT_DIRECTION = -1; // -1 = saat yönünün tersi (SVG'de pozitif açı saat yönü)

// Süzülme (genlikler ve periyotlar)
const FLOAT_X = 6; // px
const FLOAT_Y = 5; // px
const FLOAT_SCALE = 0.025; // ±%2.5
const FLOAT_PERIODS = [1.7, 4.1, 5.3]; // sn

// Giriş / çıkış zamanlaması (sn)
const INTRO_BLACK_END = 0.4;
const INTRO_RED_END = 1.4;
const INTRO_END = 2.0;
const INTRO_SCALE_FROM = 1.06;
const INTRO_BLUR_FROM = 8;
const INTRO_BLUR_TO = 2;
const INTRO_FLASH = 0.1; // geçişte %10 parlaklık patlaması
const INTRO_RED = '#ff1a1a';
const OUTRO_FADE = 0.4;

const SEED = 7351;

// ============================================================================

// Sabit seed'li üreteç (mulberry32) — her render aynı sonucu verir.
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const speedAt = (t: number) => ROT_BASE + ROT_AMP * Math.sin((TAU * t) / ROT_PERIOD + ROT_PHASE);

// Açı = hızın integrali; kare kare kümülatif toplam (yamuk kuralı).
const ANGLE_TABLE: number[] = (() => {
  const dt = 1 / FPS;
  const table = [0];
  for (let f = 1; f <= DURATION_FRAMES; f++) {
    table.push(table[f - 1] + ((speedAt((f - 1) * dt) + speedAt(f * dt)) / 2) * dt);
  }
  return table;
})();

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
};

const arcPath = (r: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)}`;
};

const sectorPath = (r: number, a0: number, a1: number) =>
  `M 0 0 L ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;

// Sabit seed'le üretilen plak verisi (oluk parlaklıkları, parça boşlukları, düzensizlikler)
const buildRecordData = () => {
  const rand = mulberry32(SEED);
  const grooves = Array.from({length: GROOVE_COUNT}, (_, i) => ({
    r: GROOVE_INNER + ((GROOVE_OUTER - GROOVE_INNER) * i) / (GROOVE_COUNT - 1),
    o: 0.025 + rand() * 0.045,
  }));
  const gaps = Array.from({length: TRACK_GAPS}, (_, i) => {
    const base = GROOVE_INNER + ((GROOVE_OUTER - GROOVE_INNER) * (i + 1)) / (TRACK_GAPS + 1);
    return base + (rand() - 0.5) * 0.05;
  });
  // Dönen düzensizlikler: kısa, farklı parlaklıkta yaylar — dönüşü olukta da görünür kılar
  const marks = Array.from({length: 26}, () => {
    const a0 = rand() * TAU;
    return {
      r: GROOVE_INNER + 0.02 + rand() * (GROOVE_OUTER - GROOVE_INNER - 0.04),
      a0,
      a1: a0 + (0.25 + rand() * 0.9),
      w: 0.004 + rand() * 0.01,
      o: 0.035 + rand() * 0.05,
    };
  });
  return {grooves, gaps, marks};
};
const RECORD = buildRecordData();

// Özgün, yazısız etiket: krem zemin, yarım güneş bandı, ince halkalar.
const Label: React.FC<{R: number; id: string; unit: number}> = ({R, id, unit}) => {
  const lr = R * LABEL_RATIO;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-lab`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f3ead6" />
          <stop offset="1" stopColor={LABEL_BASE} />
        </radialGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8a050" />
          <stop offset="1" stopColor={LABEL_ACCENT} />
        </linearGradient>
        <clipPath id={`${id}-labclip`}>
          <circle r={lr} />
        </clipPath>
      </defs>
      <circle r={lr} fill={`url(#${id}-lab)`} />
      <g clipPath={`url(#${id}-labclip)`}>
        {/* alt yarıda batan güneş ve üç yatay şerit */}
        <circle cx={0} cy={lr * 0.28} r={lr * 0.42} fill={`url(#${id}-sun)`} />
        <rect x={-lr} y={lr * 0.3} width={2 * lr} height={lr} fill="#2f2a26" />
        <rect x={-lr} y={lr * 0.42} width={2 * lr} height={lr * 0.05} fill={LABEL_ACCENT} opacity={0.85} />
        <rect x={-lr} y={lr * 0.56} width={2 * lr} height={lr * 0.035} fill={LABEL_ACCENT} opacity={0.6} />
        <rect x={-lr} y={lr * 0.68} width={2 * lr} height={lr * 0.025} fill={LABEL_ACCENT} opacity={0.4} />
      </g>
      <circle r={lr * 0.97} fill="none" stroke="#000" strokeOpacity={0.18} strokeWidth={1 * unit} />
      <circle r={lr * 0.3} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={1 * unit} />
      <circle r={lr} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={1.5 * unit} />
    </g>
  );
};

const Record: React.FC<{id: string; angle: number; unit: number; R: number}> = ({id, angle, unit, R}) => {
  const lr = R * LABEL_RATIO;
  const sheenSectors = (center: number, opacity: number, half: number) =>
    // açısal yumuşaklık için iç içe kamalar
    [1, 0.7, 0.45, 0.25].map((k, i) => (
      <path
        key={i}
        d={sectorPath(R * 1.02, (center - half / k) * DEG, (center + half / k) * DEG)}
        fill="#ffffff"
        fillOpacity={opacity * 0.3}
      />
    ));

  return (
    <g>
      <defs>
        <radialGradient id={`${id}-vinyl`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#060606" />
          <stop offset="0.7" stopColor="#0d0d0e" />
          <stop offset="0.97" stopColor="#111113" />
          <stop offset="1" stopColor="#1a1a1c" />
        </radialGradient>
        {/* ışık oluklu alanda, dışa doğru güçlenir */}
        <radialGradient id={`${id}-ringfade`} cx="0" cy="0" r={R} gradientUnits="userSpaceOnUse">
          <stop offset={GROOVE_INNER - 0.02} stopColor="#fff" stopOpacity="0" />
          <stop offset={GROOVE_INNER + 0.08} stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.7" />
        </radialGradient>
        <mask id={`${id}-ringmask`} maskUnits="userSpaceOnUse" x={-R} y={-R} width={2 * R} height={2 * R}>
          <circle r={R} fill={`url(#${id}-ringfade)`} />
        </mask>
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={R * 0.07} />
        </filter>
        <radialGradient id={`${id}-labsheen`} cx="0.3" cy="0.25" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-disc`}>
          <circle r={R} />
        </clipPath>
      </defs>

      {/* plak gövdesi */}
      <circle r={R} fill={`url(#${id}-vinyl)`} />

      {/* SABİT oluklar (dairesel simetrik; dönmeleri fark etmez) */}
      {RECORD.grooves.map((g, i) => (
        <circle key={i} r={g.r * R} fill="none" stroke="#fff" strokeOpacity={g.o} strokeWidth={0.8 * unit} />
      ))}
      {RECORD.gaps.map((g, i) => (
        <g key={`gap${i}`}>
          <circle r={g * R} fill="none" stroke="#000" strokeWidth={2.2 * unit} />
          <circle r={g * R + 2.2 * unit} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={0.8 * unit} />
        </g>
      ))}
      {/* çıkış (run-out) bölgesi: etiket çevresinde pürüzsüz, parlak siyah */}
      <circle r={R * (GROOVE_INNER - 0.01)} fill="#070707" />
      <circle r={R * (GROOVE_INNER - 0.01)} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={1 * unit} />

      {/* DÖNEN katman: etiket + olukta düzensizlikler */}
      <g transform={`rotate(${angle})`}>
        {RECORD.marks.map((m, i) => (
          <path
            key={`m${i}`}
            d={arcPath(m.r * R, m.a0, m.a1)}
            fill="none"
            stroke="#fff"
            strokeOpacity={m.o}
            strokeWidth={m.w * R}
            strokeLinecap="round"
          />
        ))}
        <Label R={R} id={`${id}-label`} unit={unit} />
      </g>

      {/* SABİT ışık: karşılıklı iki yumuşak yansıma kaması (plak döner, ışık yerinde kalır) */}
      <g clipPath={`url(#${id}-disc)`}>
        <g mask={`url(#${id}-ringmask)`}>
          <g filter={`url(#${id}-soft)`}>
            {sheenSectors(SHEEN_ANGLE, SHEEN_OPACITY, SHEEN_WIDTH)}
            {sheenSectors(SHEEN_ANGLE + 180, SHEEN_OPACITY * 0.7, SHEEN_WIDTH * 0.8)}
            {sheenSectors(SHEEN_ANGLE + 62, SHEEN_OPACITY * 0.25, SHEEN_WIDTH * 0.5)}
          </g>
          {/* yansıma bölgesinde oluklar parlar */}
          {RECORD.grooves
            .filter((_, i) => i % 2 === 0)
            .map((g, i) => (
              <g key={`gl${i}`} fill="none" stroke="#fff" strokeLinecap="round">
                <path d={arcPath(g.r * R, (SHEEN_ANGLE - 7) * DEG, (SHEEN_ANGLE + 7) * DEG)} strokeOpacity={0.14 + g.o * 3} strokeWidth={1 * unit} />
                <path
                  d={arcPath(g.r * R, (SHEEN_ANGLE + 175) * DEG, (SHEEN_ANGLE + 185) * DEG)}
                  strokeOpacity={0.06 + g.o * 2}
                  strokeWidth={1 * unit}
                />
              </g>
            ))}
        </g>
      </g>

      {/* etiket üzerinde sabit hafif parlama, dış kenar ışığı, mil deliği */}
      <circle r={lr} fill={`url(#${id}-labsheen)`} />
      <circle r={R - 0.75 * unit} fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={1.5 * unit} />
      <path d={arcPath(R - 1.5 * unit, (SHEEN_ANGLE - 30) * DEG, (SHEEN_ANGLE + 30) * DEG)} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2 * unit} strokeLinecap="round" />
      <circle r={R * 0.022} fill="#000" />
      <circle r={R * 0.022} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={1.5 * unit} />
      <circle r={R * 0.03} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1 * unit} />
    </g>
  );
};

export const Vinyl: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const unit = Math.min(WIDTH, HEIGHT) / 1080;
  const R = (Math.min(WIDTH, HEIGHT) * VINYL_DIAMETER_RATIO) / 2;

  // Plak açısı (kümülatif integral), saat yönünün tersi
  const angle = MOTION_ENABLED ? ROT_DIRECTION * ANGLE_TABLE[Math.min(frame, DURATION_FRAMES)] : 0;

  // Süzülme: farklı periyotlu sinüslerin toplamı
  const [p1, p2, p3] = FLOAT_PERIODS;
  const s = (p: number, ph: number) => Math.sin((TAU * t) / p + ph);
  const fx = MOTION_ENABLED ? FLOAT_X * (0.2 * s(p1, 0.3) + 0.45 * s(p2, 1.1) + 0.35 * s(p3, 2.4)) : 0;
  const fy = MOTION_ENABLED ? FLOAT_Y * (0.2 * s(p1, 1.9) + 0.35 * s(p2, 0.2) + 0.45 * s(p3, 4.0)) : 0;
  const fs = MOTION_ENABLED ? 1 + FLOAT_SCALE * (0.15 * s(p1, 0.8) + 0.35 * s(p2, 5.1) + 0.5 * s(p3, 1.6)) : 1;

  // Giriş
  let introScale = 1;
  let redOpacity = 0;
  let neutralOpacity = 1;
  let blur = 0;
  let flash = 0;
  if (INTRO_ENABLED) {
    const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
    const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
    introScale = interpolate(ease(interpolate(t, [INTRO_BLACK_END, INTRO_END], [0, 1], clamp)), [0, 1], [INTRO_SCALE_FROM, 1]);
    const appear = ease(interpolate(t, [INTRO_BLACK_END, INTRO_RED_END], [0, 1], clamp));
    const cross = ease(interpolate(t, [INTRO_RED_END, INTRO_END], [0, 1], clamp));
    redOpacity = appear * (1 - cross);
    neutralOpacity = cross; // kırmızı katman üstte 'screen' ile karışır → geçişte karartma olmaz
    blur =
      t < INTRO_RED_END
        ? interpolate(appear, [0, 1], [INTRO_BLUR_FROM, INTRO_BLUR_TO])
        : interpolate(cross, [0, 1], [INTRO_BLUR_TO, 0]);
    flash = INTRO_FLASH * Math.sin(Math.PI * cross);
  }
  const outro = interpolate(t, [DURATION - OUTRO_FADE, DURATION], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const [rr, rg, rb] = hexToRgb(INTRO_RED);
  const b = 1 + flash;
  // Kırmızı ton: parlaklığı kırmızıya eşle (koyu plakta da görünsün diye biraz kazanç)
  const g = 1.6;
  const redMatrix = `${0.33 * rr * g} ${0.5 * rr * g} ${0.17 * rr * g} 0 0  ${0.33 * rg * g} ${0.5 * rg * g} ${0.17 * rg * g} 0 0  ${0.33 * rb * g} ${0.5 * rb * g} ${0.17 * rb * g} 0 0  0 0 0 1 0`;
  const flashMatrix = `${b} 0 0 0 0  0 ${b} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;

  const cx = WIDTH * VINYL_CENTER_X + fx * unit;
  const cy = HEIGHT * VINYL_CENTER_Y + fy * unit;
  const transform = `translate(${cx} ${cy}) scale(${fs * introScale})`;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <filter id="vx-red" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={redMatrix} />
            {blur > 0.01 && <feGaussianBlur stdDeviation={blur * unit} />}
          </filter>
          <filter id="vx-neutral" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={flashMatrix} />
            {blur > 0.01 && <feGaussianBlur stdDeviation={blur * unit} />}
          </filter>
        </defs>
        <g opacity={outro} transform={transform} style={{isolation: 'isolate'}}>
          {neutralOpacity > 0.001 && (
            <g opacity={neutralOpacity} filter={flash > 0.001 || blur > 0.01 ? 'url(#vx-neutral)' : undefined}>
              <Record id="neu" angle={angle} unit={unit} R={R} />
            </g>
          )}
          {redOpacity > 0.001 && (
            <g opacity={redOpacity} filter="url(#vx-red)" style={{mixBlendMode: 'screen'}}>
              <Record id="red" angle={angle} unit={unit} R={R} />
            </g>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
