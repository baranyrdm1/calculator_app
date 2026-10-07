import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

// ============================================================================
// AYARLAR — tüm sabitler burada.
// ============================================================================
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION = 15; // saniye
export const DURATION_FRAMES = Math.round(DURATION * FPS);

export const INTRO_ENABLED = true;
export const OUTRO_ENABLED = true;
export const MOTION_ENABLED = true;

// Yerleşim (referans: kartuş sağda, sol taraf şarkı sözlerine ayrılmış)
const CART_W_RATIO = 0.39; // kartuş genişliği / ekran genişliği
const CART_ASPECT = 1.05; // en / boy
const CART_CENTER = [0.746, 0.487]; // ekran oranı olarak merkez
const DISC_DIAMETER_RATIO = 0.9; // disk çapı / kartuş yüksekliği
const DISC_OFFSET_X = 0.018; // kartuş genişliğine oran (disk biraz sağda)

// Disk dönüşü: hız(t) = ROT_BASE + ROT_AMP * sin(2π t / ROT_PERIOD + ROT_PHASE)  [derece/sn]
export const ROT_BASE = 18;
export const ROT_AMP = 14;
export const ROT_PERIOD = 3.2;
export const ROT_PHASE = 0.6;
export const ROT_DIRECTION = -1; // saat yönünün tersi

// Kartuş süzülmesi
const FLOAT_X = 8; // px (1080p birimi)
const FLOAT_Y = 10;
const FLOAT_ROT = 0.4; // derece
const FLOAT_SCALE = 0.035; // ±%3.5
const FLOAT_PERIODS = [1.7, 4.1, 5.3];

// Giriş (sn)
const INTRO_BLACK_END = 0.3;
const INTRO_RED_END = 1.6;
const INTRO_END = 2.3;
const INTRO_SCALE_FROM = 1.55;
const INTRO_CENTER_FROM = [0.8, 0.47];
const INTRO_BLUR_FROM = 9;
const INTRO_BLUR_TO = 2;
const INTRO_FLASH = 0.1;
const INTRO_RED = '#ff1a1a';

// Çıkış — plağın ayrılışı (sn): yatay ışık çizgileri → parlama → küçülen beyaz halka
const OUTRO_STREAK_1 = 14.0;
const OUTRO_STREAK_2 = 14.22;
const OUTRO_FLARE = 14.36;
const OUTRO_IRIS_START = 14.42;
const OUTRO_IRIS_END = 14.9;

// Çiçek
const FLOWER_SEED = 4242;
const FLOWER_RINGS = 6;

// ============================================================================

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
const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const easeIn = (x: number) => Math.pow(Math.min(1, Math.max(0, x)), 2.2);
const speedAt = (t: number) => ROT_BASE + ROT_AMP * Math.sin((TAU * t) / ROT_PERIOD + ROT_PHASE);

// Açı = hızın integrali (kümülatif toplam, yamuk kuralı)
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

// ---------------------------------------------------------------------------
// Özgün dalya benzeri çiçek (sabit seed). Yaprak verisi disk yarıçapına oranlı.
// ---------------------------------------------------------------------------
const PETAL_PALETTES = [
  ['#ffc23a', '#ff7a1a', '#f03a5a'],
  ['#ffb02e', '#ff5512', '#d81e3a'],
  ['#ffd25a', '#ff8a22', '#ff5a78'],
  ['#ff9e2a', '#ff4a1a', '#c81830'],
  ['#ffc85a', '#ff8a3a', '#ff5a7a'],
];

type Petal = {a: number; r0: number; len: number; w: number; pal: number; bend: number; notch: number};

const FLOWER: Petal[][] = (() => {
  const rand = mulberry32(FLOWER_SEED);
  const rings: Petal[][] = [];
  const skewDir = rand() * TAU; // asimetri: çiçek bir yöne daha uzun (dönüş görünür olsun)
  for (let k = 0; k < FLOWER_RINGS; k++) {
    const f = k / (FLOWER_RINGS - 1); // 0 = dış halka, 1 = iç halka
    const count = Math.round(11 + (1 - f) * 7);
    const offset = rand() * TAU;
    const ring: Petal[] = [];
    for (let i = 0; i < count; i++) {
      const a = offset + (i / count) * TAU + (rand() - 0.5) * 0.18;
      const skew = 1 + 0.2 * Math.cos(a - skewDir);
      const len = (0.26 + (1 - f) * 0.44) * skew * (0.88 + rand() * 0.24);
      ring.push({
        a,
        r0: 0.06 + f * 0.03,
        len,
        w: (0.075 + (1 - f) * 0.055) * (0.85 + rand() * 0.3),
        pal: Math.floor(rand() * PETAL_PALETTES.length),
        bend: (rand() - 0.5) * 0.35,
        notch: rand() < 0.5 ? 0.08 + rand() * 0.06 : 0,
      });
    }
    rings.push(ring);
  }
  return rings;
})();

// Yaprak yolu: yerel +x yönünde, uca doğru hafif çentikli
const petalPath = (L: number, w: number, bend: number, notch: number) => {
  const b = bend * w;
  const n = notch * L;
  return (
    `M 0 ${-w * 0.25} ` +
    `C ${L * 0.3} ${-w * 1.05 + b}, ${L * 0.85} ${-w * 0.95 + b}, ${L} ${-w * 0.18 + b} ` +
    `L ${L - n} ${b} L ${L} ${w * 0.18 + b} ` +
    `C ${L * 0.85} ${w * 0.95 + b}, ${L * 0.3} ${w * 1.05 + b}, 0 ${w * 0.25} Z`
  );
};

const Flower: React.FC<{R: number; id: string}> = ({R, id}) => (
  <g>
    <defs>
      {PETAL_PALETTES.map((p, i) => (
        <linearGradient key={i} id={`${id}-pal${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p[0]} />
          <stop offset="0.62" stopColor={p[1]} />
          <stop offset="1" stopColor={p[2]} />
        </linearGradient>
      ))}
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.14" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation={R * 0.018} floodColor="#1a0000" floodOpacity="0.9" />
      </filter>
    </defs>
    {FLOWER.map((ring, k) => (
      <g key={k} filter={`url(#${id}-shadow)`}>
        {ring.map((p, i) => {
          const L = p.len * R;
          const w = p.w * R;
          return (
            <g key={i} transform={`rotate(${p.a / DEG}) translate(${p.r0 * R} 0)`}>
              <path
                d={petalPath(L, w, p.bend, p.notch)}
                fill={`url(#${id}-pal${p.pal})`}
                stroke="#6a0c18"
                strokeOpacity={0.45}
                strokeWidth={R * 0.004}
              />
              <path d={petalPath(L, w, p.bend, p.notch)} fill={`url(#${id}-sheen)`} />
              <path
                d={`M ${L * 0.12} 0 Q ${L * 0.55} ${p.bend * w * 0.6}, ${L * 0.9} ${p.bend * w}`}
                fill="none"
                stroke="#fff3d6"
                strokeOpacity={0.3}
                strokeWidth={R * 0.004}
              />
            </g>
          );
        })}
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------------------
// Şeffaf MiniDisc kartuşu
// ---------------------------------------------------------------------------
const cartridgePath = (w: number, h: number, inset = 0) => {
  const a = w / 2 - inset;
  const b = h / 2 - inset;
  const r = w * 0.03;
  const s1 = w * 0.022;
  const s2 = w * 0.04;
  const c = w * 0.006;
  const tabD = w * 0.012;
  const tabW = w * 0.05;
  const tab = (x: number, top: boolean) => {
    const y = top ? -b : b;
    const dy = top ? tabD : -tabD;
    const dir = top ? 1 : -1;
    const x0 = x - (dir * tabW) / 2;
    const x1 = x + (dir * tabW) / 2;
    return `L ${x0} ${y} L ${x0 + dir * c} ${y + dy} L ${x1 - dir * c} ${y + dy} L ${x1} ${y} `;
  };
  let d = `M ${-a + r} ${-b} `;
  d += tab(-a * 0.55, true);
  d += tab(a * 0.62, true);
  d += `L ${a - r} ${-b} Q ${a} ${-b} ${a} ${-b + r} `;
  d += `L ${a} ${b - r} Q ${a} ${b} ${a - r} ${b} `;
  d += tab(a * 0.55, false);
  d += tab(-a * 0.3, false);
  d += `L ${-a + r} ${b} Q ${-a} ${b} ${-a} ${b - r} `;
  const yA = b * 0.32;
  const yB = b * 0.18;
  const yC = -b * 0.08;
  const yD = -b * 0.22;
  d += `L ${-a} ${yA} L ${-a + s1 - c} ${yA - c} L ${-a + s1} ${yA - 2 * c} `;
  d += `L ${-a + s1} ${yB} L ${-a + s2 - c} ${yB - c} L ${-a + s2} ${yB - 2 * c} `;
  d += `L ${-a + s2} ${yC + 2 * c} L ${-a + s1 + c} ${yC + c} L ${-a + s1} ${yC} `;
  d += `L ${-a + s1} ${yD + 2 * c} L ${-a + c} ${yD + c} L ${-a} ${yD} `;
  d += `L ${-a} ${-b + r} Q ${-a} ${-b} ${-a + r} ${-b} Z`;
  return d;
};

const Scene: React.FC<{id: string; angle: number; u: number}> = ({id, angle, u}) => {
  const cw = WIDTH * CART_W_RATIO;
  const ch = cw / CART_ASPECT;
  const R = (ch * DISC_DIAMETER_RATIO) / 2;
  const dx = cw * DISC_OFFSET_X;
  const outer = cartridgePath(cw, ch);
  const inner1 = cartridgePath(cw, ch, cw * 0.018);
  const inner2 = cartridgePath(cw, ch, cw * 0.035);
  const hubR = R * 0.2;
  const a = cw / 2;
  const b = ch / 2;

  // Kartuş iç detayları: köşe blokları, raylar, kısa nervürler (kenar çizgileri)
  const ribs: string[] = [];
  const m = cw * 0.05;
  // köşe blokları
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const x0 = sx * (a - m * 0.7);
    const y0 = sy * (b - m * 0.7);
    ribs.push(`M ${x0} ${y0 - sy * m * 1.6} L ${x0} ${y0} L ${x0 - sx * m * 1.6} ${y0}`);
    ribs.push(`M ${x0 - sx * m * 0.5} ${y0 - sy * m * 1.6} L ${x0 - sx * m * 0.5} ${y0 - sy * m * 0.5} L ${x0 - sx * m * 1.6} ${y0 - sy * m * 0.5}`);
  }
  // üst ray (kapak kızağı) ve alt ray
  ribs.push(`M ${-a * 0.45} ${-b + m * 0.75} L ${a * 0.5} ${-b + m * 0.75}`);
  ribs.push(`M ${-a * 0.45} ${-b + m * 1.05} L ${a * 0.5} ${-b + m * 1.05}`);
  ribs.push(`M ${-a * 0.35} ${b - m * 0.8} L ${a * 0.4} ${b - m * 0.8}`);
  // sol ve sağ dikey kızaklar
  ribs.push(`M ${-a + m * 0.8} ${-b * 0.6} L ${-a + m * 0.8} ${-b * 0.3}`);
  ribs.push(`M ${-a + m * 0.8} ${b * 0.4} L ${-a + m * 0.8} ${b * 0.7}`);
  ribs.push(`M ${a - m * 0.8} ${-b * 0.55} L ${a - m * 0.8} ${b * 0.55}`);
  ribs.push(`M ${a - m * 1.1} ${-b * 0.45} L ${a - m * 1.1} ${b * 0.45}`);

  return (
    <g>
      <defs>
        <clipPath id={`${id}-cart`}>
          <path d={outer} />
        </clipPath>
        <clipPath id={`${id}-disc`}>
          <circle r={R * 0.985} />
        </clipPath>
        <radialGradient id={`${id}-plastic`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="0.75" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
        </radialGradient>
        <radialGradient id={`${id}-hub`} cx="0.42" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="0.6" stopColor="#ffe4e0" stopOpacity="0.78" />
          <stop offset="1" stopColor="#ffc8c0" stopOpacity="0.62" />
        </radialGradient>
        <linearGradient id={`${id}-spec`} x1={dx} y1={0} x2={dx + R} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={2.5 * u} />
        </filter>
      </defs>

      {/* Kartuş gövdesi: siyah iç, kenarlara doğru buzlu plastik */}
      <path d={outer} fill="#000" />
      <path d={outer} fill={`url(#${id}-plastic)`} />

      {/* Disk yatağı: koyu halka + şeffaf disk kenarı */}
      <circle cx={dx} cy={0} r={R * 1.035} fill="#050505" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.5 * u} />
      <circle cx={dx} cy={0} r={R} fill="#000" stroke="#d8dde2" strokeOpacity={0.75} strokeWidth={2.5 * u} />
      <circle cx={dx} cy={0} r={R * 0.975} fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={4 * u} />

      {/* DÖNEN: çiçek baskısı, disk dairesine kırpılı */}
      <g transform={`translate(${dx} 0)`}>
        <g clipPath={`url(#${id}-disc)`}>
          <g transform={`rotate(${angle})`}>
            <Flower R={R} id={`${id}-fl`} />
          </g>
        </g>
      </g>

      {/* SABİT: şeffaf göbek (hub) */}
      <g transform={`translate(${dx} 0)`}>
        <circle r={hubR * 1.25} fill="#ffffff" fillOpacity={0.08} stroke="#fff" strokeOpacity={0.25} strokeWidth={1 * u} />
        <circle r={hubR} fill={`url(#${id}-hub)`} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.5 * u} />
        <circle r={hubR * 0.62} fill="#ffffff" fillOpacity={0.12} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.2 * u} />
        <circle r={hubR * 0.2} fill="#e04a5a" fillOpacity={0.75} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={1 * u} />
        <path
          d={`M ${hubR * 0.85 * Math.cos(-150 * DEG)} ${hubR * 0.85 * Math.sin(-150 * DEG)} A ${hubR * 0.85} ${hubR * 0.85} 0 0 1 ${hubR * 0.85 * Math.cos(-80 * DEG)} ${hubR * 0.85 * Math.sin(-80 * DEG)}`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.8}
          strokeWidth={2 * u}
          strokeLinecap="round"
        />
      </g>

      {/* SABİT ışık: disk sağ yarısında hafif parlama + kenarda yay */}
      <circle cx={dx} cy={0} r={R * 0.985} fill={`url(#${id}-spec)`} />
      <path
        d={`M ${dx + R * 0.99 * Math.cos(-60 * DEG)} ${R * 0.99 * Math.sin(-60 * DEG)} A ${R * 0.99} ${R * 0.99} 0 0 1 ${dx + R * 0.99 * Math.cos(10 * DEG)} ${R * 0.99 * Math.sin(10 * DEG)}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={2.5 * u}
        strokeLinecap="round"
      />

      {/* Cam yansımaları */}
      <g clipPath={`url(#${id}-cart)`}>
        <polygon points={`${-a * 1.2},${-b * 0.1} ${-a * 0.1},${-b * 1.2} ${a * 0.1},${-b * 1.2} ${-a * 1.2},${b * 0.1}`} fill="#fff" fillOpacity={0.045} />
        <polygon points={`${a * 0.1},${b * 1.2} ${a * 1.2},${b * 0.1} ${a * 1.2},${b * 0.35} ${a * 0.4},${b * 1.2}`} fill="#fff" fillOpacity={0.035} />
      </g>

      {/* Kenarlar: parlak dış hat + iç hatlar + nervürler (hafif ışıma ile) */}
      <g filter={`url(#${id}-glow)`} opacity={0.6}>
        <path d={outer} fill="none" stroke="#fff" strokeWidth={3 * u} />
        <path d={inner1} fill="none" stroke="#fff" strokeWidth={2 * u} strokeOpacity={0.6} />
      </g>
      <path d={outer} fill="none" stroke="#ffffff" strokeOpacity={0.85} strokeWidth={2.5 * u} strokeLinejoin="round" />
      <path d={inner1} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={1.5 * u} strokeLinejoin="round" />
      <path d={inner2} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={1.2 * u} strokeLinejoin="round" />
      {ribs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={1.5 * u} strokeLinecap="round" />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Çıkış efekti (ekran koordinatlarında): ışık çizgileri, parlama, küçülen halka
// ---------------------------------------------------------------------------
const Outro: React.FC<{t: number; u: number}> = ({t, u}) => {
  const pulse = (t0: number, rise: number, fall: number) =>
    t < t0 ? 0 : t < t0 + rise ? (t - t0) / rise : Math.max(0, 1 - (t - t0 - rise) / fall);
  const streak1 = pulse(OUTRO_STREAK_1, 0.04, 0.12);
  const streak2 = pulse(OUTRO_STREAK_2, 0.04, 0.12);
  const flare = pulse(OUTRO_FLARE, 0.05, 0.14);
  const irisP = interpolate(t, [OUTRO_IRIS_START, OUTRO_IRIS_END], [0, 1], clampOpt);
  const irisOn = t >= OUTRO_IRIS_START && t <= OUTRO_IRIS_END + 0.05;
  const irisR = Math.max(0, (1 - easeOut(irisP * 1.02)) * WIDTH * 0.62);
  const glow = 1 - easeIn(irisP);
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const lineY1 = HEIGHT * 0.4;
  const lineY2 = HEIGHT * 0.33;
  const flareY = HEIGHT * 0.37;

  return (
    <g>
      <defs>
        <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="soft" x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation={6 * u} />
        </filter>
        <filter id="softer" x="-10%" y="-100%" width="120%" height="300%">
          <feGaussianBlur stdDeviation={22 * u} />
        </filter>
        <radialGradient id="irisGlow" cx={cx} cy={cy} r={Math.max(1, irisR * 2.2)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="1" />
          <stop offset="0.4" stopColor="#000" stopOpacity="1" />
          <stop offset="0.455" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.52" stopColor="#d8d8d8" stopOpacity="0.85" />
          <stop offset="0.75" stopColor="#7a7a7a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {streak1 > 0 && (
        <g opacity={streak1}>
          <rect x={0} y={lineY1 - 1.5 * u} width={WIDTH} height={3 * u} fill="url(#streak)" />
          <rect x={0} y={lineY1 - 6 * u} width={WIDTH} height={12 * u} fill="url(#streak)" opacity={0.4} filter="url(#soft)" />
        </g>
      )}
      {streak2 > 0 && (
        <g opacity={streak2}>
          <rect x={0} y={lineY2 - 1.5 * u} width={WIDTH} height={3 * u} fill="url(#streak)" />
          <rect x={0} y={lineY2 - 6 * u} width={WIDTH} height={12 * u} fill="url(#streak)" opacity={0.4} filter="url(#soft)" />
        </g>
      )}
      {flare > 0 && (
        <g opacity={flare}>
          <rect x={0} y={flareY - HEIGHT * 0.06} width={WIDTH} height={HEIGHT * 0.12} fill="#fff" opacity={0.55} filter="url(#softer)" />
          <rect x={0} y={flareY - 3 * u} width={WIDTH} height={6 * u} fill="#fff" />
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#fff" opacity={0.25} />
        </g>
      )}
      {irisOn && (
        <g>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#000" opacity={Math.min(1, irisP * 6)} />
          {irisR > 0.5 && <circle cx={cx} cy={cy} r={irisR * 2.2} fill="url(#irisGlow)" opacity={0.35 + 0.65 * glow} />}
        </g>
      )}
    </g>
  );
};

export const FlowerDisc: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const u = Math.min(WIDTH, HEIGHT) / 1080;

  const angle = MOTION_ENABLED ? ROT_DIRECTION * ANGLE_TABLE[Math.min(frame, DURATION_FRAMES)] : 0;

  const [p1, p2, p3] = FLOAT_PERIODS;
  const s = (p: number, ph: number) => Math.sin((TAU * t) / p + ph);
  const fx = MOTION_ENABLED ? FLOAT_X * (0.2 * s(p1, 0.3) + 0.45 * s(p2, 1.1) + 0.35 * s(p3, 2.4)) : 0;
  const fy = MOTION_ENABLED ? FLOAT_Y * (0.2 * s(p1, 1.9) + 0.35 * s(p2, 0.2) + 0.45 * s(p3, 4.0)) : 0;
  const fr = MOTION_ENABLED ? FLOAT_ROT * (0.15 * s(p1, 2.7) + 0.5 * s(p2, 3.3) + 0.35 * s(p3, 0.9)) : 0;
  const fs = MOTION_ENABLED ? 1 + FLOAT_SCALE * (0.15 * s(p1, 0.8) + 0.35 * s(p2, 5.1) + 0.5 * s(p3, 1.6)) : 1;

  // Giriş: büyük, kırmızı, bulanık → küçülerek yerine oturur → doğal renk
  let introScale = 1;
  let centerX = CART_CENTER[0];
  let centerY = CART_CENTER[1];
  let redOpacity = 0;
  let neutralOpacity = 1;
  let blur = 0;
  let flash = 0;
  if (INTRO_ENABLED) {
    const zoom = easeOut(interpolate(t, [INTRO_BLACK_END, INTRO_END], [0, 1], clampOpt));
    introScale = interpolate(zoom, [0, 1], [INTRO_SCALE_FROM, 1]);
    centerX = interpolate(zoom, [0, 1], [INTRO_CENTER_FROM[0], CART_CENTER[0]]);
    centerY = interpolate(zoom, [0, 1], [INTRO_CENTER_FROM[1], CART_CENTER[1]]);
    const appear = ease(interpolate(t, [INTRO_BLACK_END, INTRO_RED_END], [0, 1], clampOpt));
    const cross = ease(interpolate(t, [INTRO_RED_END, INTRO_END], [0, 1], clampOpt));
    redOpacity = appear * (1 - cross);
    neutralOpacity = cross;
    blur = t < INTRO_RED_END ? interpolate(appear, [0, 1], [INTRO_BLUR_FROM, INTRO_BLUR_TO]) : interpolate(cross, [0, 1], [INTRO_BLUR_TO, 0]);
    flash = INTRO_FLASH * Math.sin(Math.PI * cross);
  }

  // Çıkış: parlama anında sahne söner
  const sceneOpacity = OUTRO_ENABLED ? interpolate(t, [OUTRO_FLARE, OUTRO_IRIS_START + 0.04], [1, 0], clampOpt) : 1;

  const [rr, rg, rb] = hexToRgb(INTRO_RED);
  const g = 1.25;
  const redMatrix = `${0.33 * rr * g} ${0.5 * rr * g} ${0.17 * rr * g} 0 0  ${0.33 * rg * g} ${0.5 * rg * g} ${0.17 * rg * g} 0 0  ${0.33 * rb * g} ${0.5 * rb * g} ${0.17 * rb * g} 0 0  0 0 0 1 0`;
  const bb = 1 + flash;
  const flashMatrix = `${bb} 0 0 0 0  0 ${bb} 0 0 0  0 0 ${bb} 0 0  0 0 0 1 0`;

  const transform = `translate(${WIDTH * centerX + fx * u} ${HEIGHT * centerY + fy * u}) rotate(${fr}) scale(${fs * introScale})`;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <filter id="fx-red" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={redMatrix} />
            {blur > 0.01 && <feGaussianBlur stdDeviation={blur * u} />}
          </filter>
          <filter id="fx-neutral" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={flashMatrix} />
            {blur > 0.01 && <feGaussianBlur stdDeviation={blur * u} />}
          </filter>
        </defs>
        {sceneOpacity > 0.001 && (
          <g opacity={sceneOpacity} transform={transform} style={{isolation: 'isolate'}}>
            {neutralOpacity > 0.001 && (
              <g opacity={neutralOpacity} filter={flash > 0.001 || blur > 0.01 ? 'url(#fx-neutral)' : undefined}>
                <Scene id="neu" angle={angle} u={u} />
              </g>
            )}
            {redOpacity > 0.001 && (
              <g opacity={redOpacity} filter="url(#fx-red)" style={{mixBlendMode: 'screen'}}>
                <Scene id="red" angle={angle} u={u} />
              </g>
            )}
          </g>
        )}
        {OUTRO_ENABLED && <Outro t={t} u={u} />}
      </svg>
    </AbsoluteFill>
  );
};
