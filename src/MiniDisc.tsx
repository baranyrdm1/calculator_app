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

// Aşama anahtarları
export const SHOW_PRINT = true; // diskin baskılı görseli
export const SHOW_LIGHT = true; // sabit speküler parlama + oluk parlamaları
export const MOTION_ENABLED = true; // süzülme + disk dönüşü
export const INTRO_ENABLED = true; // kırmızı giriş

// Kartuş geometrisi
const CART_WIDTH_RATIO = 0.72; // ekranın kısa kenarına oranı
const CART_ASPECT = 1.06; // en / boy
const CART_CORNER = 0.035; // köşe yarıçapı (kartuş genişliğine oran)
const EDGE_STROKE = 2.5; // kenar çizgisi (px, 1080 genişliğe göre)
const EDGE_OPACITY = 0.72;
const GLASS_REFLECTION_OPACITY = 0.05;

// Disk geometrisi
const DISC_DIAMETER_RATIO = 0.88; // kartuş yüksekliğine oran
const DISC_OFFSET_X = 0.035; // kartuş genişliğine oran, sağa kayma
const DISC_OFFSET_Y = 0.0;
const GROOVE_COUNT = 14;
const HUB_RATIO = 0.2; // göbek yarıçapı / disk yarıçapı

// Dönüş: hız(t) = ROT_BASE + ROT_AMP * sin(2π t / ROT_PERIOD + ROT_PHASE)  [derece/sn]
export const ROT_BASE = 18;
export const ROT_AMP = 14;
export const ROT_PERIOD = 3.2;
export const ROT_PHASE = 0.6;
export const ROT_DIRECTION = -1; // -1 = saat yönünün tersi (SVG'de pozitif açı saat yönü)

// Kartuş süzülmesi (genlikler ve periyotlar)
const FLOAT_X = 6; // px
const FLOAT_Y = 5; // px
const FLOAT_ROT = 0.4; // derece
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

const PRINT_SEED = 20240611;

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
const speedAt = (t: number) => ROT_BASE + ROT_AMP * Math.sin((TAU * t) / ROT_PERIOD + ROT_PHASE);

// Açı = hızın integrali; kare kare kümülatif toplam (yamuk kuralı).
const ANGLE_TABLE: number[] = (() => {
  const dt = 1 / FPS;
  const table = [0];
  for (let f = 1; f <= DURATION_FRAMES; f++) {
    const t0 = (f - 1) * dt;
    const t1 = f * dt;
    table.push(table[f - 1] + ((speedAt(t0) + speedAt(t1)) / 2) * dt);
  }
  return table;
})();

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
};

// Kartuş silueti: yuvarlak köşeli dikdörtgen, solda basamaklı çentik, üst/altta tırnaklar.
const cartridgePath = (w: number, h: number) => {
  const a = w / 2;
  const b = h / 2;
  const r = w * CART_CORNER;
  const s1 = w * 0.022; // birinci basamak derinliği
  const s2 = w * 0.042; // ikinci basamak derinliği
  const c = w * 0.006; // basamak pahı
  const tabD = w * 0.012; // tırnak derinliği
  const tabW = w * 0.055; // tırnak genişliği
  const tab = (x: number, top: boolean) => {
    const y = top ? -b : b;
    const dy = top ? tabD : -tabD;
    const dir = top ? 1 : -1; // üstte soldan sağa, altta sağdan sola ilerliyoruz
    const x0 = x - (dir * tabW) / 2;
    const x1 = x + (dir * tabW) / 2;
    return `L ${x0} ${y} L ${x0 + dir * c} ${y + dy} L ${x1 - dir * c} ${y + dy} L ${x1} ${y} `;
  };
  let d = `M ${-a + r} ${-b} `;
  d += tab(-a * 0.42, true);
  d += tab(a * 0.38, true);
  d += `L ${a - r} ${-b} Q ${a} ${-b} ${a} ${-b + r} `;
  d += `L ${a} ${b - r} Q ${a} ${b} ${a - r} ${b} `;
  d += tab(a * 0.5, false);
  d += tab(-a * 0.15, false);
  d += `L ${-a + r} ${b} Q ${-a} ${b} ${-a} ${b - r} `;
  // sol kenar, aşağıdan yukarı: basamaklı mandal çentiği
  const yA = b * 0.38;
  const yB = b * 0.22;
  const yC = -b * 0.12;
  const yD = -b * 0.3;
  d += `L ${-a} ${yA} L ${-a + s1 - c} ${yA - c} L ${-a + s1} ${yA - 2 * c} `;
  d += `L ${-a + s1} ${yB} L ${-a + s2 - c} ${yB - c} L ${-a + s2} ${yB - 2 * c} `;
  d += `L ${-a + s2} ${yC + 2 * c} L ${-a + s1 + c} ${yC + c} L ${-a + s1} ${yC} `;
  d += `L ${-a + s1} ${yD + 2 * c} L ${-a + c} ${yD + c} L ${-a} ${yD} `;
  d += `L ${-a} ${-b + r} Q ${-a} ${-b} ${-a + r} ${-b} Z`;
  return d;
};

// Diskin üzerine basılı özgün gün batımı şehir silueti (disk yerel koordinatlarında).
const PrintArt: React.FC<{R: number; id: string}> = ({R, id}) => {
  const rand = mulberry32(PRINT_SEED);
  const bandTop = -0.52 * R;
  const bandBottom = 0.52 * R;
  const horizon = 0.04 * R;

  const buildings: {x: number; w: number; h: number}[] = [];
  let x = -R;
  while (x < R) {
    const w = R * (0.018 + rand() * 0.04);
    const tall = rand() < 0.12;
    const h = R * (tall ? 0.07 + rand() * 0.06 : 0.015 + rand() * 0.04);
    buildings.push({x, w, h});
    x += w * (0.85 + rand() * 0.2);
  }
  const lights: {x: number; y: number; s: number; o: number}[] = [];
  for (const bd of buildings) {
    const n = Math.max(2, Math.round((bd.w * bd.h) / (R * R * 0.00012)));
    for (let i = 0; i < n; i++) {
      lights.push({
        x: bd.x + rand() * bd.w,
        y: horizon - rand() * bd.h * 0.95,
        s: R * (0.0045 + rand() * 0.004),
        o: 0.55 + rand() * 0.45,
      });
    }
  }
  // ufuk çizgisinde yoğun ışık şeridi
  for (let i = 0; i < 260; i++) {
    lights.push({
      x: -R + rand() * 2 * R,
      y: horizon - rand() * R * 0.012,
      s: R * (0.004 + rand() * 0.004),
      o: 0.6 + rand() * 0.4,
    });
  }
  const glowX = 0.42 * R;
  const reflX = 0.4 * R;

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f8194" />
          <stop offset="0.7" stopColor="#9eacb8" />
          <stop offset="1" stopColor="#c7b9a8" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34433d" />
          <stop offset="1" stopColor="#141c19" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffb066" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#ff8a3d" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff7a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-refl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-bandfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={R * 0.025} />
        </filter>
        <mask id={`${id}-bandmask`} maskUnits="userSpaceOnUse" x={-R} y={bandTop} width={2 * R} height={bandBottom - bandTop}>
          <rect x={-R} y={bandTop} width={2 * R} height={bandBottom - bandTop} fill={`url(#${id}-bandfade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-bandmask)`} opacity={0.9}>
        <rect x={-R} y={bandTop} width={2 * R} height={horizon - bandTop} fill={`url(#${id}-sky)`} />
        <g filter={`url(#${id}-soft)`}>
          <ellipse cx={glowX} cy={-0.15 * R} rx={0.28 * R} ry={0.12 * R} fill={`url(#${id}-glow)`} />
          <ellipse cx={glowX - 0.06 * R} cy={-0.19 * R} rx={0.16 * R} ry={0.04 * R} fill="#ff9a4d" opacity={0.6} />
        </g>
        <rect x={-R} y={horizon} width={2 * R} height={bandBottom - horizon} fill={`url(#${id}-water)`} />
        {buildings.map((bd, i) => (
          <rect key={i} x={bd.x} y={horizon - bd.h} width={bd.w + 0.5} height={bd.h} fill="#252b2d" />
        ))}
        {lights.map((l, i) => (
          <rect key={`l${i}`} x={l.x} y={l.y} width={l.s} height={l.s} fill="#ffc35a" opacity={l.o} />
        ))}
        {/* su üzerindeki ışık yansımaları */}
        {lights
          .filter((_, i) => i % 7 === 0)
          .map((l, i) => (
            <rect
              key={`r${i}`}
              x={l.x}
              y={horizon + (horizon - l.y) * 0.8 + R * 0.006}
              width={l.s * 0.8}
              height={R * 0.02}
              fill="#ffc35a"
              opacity={l.o * 0.25}
            />
          ))}
        <rect x={reflX - R * 0.004} y={horizon} width={R * 0.008} height={bandBottom - horizon} fill={`url(#${id}-refl)`} />
        <rect x={reflX - R * 0.025} y={horizon} width={R * 0.05} height={(bandBottom - horizon) * 0.6} fill={`url(#${id}-refl)`} opacity={0.18} />
      </g>
    </g>
  );
};

// Tüm sahne (kartuş + disk). Giriş için iki kez çizilir (kırmızı / nötr).
const Scene: React.FC<{id: string; angle: number; unit: number}> = ({id, angle, unit}) => {
  const cw = Math.min(WIDTH, HEIGHT) * CART_WIDTH_RATIO;
  const ch = cw / CART_ASPECT;
  const R = (ch * DISC_DIAMETER_RATIO) / 2;
  const dx = cw * DISC_OFFSET_X;
  const dy = ch * DISC_OFFSET_Y;
  const path = cartridgePath(cw, ch);
  const hubR = R * HUB_RATIO;
  const grooveIn = R * 0.3;
  const grooveOut = R * 0.975;
  const grooves = Array.from({length: GROOVE_COUNT}, (_, i) => grooveIn + ((grooveOut - grooveIn) * i) / (GROOVE_COUNT - 1));
  const sw = EDGE_STROKE * unit;

  // Oluklardaki sabit parlamalar: ışık sağ-üstten; her halkada iki kısa yay.
  const arc = (r: number, a0: number, a1: number) => {
    const p0 = [dx + r * Math.cos(a0), dy + r * Math.sin(a0)];
    const p1 = [dx + r * Math.cos(a1), dy + r * Math.sin(a1)];
    return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`;
  };
  const deg = Math.PI / 180;

  return (
    <g>
      <defs>
        <clipPath id={`${id}-cart`}>
          <path d={path} />
        </clipPath>
        <clipPath id={`${id}-disc`}>
          <circle cx={0} cy={0} r={R} />
        </clipPath>
        <clipPath id={`${id}-discfixed`}>
          <circle cx={dx} cy={dy} r={R} />
        </clipPath>
        <radialGradient id={`${id}-discfill`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5d636b" />
          <stop offset="0.3" stopColor="#7d838b" />
          <stop offset="0.85" stopColor="#8d939a" />
          <stop offset="1" stopColor="#5a5f66" />
        </radialGradient>
        <linearGradient id={`${id}-cartfill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.035" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.012" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        {/* Sabit ışık: diskin sağ yarısında 0 → %35 → 0 doğrusal parlama (dönmez) */}
        <linearGradient id={`${id}-spec`} x1={dx} y1={0} x2={dx + R} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-spec2`} cx={dx - R * 0.45} cy={dy - R * 0.45} r={R * 0.7} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-hub`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0a0b0c" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#3b4046" stopOpacity="0.55" />
          <stop offset="1" stopColor="#9aa1a8" stopOpacity="0.35" />
        </radialGradient>
      </defs>

      {/* Kartuşun içi: siyah, çok hafif cam dolgusu */}
      <path d={path} fill="#000" />
      <path d={path} fill={`url(#${id}-cartfill)`} />

      {/* DÖNEN katman: disk yüzeyi + baskı */}
      <g transform={`translate(${dx} ${dy}) rotate(${angle})`}>
        <g clipPath={`url(#${id}-disc)`}>
          <circle cx={0} cy={0} r={R} fill={`url(#${id}-discfill)`} opacity={0.62} />
          {SHOW_PRINT && <PrintArt R={R} id={`${id}-print`} />}
        </g>
      </g>

      {/* SABİT katman: oluklar, göbek, ışık */}
      <g>
        {grooves.map((r, i) => (
          <circle key={i} cx={dx} cy={dy} r={r} fill="none" stroke="#ffffff" strokeOpacity={0.06 + (i % 3) * 0.015} strokeWidth={0.9 * unit} />
        ))}
        <circle cx={dx} cy={dy} r={R} fill="none" stroke="#c9ced3" strokeOpacity={0.45} strokeWidth={1.4 * unit} />
        <circle cx={dx} cy={dy} r={R * 0.985} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={2 * unit} />

        {SHOW_LIGHT && (
          <g>
            <g clipPath={`url(#${id}-discfixed)`}>
              <rect x={dx - R} y={dy - R} width={2 * R} height={2 * R} fill={`url(#${id}-spec)`} />
              <rect x={dx - R} y={dy - R} width={2 * R} height={2 * R} fill={`url(#${id}-spec2)`} />
            </g>
            {grooves.map((r, i) => (
              <g key={`g${i}`} fill="none" stroke="#ffffff" strokeLinecap="round">
                <path d={arc(r, -38 * deg, -8 * deg)} strokeOpacity={0.22 + 0.12 * Math.sin(i * 1.3)} strokeWidth={1.3 * unit} />
                <path d={arc(r, 8 * deg, 28 * deg)} strokeOpacity={0.12 + 0.06 * Math.cos(i * 0.9)} strokeWidth={1.1 * unit} />
                <path d={arc(r, 150 * deg, 168 * deg)} strokeOpacity={0.07} strokeWidth={1 * unit} />
              </g>
            ))}
          </g>
        )}

        {/* Şeffaf göbek: iç içe halkalar ve ortada delik */}
        <circle cx={dx} cy={dy} r={hubR * 1.45} fill="#000" fillOpacity={0.25} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={1 * unit} />
        <circle cx={dx} cy={dy} r={hubR} fill={`url(#${id}-hub)`} stroke="#ffffff" strokeOpacity={0.45} strokeWidth={1.4 * unit} />
        <circle cx={dx} cy={dy} r={hubR * 0.68} fill="none" stroke="#ffffff" strokeOpacity={0.3} strokeWidth={1.1 * unit} />
        <circle cx={dx} cy={dy} r={hubR * 0.36} fill="#000" stroke="#d6dbe0" strokeOpacity={0.55} strokeWidth={1.4 * unit} />
        {SHOW_LIGHT && <path d={arc(hubR * 1.0, -70 * deg, -15 * deg)} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={2 * unit} strokeLinecap="round" />}
      </g>

      {/* Cam: çapraz yansımalar (kartuşa kırpılı, dönmez) */}
      <g clipPath={`url(#${id}-cart)`}>
        <polygon
          points={`${-cw * 0.6},${-ch * 0.1} ${-cw * 0.1},${-ch * 0.6} ${cw * 0.05},${-ch * 0.6} ${-cw * 0.6},${ch * 0.05}`}
          fill="#fff"
          fillOpacity={GLASS_REFLECTION_OPACITY}
        />
        <polygon
          points={`${-cw * 0.6},${ch * 0.12} ${cw * 0.12},${-ch * 0.6} ${cw * 0.17},${-ch * 0.6} ${-cw * 0.6},${ch * 0.18}`}
          fill="#fff"
          fillOpacity={GLASS_REFLECTION_OPACITY * 0.8}
        />
        <polygon
          points={`${cw * 0.05},${ch * 0.6} ${cw * 0.6},${ch * 0.05} ${cw * 0.6},${ch * 0.2} ${cw * 0.22},${ch * 0.6}`}
          fill="#fff"
          fillOpacity={GLASS_REFLECTION_OPACITY * 0.7}
        />
      </g>

      {/* Kenarlar: dış parlak çizgi + içte ikinci (kalınlık hissi) */}
      <path d={path} fill="none" stroke="#ffffff" strokeOpacity={EDGE_OPACITY} strokeWidth={sw} strokeLinejoin="round" />
      <path
        d={path}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.16}
        strokeWidth={1.2 * unit}
        transform={`scale(${1 - (14 * unit) / cw} ${1 - (14 * unit) / ch})`}
      />
    </g>
  );
};

export const MiniDisc: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const unit = Math.min(WIDTH, HEIGHT) / 1080;

  // Disk açısı (kümülatif integral), saat yönünün tersi
  const angle = MOTION_ENABLED ? ROT_DIRECTION * ANGLE_TABLE[Math.min(frame, DURATION_FRAMES)] : 0;

  // Kartuş süzülmesi: farklı periyotlu sinüslerin toplamı
  const [p1, p2, p3] = FLOAT_PERIODS;
  const s = (p: number, ph: number) => Math.sin((TAU * t) / p + ph);
  const fx = MOTION_ENABLED ? FLOAT_X * (0.2 * s(p1, 0.3) + 0.45 * s(p2, 1.1) + 0.35 * s(p3, 2.4)) : 0;
  const fy = MOTION_ENABLED ? FLOAT_Y * (0.2 * s(p1, 1.9) + 0.35 * s(p2, 0.2) + 0.45 * s(p3, 4.0)) : 0;
  const fr = MOTION_ENABLED ? FLOAT_ROT * (0.15 * s(p1, 2.7) + 0.5 * s(p2, 3.3) + 0.35 * s(p3, 0.9)) : 0;
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
    redOpacity = appear * 0.85 * (1 - cross);
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
  // Kırmızı ton: parlaklığı kırmızı kanala eşle
  const redMatrix = `${0.33 * rr} ${0.5 * rr} ${0.17 * rr} 0 0  ${0.33 * rg} ${0.5 * rg} ${0.17 * rg} 0 0  ${0.33 * rb} ${0.5 * rb} ${0.17 * rb} 0 0  0 0 0 1 0`;
  const flashMatrix = `${b} 0 0 0 0  0 ${b} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;

  const transform = `translate(${WIDTH / 2 + fx * unit} ${HEIGHT / 2 + fy * unit}) rotate(${fr}) scale(${fs * introScale})`;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <filter id="fx-red" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={redMatrix} />
            {blur > 0.01 && <feGaussianBlur stdDeviation={blur * unit} />}
          </filter>
          <filter id="fx-neutral" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={flashMatrix} />
            {blur > 0.01 && <feGaussianBlur stdDeviation={blur * unit} />}
          </filter>
        </defs>
        <g opacity={outro} transform={transform} style={{isolation: 'isolate'}}>
          {neutralOpacity > 0.001 && (
            <g opacity={neutralOpacity} filter={flash > 0.001 || blur > 0.01 ? 'url(#fx-neutral)' : undefined}>
              <Scene id="neu" angle={angle} unit={unit} />
            </g>
          )}
          {redOpacity > 0.001 && (
            <g opacity={redOpacity} filter="url(#fx-red)" style={{mixBlendMode: 'screen'}}>
              <Scene id="red" angle={angle} unit={unit} />
            </g>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
