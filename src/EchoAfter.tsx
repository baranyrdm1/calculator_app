import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

// ============================================================================
// AYARLAR — tüm süreler (frame), renkler, boyutlar ve konumlar burada.
// ============================================================================
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const INTRO_FRAMES = 60; // 2.0 sn
export const OUTRO_FRAMES = 90; // 3.0 sn

const BG = '#000';

// Logo yerleşimi: SVG'deki (540,540) → çerçevede (540,860), ölçek 0.92
const LOGO_ANCHOR = {x: 540, y: 540};
const LOGO_POS = {x: 540, y: 860};
const LOGO_SCALE = 0.92;

// Logo geometrisi (logo.svg ile aynı)
const DISC = {cx: 302.4, cy: 540, r: 203.0};
const RINGS = [
  {cx: 432.2, opacity: 0.78, sw: 10, hubSw: 6.5},
  {cx: 562.0, opacity: 0.5, sw: 8, hubSw: 5.2},
  {cx: 691.8, opacity: 0.3, sw: 6.5, hubSw: 4.2},
  {cx: 821.6, opacity: 0.15, sw: 5, hubSw: 3.2},
];
const RING_HUB_R = 61.4;
const STREAK = {x: 379.5, y: 286.3, w: 69.0, h: 507.4, angle: 32};
// Süpürme: döndürülmüş koordinatta şeridin x kayması (soldan dışarıdan → sağdan dışarıya)
const STREAK_SWEEP_FROM = -(DISC.r + STREAK.w + (STREAK.x - DISC.cx)); // disk solunun dışı
const STREAK_SWEEP_TO = DISC.r - (STREAK.x - DISC.cx); // disk sağının dışı

// INTRO zamanlaması (frame)
const I_BLACK_END = 9;
const I_REVEAL = [9, 30] as const; // parıltı + disk
const I_DISC_SCALE_FROM = 0.94;
const I_SWEEP = [18, 42] as const;
const I_STREAK_REST_IN = [40, 47] as const; // şerit asıl yerinde yeniden belirir
const I_RINGS_START = 21;
const I_RING_STAGGER = 5;
const I_RING_DUR = 9; // son halka 45'te yerleşir
const I_RING_SLIDE = 60; // px, soldan
const I_BREATH = [45, 52] as const; // ölçek 1.00 → 1.01
const I_FADE = [52, 59] as const; // ölçek 1.01 → 1.03, opaklık 1 → 0 (son kare siyah)

// OUTRO zamanlaması (frame)
const O_REVEAL = [0, 12] as const;
const O_SCALE_FROM = 1.03;
const O_SWEEP = [6, 36] as const;
const O_STREAK_OUT = [3, 8] as const; // süpürme sırasında sabit şerit gizlenir
const O_STREAK_IN = [33, 40] as const;
const O_BREATH = [12, 72] as const;
const O_BREATH_AMP = 0.12; // değer × (0.88 + 0.12·cos(2π·t/2sn)) — 12. ve 72. karede 1.0'a oturur
const O_BREATH_PERIOD = 2; // sn
const O_TEXT_IN = [30, 54] as const;
const O_FADE = [72, 89] as const; // son kare siyah

// Yazı
const HANDLE = '@echoafter7';
const TEXT_Y = 1210; // yazının dikey merkezi
const FONT_SIZE = 58;
const TEXT_COLOR = '#F4E4CF';
const TEXT_GLOW = '0 0 22px rgba(240,180,108,0.35)';
const LS_FROM = 0.5; // em
const LS_TO = 0.3; // em
const TEXT_RISE = 14; // px
const TEXT_BLUR = 6; // px
const ECHO_GHOSTS = [
  {dx: 14, opacity: 0.22},
  {dx: 28, opacity: 0.1},
];

// Jost 300 (Google Fonts). Render tarayıcısı Google'a erişemeyebildiği için dosya public/ altında yerel.
loadFont({family: 'Jost', url: staticFile('jost-300-latin.woff2'), weight: '300', format: 'woff2'}).catch(() => undefined);
const FONT_STACK = `Jost, "Segoe UI Light", "Helvetica Neue", sans-serif`;

// ============================================================================

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const outCubic = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
const lerp = (f: number, range: readonly [number, number], out: [number, number], easing = outCubic) =>
  interpolate(f, range as unknown as number[], out, {...clamp, easing});

type LogoState = {
  glow: number; // 0..1
  discOpacity: number;
  discScale: number;
  sweepX: number | null; // süpüren şeridin kayması (null = yok)
  streakRest: number; // asıl yerindeki şeridin opaklık çarpanı
  rings: {dx: number; k: number}[]; // her halka için x kayması ve opaklık çarpanı
};

// logo.svg — parçalara ayrılmış React bileşeni (arka plan dikdörtgeni kaldırıldı)
const Logo: React.FC<{s: LogoState; id: string}> = ({s, id}) => {
  const streakRect = (dx: number, opacity: number, key: string) => (
    <g key={key} transform={`rotate(${STREAK.angle} ${DISC.cx} ${DISC.cy})`} opacity={opacity}>
      <rect x={STREAK.x + dx} y={STREAK.y} width={STREAK.w} height={STREAK.h} fill={`url(#${id}-streak)`} />
    </g>
  );
  return (
    <svg width={1080} height={1080} viewBox="0 0 1080 1080" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-disc`} x1="0.1" y1="0.05" x2="0.9" y2="0.95">
          <stop offset="0" stopColor="#fbeedd" />
          <stop offset="0.42" stopColor="#f0b46c" />
          <stop offset="0.78" stopColor="#e0683f" />
          <stop offset="1" stopColor="#a23a4c" />
        </linearGradient>
        <linearGradient id={`${id}-streak`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-echoStroke`} gradientUnits="userSpaceOnUse" x1="302.4" y1="300" x2="821.6" y2="780">
          <stop offset="0" stopColor="#f6b970" />
          <stop offset="0.55" stopColor="#e0683f" />
          <stop offset="1" stopColor="#a03a5c" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e8873f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e8873f" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-discClip`}>
          <circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} />
        </clipPath>
      </defs>

      {/* (1) arka parıltı */}
      <circle cx="302.4" cy="540" r="385.6" fill={`url(#${id}-glow)`} opacity={s.glow} />

      {/* (2) yankı halkaları */}
      <g fill="none" stroke={`url(#${id}-echoStroke)`}>
        {RINGS.map((r, i) => (
          <g key={i} opacity={r.opacity * s.rings[i].k} strokeWidth={r.sw} transform={`translate(${s.rings[i].dx} 0)`}>
            <circle cx={r.cx} cy="540" r={DISC.r} />
            <circle cx={r.cx} cy="540" r={RING_HUB_R} strokeWidth={r.hubSw} />
          </g>
        ))}
      </g>

      {/* (3)(4)(5) disk + oluklar + şerit + göbek */}
      <g
        opacity={s.discOpacity}
        transform={`translate(${DISC.cx} ${DISC.cy}) scale(${s.discScale}) translate(${-DISC.cx} ${-DISC.cy})`}
      >
        <circle cx="302.4" cy="540" r="203.0" fill={`url(#${id}-disc)`} />
        <g clipPath={`url(#${id}-discClip)`}>
          <g fill="none" stroke="#2a0f1a" strokeOpacity="0.16" strokeWidth="2">
            <circle cx="302.4" cy="540" r="177.0" />
            <circle cx="302.4" cy="540" r="158.1" />
            <circle cx="302.4" cy="540" r="139.2" />
            <circle cx="302.4" cy="540" r="120.4" />
            <circle cx="302.4" cy="540" r="103.8" />
          </g>
          {s.streakRest > 0.001 && streakRect(0, s.streakRest, 'rest')}
          {s.sweepX !== null && streakRect(s.sweepX, 1, 'sweep')}
        </g>
        <circle cx="302.4" cy="540" r="203.0" fill="none" stroke="#fff4e4" strokeOpacity="0.55" strokeWidth="3" />

        <circle cx="302.4" cy="540" r="68.4" fill="#0b080d" />
        <circle cx="302.4" cy="540" r="68.4" fill="none" stroke="#fbeedd" strokeOpacity="0.85" strokeWidth="4" />
        <circle cx="302.4" cy="540" r="47.2" fill="none" stroke="#f0b46c" strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="302.4" cy="540" r="18.9" fill="#000" />
      </g>
    </svg>
  );
};

// Logoyu çerçeveye yerleştirir: (540,540) → (540,860), ölçek 0.92 × animasyon ölçeği
const PlacedLogo: React.FC<{s: LogoState; scale: number; opacity: number; id: string}> = ({s, scale, opacity, id}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1080,
      height: 1080,
      opacity,
      transformOrigin: `${LOGO_ANCHOR.x}px ${LOGO_ANCHOR.y}px`,
      transform: `translate(${LOGO_POS.x - LOGO_ANCHOR.x}px, ${LOGO_POS.y - LOGO_ANCHOR.y}px) scale(${LOGO_SCALE * scale})`,
    }}
  >
    <Logo s={s} id={id} />
  </div>
);

const sweepAt = (f: number, range: readonly [number, number]) =>
  f < range[0] || f > range[1] ? null : lerp(f, range, [STREAK_SWEEP_FROM, STREAK_SWEEP_TO], inOut);

// ---------------------------------------------------------------------------
export const EchoIntro: React.FC = () => {
  const f = useCurrentFrame();
  const reveal = lerp(f, I_REVEAL, [0, 1]);
  const s: LogoState = {
    glow: reveal,
    discOpacity: reveal,
    discScale: lerp(f, I_REVEAL, [I_DISC_SCALE_FROM, 1]),
    sweepX: sweepAt(f, I_SWEEP),
    streakRest: lerp(f, I_STREAK_REST_IN, [0, 1], inOut),
    rings: RINGS.map((_, i) => {
      const r: [number, number] = [I_RINGS_START + i * I_RING_STAGGER, I_RINGS_START + i * I_RING_STAGGER + I_RING_DUR];
      return {dx: lerp(f, r, [-I_RING_SLIDE, 0]), k: lerp(f, r, [0, 1])};
    }),
  };
  const scale = f < I_FADE[0] ? lerp(f, I_BREATH, [1, 1.01], inOut) : lerp(f, I_FADE, [1.01, 1.03], Easing.in(Easing.quad));
  const opacity = lerp(f, I_FADE, [1, 0], Easing.inOut(Easing.quad));

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      {f >= I_BLACK_END && opacity > 0 && <PlacedLogo s={s} scale={scale} opacity={opacity} id="intro" />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
export const EchoOutro: React.FC = () => {
  const f = useCurrentFrame();
  const reveal = lerp(f, O_REVEAL, [0, 1], Easing.inOut(Easing.quad));
  const breathT = (Math.min(Math.max(f, O_BREATH[0]), O_BREATH[1]) - O_BREATH[0]) / FPS;
  const breath = 1 - O_BREATH_AMP + O_BREATH_AMP * Math.cos((2 * Math.PI * breathT) / O_BREATH_PERIOD);
  const s: LogoState = {
    glow: 1,
    discOpacity: 1,
    discScale: 1,
    sweepX: sweepAt(f, O_SWEEP),
    streakRest: f < O_STREAK_IN[0] ? lerp(f, O_STREAK_OUT, [1, 0], inOut) : lerp(f, O_STREAK_IN, [0, 1], inOut),
    rings: RINGS.map(() => ({dx: 0, k: breath})),
  };
  const logoScale = interpolate(f, [0, OUTRO_FRAMES - 1], [O_SCALE_FROM, 1], {...clamp, easing: outCubic});
  const fade = lerp(f, O_FADE, [1, 0], Easing.inOut(Easing.quad));

  // Yazı
  const p = lerp(f, O_TEXT_IN, [0, 1]);
  const ls = LS_FROM + (LS_TO - LS_FROM) * p;
  const textStyle = (lsEm: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    width: WIDTH,
    top: TEXT_Y - FONT_SIZE * 0.6,
    height: FONT_SIZE * 1.2,
    lineHeight: `${FONT_SIZE * 1.2}px`,
    textAlign: 'center',
    fontFamily: FONT_STACK,
    fontWeight: 300,
    fontSize: FONT_SIZE,
    color: TEXT_COLOR,
    letterSpacing: `${lsEm}em`,
    paddingLeft: `${lsEm}em`, // harf aralığının sağda bıraktığı boşluğu telafi eder
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
  });
  const ghostOpacity = interpolate(f, [O_TEXT_IN[0], O_TEXT_IN[0] + 6, O_TEXT_IN[1]], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <AbsoluteFill style={{opacity: fade}}>
        <PlacedLogo s={s} scale={logoScale} opacity={reveal} id="outro" />
        {f >= O_TEXT_IN[0] &&
          ECHO_GHOSTS.map((g, i) => (
            <div
              key={i}
              style={{
                ...textStyle(ls),
                opacity: g.opacity * ghostOpacity,
                transform: `translate(${g.dx * (1 - p)}px, ${TEXT_RISE * (1 - p)}px)`,
                filter: `blur(${TEXT_BLUR * (1 - p)}px)`,
              }}
            >
              {HANDLE}
            </div>
          ))}
        {f >= O_TEXT_IN[0] && (
          <div
            style={{
              ...textStyle(ls),
              opacity: p,
              transform: `translateY(${TEXT_RISE * (1 - p)}px)`,
              filter: `blur(${TEXT_BLUR * (1 - p)}px)`,
              textShadow: TEXT_GLOW,
            }}
          >
            {HANDLE}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
