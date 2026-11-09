import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------
export const GTR_W = 1080;
export const GTR_H = 1920;
export const GTR_FPS = 30;
export const NARRATION_SECONDS = 70.04;
export const GTR_DURATION = Math.round((NARRATION_SECONDS + 2.4) * GTR_FPS);

export const C = {
  black: '#080A0D',
  charcoal: '#15191F',
  graphite: '#252B32',
  amber: '#FFB347',
  orange: '#FF6A24',
  white: '#F2F3F5',
  gray: '#A5ADB7',
};
export const FONT = "'Space Grotesk', 'Inter', sans-serif";
export const TABULAR: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-0130,U+0132-0151,U+0154-02AF,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const fontFace = (w: number, sub: string, range: string) =>
  `@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:${w};src:url(${staticFile(
    `gtr_c8/fonts/space-grotesk-${sub}-${w}-normal.woff2`,
  )}) format('woff2');unicode-range:${range};}`;
export const FONT_CSS = [500, 700]
  .map((w) => fontFace(w, 'latin', LATIN) + fontFace(w, 'latin-ext', LATIN_EXT))
  .join('\n');

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ramp = (t: number, a: number, b: number, e = Easing.out(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], {...clamp, easing: e});
export const inOut = (t: number, a: number, b: number, fade = 0.35) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));

const SCENES = {
  s1: [0, 5.25],
  s2: [5.0, 16.05],
  s3: [15.9, 31.65],
  s4: [31.5, 44.05],
  s5: [43.9, 56.05],
  s6: [55.9, 65.75],
  s7: [65.6, 72.5],
} as const;

type Cap = {s: number; e: number; text: string; hl?: string[]};
// Zamanlar, seslendirmedeki duraklamalardan (ffmpeg silencedetect) türetildi.
const CAPTIONS: Cap[] = [
  {s: 0.1, e: 0.95, text: 'İki farklı'},
  {s: 0.95, e: 1.95, text: 'mühendislik felsefesi…', hl: ['felsefesi…']},
  {s: 2.32, e: 3.25, text: 'Peki hangisi'},
  {s: 3.25, e: 4.6, text: 'gerçekten daha hızlı?', hl: ['hızlı?']},
  {s: 5.06, e: 6.2, text: 'Nissan GT-R,', hl: ['GT-R,']},
  {s: 6.2, e: 7.9, text: 'motorunu öne yerleştirir', hl: ['öne']},
  {s: 7.9, e: 9.85, text: 've dört tekerleğinden birden çeker.', hl: ['dört']},
  {s: 10.15, e: 11.4, text: 'Corvette C8 ise', hl: ['C8']},
  {s: 11.4, e: 13.2, text: 'motoru sürücünün arkasına,'},
  {s: 13.2, e: 14.3, text: 'orta konuma alır', hl: ['orta']},
  {s: 14.3, e: 15.75, text: 've arkadan itişlidir.', hl: ['arkadan']},
  {s: 16.12, e: 18.0, text: "GT-R'ın 3,8 litrelik", hl: ['3,8']},
  {s: 18.0, e: 19.9, text: "çift turbolu V6'sı", hl: ['turbolu']},
  {s: 19.9, e: 21.65, text: '565 beygir üretir.', hl: ['565']},
  {s: 21.91, e: 24.0, text: "Corvette'in 6,2 litrelik", hl: ['6,2']},
  {s: 24.0, e: 26.0, text: "atmosferik V8'i ise,", hl: ['atmosferik']},
  {s: 26.0, e: 28.7, text: 'Z51 paketiyle 495 beygir.', hl: ['495']},
  {s: 28.91, e: 30.0, text: 'Biri gücü turbodan,', hl: ['turbodan,']},
  {s: 30.0, e: 31.4, text: 'diğeri hacimden alır.', hl: ['hacimden']},
  {s: 31.77, e: 33.6, text: 'GT-R, şanzımanı arkaya,', hl: ['arkaya,']},
  {s: 33.6, e: 35.8, text: 'bağımsız bir aktarma ünitesine taşır.'},
  {s: 36.06, e: 38.15, text: "Corvette'te ise motorun kendisi,"},
  {s: 38.24, e: 40.0, text: 'arka aksın hemen önünde durur.', hl: ['önünde']},
  {s: 40.32, e: 42.6, text: 'İkisi de ağırlığı arkaya doğru kaydırır,'},
  {s: 42.7, e: 43.85, text: 'ama farklı yollardan.', hl: ['farklı']},
  {s: 44.16, e: 46.0, text: 'Viraj çıkışında GT-R,', hl: ['GT-R,']},
  {s: 46.0, e: 47.4, text: 'torkunu gerektiğinde'},
  {s: 47.4, e: 48.95, text: "yüzde 50'ye kadar öne gönderebilir.", hl: ['50\'ye']},
  {s: 49.17, e: 50.6, text: 'Corvette ise bütün gücü'},
  {s: 50.6, e: 52.0, text: 'arka tekerleklere verir.', hl: ['arka']},
  {s: 52.19, e: 53.9, text: 'Biri çekişi paylaşır,', hl: ['paylaşır,']},
  {s: 53.9, e: 55.7, text: 'diğeri arka lastiğin gücüne yaslanır.', hl: ['yaslanır.']},
  {s: 55.98, e: 57.2, text: 'İkisinde de çift kavramalı'},
  {s: 57.2, e: 58.3, text: 'şanzıman var.', hl: ['şanzıman']},
  {s: 58.52, e: 59.7, text: "GT-R'da altı,", hl: ['altı,']},
  {s: 59.82, e: 61.2, text: "Corvette'te sekiz vites.", hl: ['sekiz']},
  {s: 61.37, e: 63.55, text: 'Sıradaki vites önceden hazır bekler,', hl: ['hazır']},
  {s: 63.67, e: 65.6, text: 'geçiş neredeyse kesintisiz olur.', hl: ['kesintisiz']},
  {s: 65.97, e: 66.95, text: 'Rakamlar yakın,'},
  {s: 67.19, e: 68.4, text: 'felsefeler farklı.', hl: ['farklı.']},
];

// ---------------------------------------------------------------------------
// Temel bileşenler
// ---------------------------------------------------------------------------
export const Background: React.FC<{t: number}> = ({t}) => {
  const sweep = ((t * 0.07) % 1.4) - 0.2;
  return (
    <AbsoluteFill style={{background: C.black}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 45% at 50% 108%, rgba(255,106,36,0.20), transparent 70%),
                       radial-gradient(ellipse 80% 40% at 50% -5%, rgba(255,179,71,0.08), transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${sweep * 100}%`,
          top: 0,
          width: 260,
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,179,71,0.035), transparent)',
          transform: 'skewX(-14deg)',
        }}
      />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)'}}
      />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{t: number; range: readonly [number, number]; children: React.ReactNode}> = ({
  t,
  range,
  children,
}) => {
  if (t < range[0] || t > range[1]) return null;
  return <AbsoluteFill style={{opacity: inOut(t, range[0], range[1], 0.4)}}>{children}</AbsoluteFill>;
};

const CaptionLayer: React.FC<{t: number}> = ({t}) => {
  const cap = CAPTIONS.find((c) => t >= c.s && t < c.e);
  if (!cap) return null;
  const a = Math.min(ramp(t, cap.s, cap.s + 0.18), 1 - ramp(t, cap.e - 0.12, cap.e));
  const y = interpolate(ramp(t, cap.s, cap.s + 0.25), [0, 1], [10, 0]);
  const words = cap.text.split(' ');
  return (
    <div
      style={{
        position: 'absolute',
        top: 215,
        left: 70,
        width: GTR_W - 140,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 54,
        lineHeight: 1.16,
        letterSpacing: '-0.01em',
        color: C.white,
        opacity: a,
        transform: `translateY(${y}px)`,
        textShadow: '0 2px 18px rgba(0,0,0,0.85)',
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{color: cap.hl?.includes(w) ? C.amber : C.white}}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  );
};

export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  sub?: string;
  p: number;
  align?: 'left' | 'right';
  color?: string;
}> = ({x, y, text, sub, p, align = 'left', color = C.gray}) => (
  <div
    style={{
      position: 'absolute',
      left: align === 'left' ? x : undefined,
      right: align === 'right' ? GTR_W - x : undefined,
      top: y,
      opacity: p,
      transform: `translateY(${(1 - p) * 8}px)`,
      fontFamily: FONT,
      textAlign: align,
    }}
  >
    <div style={{fontWeight: 500, fontSize: 24, letterSpacing: '0.16em', color, textTransform: 'uppercase'}}>{text}</div>
    {sub && <div style={{fontWeight: 500, fontSize: 21, color: C.gray, opacity: 0.8, marginTop: 4}}>{sub}</div>}
  </div>
);

export const Chip: React.FC<{x: number; y: number; text: string; p: number; hot?: boolean}> = ({x, y, text, p, hot}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      opacity: p,
      transform: `translateY(${(1 - p) * 8}px)`,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 22,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      padding: '8px 16px',
      borderRadius: 6,
      border: `1.5px solid ${hot ? C.amber : 'rgba(165,173,183,0.5)'}`,
      color: hot ? C.amber : C.white,
      background: 'rgba(8,10,13,0.62)',
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Araç görselleri
// ---------------------------------------------------------------------------
type Fit = {src: string; W: number; cx: number; cy: number; flip?: boolean};
export const IMG_AR = 1152 / 2048;
const place = (f: Fit, pw: number, ph: number, zoom = 1) => {
  const W = f.W * zoom;
  const H = W * IMG_AR;
  return {W, H, left: pw / 2 - f.cx * W, top: ph / 2 - f.cy * H};
};

const SIDE: Record<'gtr' | 'c8', {beauty: Fit; xray: Fit; eng: [number, number]; engX: [number, number]}> = {
  gtr: {
    beauty: {src: 'gtr_c8/vehicles/gtr_side.png', W: 1390, cx: 0.49, cy: 0.52},
    xray: {src: 'gtr_c8/vehicles/gtr_xray.png', W: 1390, cx: 0.505, cy: 0.5},
    eng: [0.7, 0.5],
    engX: [0.65, 0.49],
  },
  c8: {
    beauty: {src: 'gtr_c8/vehicles/c8_side.png', W: 1640, cx: 0.505, cy: 0.52},
    xray: {src: 'gtr_c8/vehicles/c8_xray.png', W: 1235, cx: 0.505, cy: 0.54, flip: true},
    eng: [0.41, 0.5],
    engX: [0.41, 0.54],
  },
};

export const Pulse: React.FC<{x: number; y: number; t: number; p: number; r?: number}> = ({x, y, t, p, r = 46}) => {
  const k = (t * 0.9) % 1;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', opacity: p}}>
      <circle cx={x} cy={y} r={r * (0.7 + k * 0.9)} fill="none" stroke={C.amber} strokeWidth={2} opacity={1 - k} />
      <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke={C.amber} strokeWidth={3} />
      <circle cx={x} cy={y} r={7} fill={C.amber} />
    </svg>
  );
};

const SidePanel: React.FC<{
  car: 'gtr' | 'c8';
  t: number;
  y: number;
  emph: number; // 0..1
  xray: number; // 0..1
  marker: number; // 0..1
  zoom?: number;
  title: string;
  chips: string[];
  engineLabel: string;
  engineSub: string;
  labelLeft?: boolean;
}> = ({car, t, y, emph, xray, marker, zoom = 1, title, chips, engineLabel, engineSub, labelLeft}) => {
  const PH = 600;
  const cfg = SIDE[car];
  const b = place(cfg.beauty, GTR_W, PH, zoom);
  const x = place(cfg.xray, GTR_W, PH, zoom);
  const bx = b.left + cfg.eng[0] * b.W;
  const by = b.top + cfg.eng[1] * b.H;
  const xx = x.left + cfg.engX[0] * x.W;
  const xy = x.top + cfg.engX[1] * x.H;
  const mx = bx + (xx - bx) * xray;
  const my = by + (xy - by) * xray;
  const dim = 0.32 + 0.68 * emph;
  const lx = labelLeft ? 70 : GTR_W - 70;
  const ly = 70;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: GTR_W, height: PH, overflow: 'hidden', opacity: dim}}>
      <Img
        src={staticFile(cfg.beauty.src)}
        style={{position: 'absolute', left: b.left, top: b.top, width: b.W, height: b.H, opacity: 1 - xray * 0.97}}
      />
      <Img
        src={staticFile(cfg.xray.src)}
        style={{
          position: 'absolute',
          left: x.left,
          top: x.top,
          width: x.W,
          height: x.H,
          opacity: xray,
          transform: cfg.xray.flip ? 'scaleX(-1)' : undefined,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,13,0.5), transparent 28%, transparent 78%, rgba(8,10,13,0.7))'}} />
      <Pulse x={mx} y={my} t={t} p={marker} />
      {/* kılavuz çizgisi */}
      <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: marker}}>
        <polyline
          points={`${mx},${my - 46} ${mx},${ly + 74} ${lx},${ly + 74}`}
          fill="none"
          stroke={C.amber}
          strokeWidth={2}
          strokeDasharray="6 6"
        />
      </svg>
      <Label x={lx} y={ly - 6} text={engineLabel} sub={engineSub} p={marker} align={labelLeft ? 'left' : 'right'} color={C.amber} />
      <Label x={70} y={PH - 78} text={title} p={1} color={C.white} />
      {chips.map((c, i) => (
        <Chip key={c} x={70 + i * 190} y={PH - 44} text={c} p={marker} hot />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 1 – Hook
// ---------------------------------------------------------------------------
export const FrontPanel: React.FC<{
  src: string;
  y: number;
  h: number;
  zoom: number;
  title: string;
  p: number;
  cx?: number;
}> = ({src, y, h, zoom, title, p, cx = 0.5}) => {
  const W = 1500 * zoom;
  const H = W * IMG_AR;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: GTR_W, height: h, overflow: 'hidden', opacity: p}}>
      <Img src={staticFile(src)} style={{position: 'absolute', width: W, height: H, left: GTR_W / 2 - cx * W, top: h / 2 - 0.5 * H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,13,0.55), transparent 30%, transparent 70%, rgba(8,10,13,0.8))'}} />
      <Label x={70} y={h - 64} text={title} p={1} color={C.white} />
    </div>
  );
};

const Scene1: React.FC<{t: number}> = ({t}) => {
  const z = 1 + t * 0.022;
  const q = ramp(t, 3.3, 4.2);
  return (
    <>
      <FrontPanel src="gtr_c8/vehicles/gtr_front34.png" y={360} h={600} zoom={z} title="Nissan GT-R R35" p={ramp(t, 0.5, 1.6)} cx={0.5} />
      <FrontPanel src="gtr_c8/vehicles/c8_front34.png" y={990} h={600} zoom={z} title="Chevrolet Corvette C8 Stingray" p={ramp(t, 1.4, 2.5)} cx={0.5} />
      <svg style={{position: 'absolute', left: 0, top: 0, width: GTR_W, height: GTR_H}}>
        <line x1={70} x2={70 + 940 * ramp(t, 0.2, 2.2)} y1={975} y2={975} stroke={C.amber} strokeWidth={2} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: GTR_W,
          top: 805,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 260,
          color: C.amber,
          opacity: q * 0.9,
          transform: `scale(${0.9 + q * 0.1})`,
          textShadow: '0 0 60px rgba(255,106,36,0.55)',
          lineHeight: 1,
        }}
      >
        ?
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 2 – Felsefe + X-ray
// ---------------------------------------------------------------------------
const Scene2: React.FC<{t: number}> = ({t}) => {
  const gtrOn = ramp(t, 5.0, 5.6) * (1 - 0.7 * ramp(t, 9.95, 10.4));
  const c8On = 0.3 + 0.7 * ramp(t, 9.95, 10.4);
  const z = 1 + (t - 5) * 0.004;
  return (
    <>
      <SidePanel
        car="gtr"
        t={t}
        y={330}
        emph={gtrOn}
        xray={ramp(t, 6.0, 7.6, Easing.inOut(Easing.cubic))}
        marker={ramp(t, 6.6, 7.4)}
        zoom={z}
        title="Nissan GT-R · Ön motor"
        chips={['AWD']}
        engineLabel="Motor · önde"
        engineSub="Çift turbo V6"
        labelLeft
      />
      <SidePanel
        car="c8"
        t={t}
        y={960}
        emph={c8On}
        xray={ramp(t, 11.6, 13.2, Easing.inOut(Easing.cubic))}
        marker={ramp(t, 12.4, 13.2)}
        zoom={z}
        title="Corvette C8 · Orta motor"
        chips={['RWD']}
        engineLabel="Motor · ortada"
        engineSub="Atmosferik V8"
        labelLeft={false}
      />
      <Label x={70} y={1590} text="X-ray görünüm: illüstratif, ölçekli mühendislik çizimi değildir" p={0.7} />
    </>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 3 – Güç
// ---------------------------------------------------------------------------
const PowerBlock: React.FC<{
  y: number;
  src: string;
  name: string;
  engine: string;
  hp: number;
  tq: number;
  hpFrom: number;
  hpTo: number;
  t: number;
  tqAt: number;
  tag: string;
  tagAt: number;
  maxHp: number;
  cx?: number;
}> = ({y, src, name, engine, hp, tq, hpFrom, hpTo, t, tqAt, tag, tagAt, maxHp, cx}) => {
  const k = ramp(t, hpFrom, hpTo, Easing.out(Easing.quad));
  const shown = Math.round(hp * k);
  const bar = k * (hp / maxHp);
  const show = 0.3 + 0.7 * ramp(t, hpFrom - 1.6, hpFrom - 0.9);
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: GTR_W, height: 590, opacity: show}}>
      <FrontPanel src={src} y={0} h={250} zoom={1 + (t - 16) * 0.004} title={name} p={1} cx={cx} />
      <div style={{position: 'absolute', left: 70, top: 262, fontFamily: FONT, fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: C.gray, textTransform: 'uppercase'}}>
        {engine}
      </div>
      <div style={{position: 'absolute', left: 70, top: 296, fontFamily: FONT, fontWeight: 700, fontSize: 168, lineHeight: 1, color: C.amber, ...TABULAR}}>
        {shown}
        <span style={{fontSize: 40, color: C.white, marginLeft: 14, letterSpacing: '0.1em'}}>HP</span>
      </div>
      <div style={{position: 'absolute', right: 70, top: 322, textAlign: 'right', fontFamily: FONT, opacity: ramp(t, tqAt, tqAt + 0.5)}}>
        <div style={{fontWeight: 700, fontSize: 64, color: C.white, ...TABULAR}}>{tq}</div>
        <div style={{fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: C.gray}}>LB-FT TORK</div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 500, width: 940, height: 6, background: 'rgba(165,173,183,0.18)', borderRadius: 3}}>
        <div style={{width: `${bar * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.orange}, ${C.amber})`, borderRadius: 3, boxShadow: '0 0 14px rgba(255,106,36,0.7)'}} />
      </div>
      <Chip x={70} y={528} text={tag} p={ramp(t, tagAt, tagAt + 0.5)} hot />
    </div>
  );
};

const Scene3: React.FC<{t: number}> = ({t}) => (
  <>
    <PowerBlock
      y={330}
      src="gtr_c8/vehicles/gtr_front34.png"
      name="Nissan GT-R · VR38"
      engine="3,8 L · Çift turbo V6"
      hp={565}
      tq={467}
      hpFrom={18.6}
      hpTo={21.4}
      t={t}
      tqAt={21.3}
      tag="Güç: turboyla"
      tagAt={28.95}
      maxHp={600}
    />
    <PowerBlock
      y={950}
      src="gtr_c8/vehicles/c8_front34.png"
      name="Corvette Stingray · LT2"
      engine="6,2 L · Atmosferik V8"
      hp={495}
      tq={470}
      hpFrom={24.2}
      hpTo={28.4}
      t={t}
      tqAt={28.4}
      tag="Güç: hacimle"
      tagAt={30.0}
      maxHp={600}
    />
    <Label x={70} y={1570} text="GT-R Premium (MY2024) · Stingray Z51 · üretici verisi" p={0.75} />
  </>
);

// ---------------------------------------------------------------------------
// SAHNE 4 – Ağırlık / yerleşim (üstten)
// ---------------------------------------------------------------------------
type Top = {src: string; scale: number; cx: number; cy: number; nose: number; tail: number};
const TOPS: Record<'gtr' | 'c8', {fit: Top; engine: number; trans: number; frontAxle: number; rearAxle: number}> = {
  gtr: {fit: {src: 'gtr_c8/vehicles/gtr_top.png', scale: 0.85, cx: 0.504, cy: 0.51, nose: 0.175, tail: 0.84}, engine: 0.31, trans: 0.72, frontAxle: 0.27, rearAxle: 0.69},
  c8: {fit: {src: 'gtr_c8/vehicles/c8_top.png', scale: 0.70, cx: 0.504, cy: 0.5, nose: 0.095, tail: 0.9}, engine: 0.6, trans: 0.7, frontAxle: 0.28, rearAxle: 0.74},
};

const TopPanel: React.FC<{
  car: 'gtr' | 'c8';
  x: number;
  t: number;
  t0: number;
  title: string;
  engLabel: string;
  trLabel: string;
  trSame?: boolean;
}> = ({car, x, t, t0, title, engLabel, trLabel, trSame}) => {
  const PW = 530;
  const PH = 1000;
  const d = TOPS[car];
  const W = 2048 * d.fit.scale;
  const H = W * IMG_AR;
  const left = PW / 2 - d.fit.cx * W;
  const top = PH / 2 - d.fit.cy * H;
  const px = PW / 2;
  const ey = top + d.engine * H;
  const ty = top + d.trans * H;
  const eP = ramp(t, t0, t0 + 0.8);
  const tP = ramp(t, t0 + 1.2, t0 + 2.0);
  const lineP = ramp(t, t0 + 1.8, t0 + 3.2);
  return (
    <div style={{position: 'absolute', left: x, top: 400, width: PW, height: PH, overflow: 'hidden', borderTop: `1px solid rgba(165,173,183,0.25)`}}>
      <Img src={staticFile(d.fit.src)} style={{position: 'absolute', left, top, width: W, height: H, opacity: 0.88}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,13,0.55), transparent 22%, transparent 82%, rgba(8,10,13,0.75))'}} />
      <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
        {/* aks çizgileri */}
        {[d.frontAxle, d.rearAxle].map((a, i) => (
          <line key={i} x1={px - 235} x2={px + 235} y1={top + a * H} y2={top + a * H} stroke={C.gray} strokeWidth={1.2} strokeDasharray="4 7" opacity={0.55 * eP} />
        ))}
        {/* motor → aktarma */}
        <line x1={px} x2={px} y1={ey} y2={ey + (ty - ey) * lineP} stroke={C.amber} strokeWidth={4} opacity={0.95} />
        <circle cx={px} cy={ey} r={30 * eP} fill="rgba(255,179,71,0.18)" stroke={C.amber} strokeWidth={3} />
        <circle cx={px} cy={ty} r={22 * tP} fill="rgba(255,106,36,0.22)" stroke={C.orange} strokeWidth={3} />
      </svg>
      <div style={{position: 'absolute', left: 14, top: ey - 18, opacity: eP, background: 'rgba(8,10,13,0.82)', padding: '6px 10px', borderRadius: 6,  fontFamily: FONT, fontWeight: 700, fontSize: 21, letterSpacing: '0.12em', color: C.amber, textTransform: 'uppercase', maxWidth: 150, lineHeight: 1.2}}>
        {engLabel}
      </div>
      <div style={{position: 'absolute', right: 14, top: ty - 18, opacity: tP, background: 'rgba(8,10,13,0.82)', padding: '6px 10px', borderRadius: 6,  textAlign: 'right', fontFamily: FONT, fontWeight: 700, fontSize: 21, letterSpacing: '0.12em', color: trSame ? C.amber : C.orange, textTransform: 'uppercase', maxWidth: 150, lineHeight: 1.2}}>
        {trLabel}
      </div>
      <Label x={14} y={PH - 66} text={title} p={1} color={C.white} />
    </div>
  );
};

const Scene4: React.FC<{t: number}> = ({t}) => (
  <>
    <TopPanel car="gtr" x={10} t={t} t0={31.9} title="GT-R" engLabel="Motor önde" trLabel="Arkada aktarma ünitesi" />
    <TopPanel car="c8" x={GTR_W / 2 + 10} t={t} t0={36.3} title="Corvette C8" engLabel="Motor ortada" trLabel="Aksın hemen önünde" trSame />
    <Label x={70} y={1430} text="Üstten görünüm · bileşen konumları illüstratif" p={0.7} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: GTR_W,
        top: 1480,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: C.amber,
        opacity: ramp(t, 42.6, 43.4),
      }}
    >
      Aynı yön · farklı yollar
    </div>
  </>
);

// ---------------------------------------------------------------------------
// SAHNE 5 – Çekiş (şematik viraj)
// ---------------------------------------------------------------------------
const ROAD = 'M 150 360 L 150 290 Q 150 150 290 150 L 1010 150';
const P0 = {x: 150, y: 360};
const SEG1 = 70;
const bez = (u: number) => ({
  x: (1 - u) * (1 - u) * 150 + 2 * (1 - u) * u * 150 + u * u * 290,
  y: (1 - u) * (1 - u) * 290 + 2 * (1 - u) * u * 150 + u * u * 150,
});
const SEG2 = (() => {
  let len = 0;
  let prev = bez(0);
  for (let i = 1; i <= 40; i++) {
    const q = bez(i / 40);
    len += Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  return len;
})();
const SEG3 = 720;
const pathPoint = (p: number) => {
  let s = p * (SEG1 + SEG2 + SEG3);
  if (s <= SEG1) return {x: P0.x, y: P0.y - s, a: -90};
  s -= SEG1;
  if (s <= SEG2) {
    const u = s / SEG2;
    const q = bez(u);
    const dx = 2 * u * (290 - 150);
    const dy = 2 * (1 - u) * (150 - 290);
    return {x: q.x, y: q.y, a: (Math.atan2(dy, dx) * 180) / Math.PI};
  }
  s -= SEG2;
  return {x: 290 + s, y: 150, a: 0};
};

const CornerPanel: React.FC<{
  t: number;
  y: number;
  t0: number;
  t1: number;
  awd: boolean;
  title: string;
  sub: string;
}> = ({t, y, t0, t1, awd, title, sub}) => {
  const p = ramp(t, t0, t1, Easing.inOut(Easing.quad)) * 0.9;
  const pt = pathPoint(p);
  const corner = ramp(p, 0.2, 0.45) * (1 - ramp(p, 0.6, 0.78));
  const exit = ramp(p, 0.45, 0.62);
  const show = ramp(t, t0 - 0.6, t0);
  const rear = 54 + exit * 10;
  const front = awd ? 22 + exit * 6 : 0;
  const arrow = (cx: number, cy: number, len: number, key: string) => (
    <g key={key}>
      <line x1={cx} x2={cx} y1={cy} y2={cy - len} stroke={C.amber} strokeWidth={5} strokeLinecap="round" />
      <path d={`M ${cx - 9} ${cy - len + 11} L ${cx} ${cy - len - 5} L ${cx + 9} ${cy - len + 11}`} fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: GTR_W, height: 590, opacity: show, overflow: 'hidden', borderTop: '1px solid rgba(165,173,183,0.25)'}}>
      <svg width={GTR_W} height={590} viewBox="0 0 1080 590">
        <g transform="translate(0,40)">
          <path d={ROAD} fill="none" stroke="#14181E" strokeWidth={170} strokeLinejoin="round" />
          <path d={ROAD} fill="none" stroke="rgba(242,243,245,0.28)" strokeWidth={172} strokeLinejoin="round" strokeDasharray="1 0" opacity={0} />
          <path d={ROAD} fill="none" stroke={C.gray} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="22 22" />
          {/* iz */}
          <g transform={`translate(${pt.x},${pt.y}) rotate(${pt.a + 90}) scale(1.3)`}>
            {/* gövde */}
            <rect x={-30} y={-64} width={60} height={128} rx={20} fill="#2A3038" stroke={C.white} strokeOpacity={0.55} strokeWidth={2} />
            <rect x={-20} y={-30} width={40} height={50} rx={12} fill="#0B0D10" />
            {/* tekerlekler + temas yamaları */}
            {[
              [-36, -40],
              [36, -40],
              [-36, 40],
              [36, 40],
            ].map(([wx, wy], i) => (
              <g key={i}>
                <rect x={wx - 8} y={wy - 15} width={16} height={30} rx={4} fill="#0B0D10" stroke={C.gray} strokeOpacity={0.6} />
                <rect x={wx - 6} y={wy - 12} width={12} height={24} rx={3} fill={C.amber} opacity={0.25 + 0.45 * corner} />
              </g>
            ))}
            {/* tork okları */}
            {arrow(-36, 36, rear, 'rl')}
            {arrow(36, 36, rear, 'rr')}
            {awd && arrow(-36, -44, front, 'fl')}
            {awd && arrow(36, -44, front, 'fr')}
          </g>
        </g>
      </svg>
      <Label x={70} y={468} text={title} sub={sub} p={1} color={C.white} />
      <Chip x={GTR_W - 70 - (awd ? 330 : 190)} y={478} text={awd ? 'Öne ≤ %50 tork' : 'Tork: arkaya'} p={ramp(t, t0 + 1.4, t0 + 2.0)} hot />
      <Label x={70} y={556} text="Şematik animasyon · ölçekli değildir" p={0.6} />
    </div>
  );
};

const Scene5: React.FC<{t: number}> = ({t}) => (
  <>
    <CornerPanel t={t} y={350} t0={44.2} t1={51.2} awd title="GT-R · ATTESA E-TS" sub="AWD · bağımsız arka transaxle" />
    <CornerPanel t={t} y={960} t0={49.2} t1={56.0} awd={false} title="Corvette C8" sub="RWD · arka tekerleklere güç" />
  </>
);

// ---------------------------------------------------------------------------
// SAHNE 6 – Şanzıman (şematik DCT)
// ---------------------------------------------------------------------------
const gearPath = (r: number, teeth: number) => {
  const pts: string[] = [];
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = i % 4 === 0 || i % 4 === 1 ? r : r - 7;
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`);
  }
  return `M ${pts.join(' L ')} Z`;
};

const DctPanel: React.FC<{
  t: number;
  y: number;
  t0: number;
  gears: number;
  title: string;
}> = ({t, y, t0, gears, title}) => {
  const show = ramp(t, t0, t0 + 0.6);
  const step = Math.max(0, Math.floor((t - (t0 + 2.2)) / 0.85));
  const active = (step % gears) + 1;
  const pre = (active % gears) + 1;
  const spin = t * 90;
  const cols = gears / 2;
  const gx = (i: number) => 400 + (i * 470) / (cols - 1 || 1);
  const rowOdd = 110;
  const rowEven = 300;
  const outY = 205;
  const label = (n: number, hot: boolean, ghost: boolean) => (hot ? C.amber : ghost ? C.orange : C.gray);
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: GTR_W, height: 590, opacity: show, borderTop: '1px solid rgba(165,173,183,0.25)'}}>
      <svg width={GTR_W} height={520} viewBox="0 0 1080 520" style={{position: 'absolute', top: 20}}>
        {/* giriş şaftı */}
        <circle cx={70} cy={outY} r={30} fill="none" stroke={C.white} strokeWidth={3} />
        <text x={70} y={outY + 64} fill={C.gray} fontSize={19} fontFamily={FONT} textAnchor="middle" fontWeight={500}>MOTOR</text>
        <path d={`M 100 ${outY} L 190 ${outY}`} stroke={C.gray} strokeWidth={3} />
        <path d={`M 190 ${outY} L 190 ${rowOdd} L 250 ${rowOdd}`} fill="none" stroke={C.gray} strokeWidth={3} />
        <path d={`M 190 ${outY} L 190 ${rowEven} L 250 ${rowEven}`} fill="none" stroke={C.gray} strokeWidth={3} />
        {/* kavramalar */}
        {[
          {cy: rowOdd, name: 'K1 · TEK', on: active % 2 === 1},
          {cy: rowEven, name: 'K2 · ÇİFT', on: active % 2 === 0},
        ].map((k) => (
          <g key={k.name}>
            <circle cx={290} cy={k.cy} r={38} fill={k.on ? 'rgba(255,179,71,0.22)' : 'rgba(37,43,50,0.8)'} stroke={k.on ? C.amber : C.gray} strokeWidth={3} />
            <circle cx={290} cy={k.cy} r={20} fill="none" stroke={k.on ? C.amber : C.gray} strokeWidth={2} />
            <text x={290} y={k.cy + 66} fill={k.on ? C.amber : C.gray} fontSize={18} fontFamily={FONT} textAnchor="middle" fontWeight={700}>{k.name}</text>
          </g>
        ))}
        {/* şaftlar */}
        <line x1={330} x2={gx(cols - 1) + 40} y1={rowOdd} y2={rowOdd} stroke={C.gray} strokeWidth={3} opacity={0.7} />
        <line x1={330} x2={gx(cols - 1) + 40} y1={rowEven} y2={rowEven} stroke={C.gray} strokeWidth={3} opacity={0.7} />
        <line x1={380} x2={gx(cols - 1) + 82} y1={outY} y2={outY} stroke={C.white} strokeWidth={4} opacity={0.8} />
        <text x={gx(cols - 1) + 92} y={outY + 6} fill={C.white} fontSize={19} fontFamily={FONT} fontWeight={700}>ÇIKIŞ</text>
        {/* dişliler */}
        {Array.from({length: gears}).map((_, idx) => {
          const n = idx + 1;
          const odd = n % 2 === 1;
          const col = Math.floor(idx / 2);
          const cx = gx(col);
          const cy = odd ? rowOdd : rowEven;
          const hot = n === active;
          const ghost = n === pre;
          const dir = (col % 2 === 0 ? 1 : -1) * (odd ? 1 : -1);
          return (
            <g key={n}>
              <line x1={cx} x2={cx} y1={cy} y2={outY} stroke={hot ? C.amber : ghost ? C.orange : C.gray} strokeWidth={hot ? 5 : ghost ? 3 : 1.5} strokeDasharray={ghost ? '6 6' : undefined} opacity={hot || ghost ? 1 : 0.35} />
              <g transform={`translate(${cx},${cy}) rotate(${spin * dir})`}>
                <path d={gearPath(30, 10)} fill={hot ? 'rgba(255,179,71,0.25)' : 'rgba(37,43,50,0.9)'} stroke={label(n, hot, ghost)} strokeWidth={hot ? 3.5 : 2} strokeDasharray={ghost ? '5 4' : undefined} />
              </g>
              <text x={cx} y={cy + 8} fill={hot ? C.amber : C.white} fontSize={22} fontFamily={FONT} textAnchor="middle" fontWeight={700}>{n}</text>
            </g>
          );
        })}
      </svg>
      <Label x={70} y={405} text={title} sub={`${gears} ileri vites · çift kavrama`} p={1} color={C.white} />
      <Chip x={70} y={505} text={`Aktif: ${active}. vites`} p={ramp(t, t0 + 2.2, t0 + 2.8)} hot />
      <Chip x={380} y={505} text={`Hazır: ${pre}. vites`} p={ramp(t, t0 + 2.2, t0 + 2.8)} />
    </div>
  );
};

const Scene6: React.FC<{t: number}> = ({t}) => (
  <>
    <DctPanel t={t} y={340} t0={56.4} gears={6} title="GT-R · 6 vites" />
    <DctPanel t={t} y={950} t0={59.4} gears={8} title="Corvette C8 · 8 vites" />
    <Label x={70} y={1560} text="Şematik gösterim · gerçek dişli yerleşimi değildir" p={0.65} />
  </>
);

// ---------------------------------------------------------------------------
// SAHNE 7 – Final
// ---------------------------------------------------------------------------
const ROWS: [string, string, string][] = [
  ['Motor', '3,8 L çift turbo V6', '6,2 L atmosferik V8'],
  ['Güç', '565 HP', '495 HP'],
  ['Tork', '467 lb-ft', '470 lb-ft'],
  ['Çekiş', 'AWD', 'RWD'],
  ['Şanzıman', '6 vites DCT', '8 vites DCT'],
];

const Scene7: React.FC<{t: number}> = ({t}) => {
  const q = ramp(t, 68.6, 69.4);
  const table = 1 - ramp(t, 68.4, 68.9);
  return (
    <>
      <FrontPanel src="gtr_c8/vehicles/gtr_front34.png" y={330} h={330} zoom={1 + (t - 65.6) * 0.006} title="Nissan GT-R R35" p={ramp(t, 65.7, 66.5) * (1 - 0.5 * q)} />
      <FrontPanel src="gtr_c8/vehicles/c8_front34.png" y={680} h={330} zoom={1 + (t - 65.6) * 0.006} title="Chevrolet Corvette C8" p={ramp(t, 65.9, 66.7) * (1 - 0.5 * q)} />
      <div style={{position: 'absolute', left: 70, top: 1050, width: 940, fontFamily: FONT, opacity: table}}>
        {ROWS.map((r, i) => {
          const p = ramp(t, 66.0 + i * 0.18, 66.5 + i * 0.18);
          return (
            <div key={r[0]} style={{display: 'flex', alignItems: 'baseline', padding: '15px 0', borderBottom: '1px solid rgba(165,173,183,0.22)', opacity: p, transform: `translateY(${(1 - p) * 10}px)`}}>
              <div style={{width: 200, fontWeight: 500, fontSize: 22, letterSpacing: '0.14em', color: C.gray, textTransform: 'uppercase'}}>{r[0]}</div>
              <div style={{flex: 1, fontWeight: 700, fontSize: 34, color: i === 1 || i === 2 ? C.amber : C.white, ...TABULAR}}>{r[1]}</div>
              <div style={{flex: 1, fontWeight: 700, fontSize: 34, color: i === 1 || i === 2 ? C.amber : C.white, textAlign: 'right', ...TABULAR}}>{r[2]}</div>
            </div>
          );
        })}
        <div style={{marginTop: 18, fontWeight: 500, fontSize: 19, color: C.gray, opacity: 0.8}}>
          GT-R Premium MY2024 (Nissan) · Corvette Stingray Z51 (Chevrolet) · üretici değerleri
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 70,
          width: 940,
          top: 1110,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 96,
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
          color: C.white,
          opacity: q,
          transform: `translateY(${(1 - q) * 16}px)`,
          textShadow: '0 4px 40px rgba(0,0,0,0.9)',
        }}
      >
        SEN{' '}
        <span style={{color: C.amber}}>HANGİSİNİ</span>
        <br />
        SEÇERDİN?
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Kök
// ---------------------------------------------------------------------------
export const GtrVsC8: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / GTR_FPS;
  const [handle] = React.useState(() => delayRender('Space Grotesk yükleniyor'));
  React.useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      document.fonts.load('700 40px "Space Grotesk"', 'İĞŞÇÖÜığşçöü0123456789'),
      document.fonts.load('500 40px "Space Grotesk"', 'İĞŞÇÖÜığşçöü0123456789'),
      document.fonts.load('700 40px "Space Grotesk"', 'ABC'),
    ])
      .then(done)
      .catch(done);
  }, [handle]);

  const finalHold = t > 68.5;
  const showCaptions = !finalHold && !(t >= 65.6 && t < 65.97);
  return (
    <AbsoluteFill style={{background: C.black, fontFamily: FONT}}>
      <style>{FONT_CSS}</style>
      <Background t={t} />
      <Scene t={t} range={SCENES.s1}><Scene1 t={t} /></Scene>
      <Scene t={t} range={SCENES.s2}><Scene2 t={t} /></Scene>
      <Scene t={t} range={SCENES.s3}><Scene3 t={t} /></Scene>
      <Scene t={t} range={SCENES.s4}><Scene4 t={t} /></Scene>
      <Scene t={t} range={SCENES.s5}><Scene5 t={t} /></Scene>
      <Scene t={t} range={SCENES.s6}><Scene6 t={t} /></Scene>
      <Scene t={t} range={SCENES.s7}><Scene7 t={t} /></Scene>
      {showCaptions && <CaptionLayer t={t} />}
    </AbsoluteFill>
  );
};
