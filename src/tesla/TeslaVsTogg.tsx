import React from 'react';
import {AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {
  Background,
  C,
  Chip,
  FONT,
  FONT_CSS,
  FrontPanel,
  IMG_AR,
  Label,
  Pulse,
  Scene,
  TABULAR,
  ramp,
} from '../gtr/GtrVsC8';

export const TT_W = 1080;
export const TT_H = 1920;
export const TT_FPS = 30;
export const TT_NARRATION = 66.19;
export const TT_DURATION = Math.round((TT_NARRATION + 2.4) * TT_FPS);

const RED = '#E30A17'; // Togg tarafı için vurgu (bayrak kırmızısı)

const SC = {
  s1: [0, 9.95],
  s2: [9.75, 22.2],
  s3: [21.95, 37.9],
  s4: [37.7, 46.8],
  s5: [46.55, 61.45],
  s6: [61.2, 68.6],
} as const;

type Cap = {s: number; e: number; text: string; hl?: string[]};
// Zamanlar: ElevenLabs Scribe kelime zaman damgalarından.
const CAPS: Cap[] = [
  {s: 0.08, e: 1.85, text: 'İki elektrikli SUV.', hl: ['SUV.']},
  {s: 2.26, e: 4.25, text: 'Biri dünyanın tanıdığı dev,', hl: ['dev,']},
  {s: 4.58, e: 7.75, text: 'diğeri bu toprakların yıllardır beklediği hayal.', hl: ['hayal.']},
  {s: 8.1, e: 9.7, text: 'Peki rakamlar ne diyor?', hl: ['diyor?']},
  {s: 9.86, e: 11.0, text: 'Tesla Model Y', hl: ['Tesla']},
  {s: 11.18, e: 14.7, text: 'elektrikli otomobil denince akla gelen ilk isimlerden biri.'},
  {s: 15.0, e: 18.45, text: "Togg T10X ise Türkiye'nin Otomobil Girişimi'nin ürünü.", hl: ['Togg']},
  {s: 18.78, e: 21.7, text: "Gemlik'te, zeytin ağaçlarının gölgesinde doğdu.", hl: ["Gemlik'te,"]},
  {s: 22.04, e: 24.25, text: 'İki çift motorlu versiyonu karşılaştıralım.'},
  {s: 24.5, e: 26.5, text: 'T10X 435 beygir', hl: ['435']},
  {s: 26.54, e: 28.75, text: 've 700 Newton metre tork üretiyor.', hl: ['700']},
  {s: 28.96, e: 31.8, text: 'Sıfırdan yüze 4,5 saniyede çıkıyor.', hl: ['4,5']},
  {s: 32.04, e: 35.05, text: 'Model Y Premium ise 4,6 saniyede.', hl: ['4,6']},
  {s: 35.28, e: 37.5, text: 'Aradaki fark bir göz kırpması kadar.', hl: ['göz']},
  {s: 37.78, e: 40.45, text: 'Menzilde ve şarj hızında ise Tesla önde.', hl: ['Tesla']},
  {s: 40.66, e: 43.85, text: '622 kilometreye karşılık 468,', hl: ['622', '468,']},
  {s: 44.02, e: 46.45, text: '250 kilovata karşılık 180.', hl: ['250', '180.']},
  {s: 46.64, e: 47.75, text: 'Bunu saklamak yok,'},
  {s: 47.94, e: 51.7, text: "ama T10X'in ön ızgarasında Anadolu'nun lalesi var.", hl: ['lalesi', "Anadolu'nun"]},
  {s: 51.92, e: 55.45, text: "Renkleri Kapadokya'dan, Kula'dan, Çukurova'dan geliyor.", hl: ["Kapadokya'dan,", "Kula'dan,", "Çukurova'dan"]},
  {s: 55.66, e: 58.5, text: 'Bir otomobil sadece hız ve menzil değildir.'},
  {s: 58.66, e: 61.05, text: 'Bir ülkenin yapabiliriz deme biçimidir.', hl: ['yapabiliriz']},
  {s: 61.26, e: 63.55, text: 'Rakamlar yakın, hikâyeler farklı.', hl: ['farklı.']},
];

const Captions: React.FC<{t: number}> = ({t}) => {
  const cap = CAPS.find((c) => t >= c.s && t < c.e);
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
        width: TT_W - 140,
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

// ---------------------------------------------------------------------------
// Görsel yerleşimleri (kalibre edildi)
// ---------------------------------------------------------------------------
type Fit = {src: string; W: number; cx: number; cy: number; flip?: boolean};
const place = (f: Fit, pw: number, ph: number, zoom = 1) => {
  const W = f.W * zoom;
  const H = W * IMG_AR;
  return {W, H, left: pw / 2 - f.cx * W, top: ph / 2 - f.cy * H};
};

const CARS = {
  tesla: {
    side: {src: 'tesla_togg/vehicles/tesla_side.png', W: 1850, cx: 0.5, cy: 0.51} as Fit,
    xray: {src: 'tesla_togg/vehicles/tesla_xray.png', W: 1000, cx: 0.505, cy: 0.51} as Fit,
    front: 'tesla_togg/vehicles/tesla_front34.png',
    xrayMotors: [
      [0.69, 0.54],
      [0.32, 0.54],
    ] as [number, number][],
  },
  togg: {
    side: {src: 'tesla_togg/vehicles/togg_side.png', W: 1700, cx: 0.495, cy: 0.52} as Fit,
    xray: {src: 'tesla_togg/vehicles/togg_xray.png', W: 1000, cx: 0.51, cy: 0.54} as Fit,
    front: 'tesla_togg/vehicles/togg_front34.png',
    xrayMotors: [
      [0.73, 0.55],
      [0.34, 0.59],
    ] as [number, number][],
  },
};

const SidePanel: React.FC<{
  car: 'tesla' | 'togg';
  y: number;
  emph: number;
  zoom?: number;
  title: string;
  sub?: string;
  accent: string;
  chip?: string;
  chipP?: number;
}> = ({car, y, emph, zoom = 1, title, sub, accent, chip, chipP = 0}) => {
  const PH = 600;
  const b = place(CARS[car].side, TT_W, PH, zoom);
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: TT_W, height: PH, overflow: 'hidden', opacity: 0.32 + 0.68 * emph}}>
      <Img src={staticFile(CARS[car].side.src)} style={{position: 'absolute', left: b.left, top: b.top, width: b.W, height: b.H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,13,0.5), transparent 28%, transparent 76%, rgba(8,10,13,0.75))'}} />
      <Label x={70} y={PH - 100} text={title} sub={sub} p={1} color={accent} />
      {chip && <Chip x={70} y={PH - 44} text={chip} p={chipP} hot />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 1 – Hook
// ---------------------------------------------------------------------------
const Scene1: React.FC<{t: number}> = ({t}) => {
  const z = 1 + t * 0.02;
  const q = ramp(t, 8.2, 9.1);
  const redLine = ramp(t, 4.6, 7.6, Easing.inOut(Easing.cubic));
  return (
    <>
      <FrontPanel src={CARS.tesla.front} y={360} h={600} zoom={z} title="Tesla Model Y" p={ramp(t, 0.4, 1.4)} />
      <FrontPanel src={CARS.togg.front} y={990} h={600} zoom={z} title="Togg T10X" p={ramp(t, 1.8, 2.8)} />
      <svg style={{position: 'absolute', left: 0, top: 0, width: TT_W, height: TT_H}}>
        <line x1={70} x2={70 + 940 * ramp(t, 0.2, 2.2)} y1={975} y2={975} stroke={C.amber} strokeWidth={2} />
        <line x1={70} x2={70 + 940 * redLine} y1={1586} y2={1586} stroke={RED} strokeWidth={4} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: TT_W,
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
// SAHNE 2 – Köken
// ---------------------------------------------------------------------------
const Scene2: React.FC<{t: number}> = ({t}) => {
  const teslaOn = ramp(t, 9.8, 10.3) * (1 - 0.7 * ramp(t, 14.8, 15.2));
  const toggOn = 0.3 + 0.7 * ramp(t, 14.8, 15.2);
  const z = 1 + (t - 9.8) * 0.004;
  return (
    <>
      <SidePanel car="tesla" y={330} emph={teslaOn} zoom={z} title="Tesla Model Y" sub="Elektrikli orta boy SUV" accent={C.white} chip="Elektrikli" chipP={ramp(t, 11.2, 11.8)} />
      <SidePanel car="togg" y={960} emph={toggOn} zoom={z} title="Togg T10X" sub="Türkiye'nin Otomobil Girişimi" accent={RED} chip="Gemlik" chipP={ramp(t, 18.8, 19.4)} />
      <svg style={{position: 'absolute', left: 0, top: 0, width: TT_W, height: TT_H}}>
        <line x1={70} x2={70 + 940 * ramp(t, 18.8, 21.4)} y1={1566} y2={1566} stroke={RED} strokeWidth={4} />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 3 – Performans (çift motor, 0–100)
// ---------------------------------------------------------------------------
const XrayStrip: React.FC<{car: 'tesla' | 'togg'; y: number; t: number; show: number; dim: number}> = ({car, y, t, show, dim}) => {
  const H = 290;
  const f = CARS[car].xray;
  const p = place(f, TT_W, H, 1);
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: TT_W, height: H, overflow: 'hidden', opacity: show * dim}}>
      <Img src={staticFile(f.src)} style={{position: 'absolute', left: p.left, top: p.top, width: p.W, height: p.H, transform: f.flip ? 'scaleX(-1)' : undefined}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,13,0.5), transparent 30%, transparent 70%, rgba(8,10,13,0.85))'}} />
      {CARS[car].xrayMotors.map(([fx, fy], i) => (
        <Pulse key={i} x={p.left + fx * p.W} y={p.top + fy * p.H} t={t + i * 0.3} p={ramp(t, 22.3, 23.1)} r={30} />
      ))}
    </div>
  );
};

const Scene3: React.FC<{t: number}> = ({t}) => {
  const toggK = ramp(t, 24.5, 26.4, Easing.out(Easing.quad));
  const toggT = ramp(t, 28.96, 31.5, Easing.out(Easing.quad));
  const teslaT = ramp(t, 32.04, 34.6, Easing.out(Easing.quad));
  const race = ramp(t, 35.3, 37.4, Easing.inOut(Easing.quad));
  const raceShow = ramp(t, 35.2, 35.6) * (1 - ramp(t, 37.5, 37.85));
  const togOn = 0.35 + 0.65 * ramp(t, 24.3, 24.8);
  const tesOn = 0.35 + 0.65 * ramp(t, 31.9, 32.3);
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  const Bar: React.FC<{y: number; k: number; color: string; time: string}> = ({y, k, color, time}) => (
    <div style={{position: 'absolute', left: 70, top: y, width: 940, opacity: raceShow}}>
      <div style={{height: 10, background: 'rgba(165,173,183,0.2)', borderRadius: 5}}>
        <div style={{width: `${k * 100}%`, height: '100%', background: color, borderRadius: 5, boxShadow: `0 0 16px ${color}`}} />
      </div>
      <div style={{marginTop: 10, textAlign: 'right', fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.white, opacity: k > 0.97 ? 1 : 0, ...TABULAR}}>{time}</div>
    </div>
  );
  return (
    <>
      {/* Tesla (üst) */}
      <div style={{position: 'absolute', left: 0, top: 330, width: TT_W, height: 590, opacity: tesOn}}>
        <XrayStrip car="tesla" y={0} t={t} show={1} dim={1 - 0.65 * raceShow} />
        <Label x={70} y={296} text="Tesla Model Y Premium" sub="Çift motorlu dört çeker" p={1} color={C.white} />
        <div style={{position: 'absolute', left: 70, top: 356, fontFamily: FONT, fontWeight: 700, fontSize: 140, lineHeight: 1, color: C.amber, ...TABULAR}}>
          {fmt(4.6 * teslaT)}
          <span style={{fontSize: 38, color: C.white, marginLeft: 12, letterSpacing: '0.08em'}}>SN</span>
        </div>
        <div style={{position: 'absolute', right: 70, top: 396, textAlign: 'right', fontFamily: FONT, fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: C.gray}}>0–100 KM/S</div>
        <Bar y={110} k={race} color={C.amber} time="4,6 sn" />
      </div>
      {/* Togg (alt) */}
      <div style={{position: 'absolute', left: 0, top: 960, width: TT_W, height: 590, opacity: togOn}}>
        <XrayStrip car="togg" y={0} t={t} show={1} dim={1 - 0.65 * raceShow} />
        <Label x={70} y={296} text="Togg T10X 4More" sub="Çift motorlu dört çeker" p={1} color={RED} />
        <div style={{position: 'absolute', left: 70, top: 356, fontFamily: FONT, fontWeight: 700, fontSize: 140, lineHeight: 1, color: C.amber, ...TABULAR}}>
          {t < 28.8 ? Math.round(435 * toggK) : fmt(4.5 * toggT)}
          <span style={{fontSize: 38, color: C.white, marginLeft: 12, letterSpacing: '0.08em'}}>{t < 28.8 ? 'PS' : 'SN'}</span>
        </div>
        <div style={{position: 'absolute', right: 70, top: 388, textAlign: 'right', fontFamily: FONT, opacity: t < 28.8 ? ramp(t, 26.5, 27.2) : ramp(t, 28.96, 29.4)}}>
          <div style={{fontWeight: 700, fontSize: 56, color: C.white, ...TABULAR}}>{t < 28.8 ? '700 Nm' : '0–100'}</div>
          <div style={{fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: C.gray}}>{t < 28.8 ? 'TORK' : 'KM/S'}</div>
        </div>
        <Bar y={110} k={race * 1.0} color={RED} time="4,5 sn" />
      </div>
      <Label x={70} y={1560} text="Üretici verileri · yarış çubukları hızlandırılmış animasyondur" p={0.7} />
    </>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 4 – Menzil ve şarj
// ---------------------------------------------------------------------------
const MetricRow: React.FC<{y: number; name: string; value: number; max: number; unit: string; color: string; from: number; to: number; t: number}> = ({y, name, value, max, unit, color, from, to, t}) => {
  const k = ramp(t, from, to, Easing.out(Easing.quad));
  const vis = ramp(t, from - 0.3, from + 0.2);
  return (
    <div style={{position: 'absolute', left: 70, top: y, width: 940, opacity: vis}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 26, letterSpacing: '0.14em', color: C.gray, textTransform: 'uppercase'}}>{name}</div>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 84, color: C.white, lineHeight: 1, ...TABULAR}}>
          {Math.round(value * k)}
          <span style={{fontSize: 30, color: C.gray, marginLeft: 10}}>{unit}</span>
        </div>
      </div>
      <div style={{marginTop: 12, height: 12, background: 'rgba(165,173,183,0.18)', borderRadius: 6}}>
        <div style={{width: `${(k * value * 100) / max}%`, height: '100%', background: color, borderRadius: 6, boxShadow: `0 0 16px ${color}`}} />
      </div>
    </div>
  );
};

const Scene4: React.FC<{t: number}> = ({t}) => (
  <>
    <Label x={70} y={390} text="Menzil · WLTP" p={ramp(t, 38, 38.6)} color={C.amber} />
    <MetricRow y={440} name="Tesla Model Y Premium" value={622} max={650} unit="km" color={C.white} from={40.8} to={42.0} t={t} />
    <MetricRow y={640} name="Togg T10X 4More" value={468} max={650} unit="km" color={RED} from={42.7} to={43.7} t={t} />
    <Label x={70} y={900} text="Maks. DC şarj gücü" p={ramp(t, 43.9, 44.4)} color={C.amber} />
    <MetricRow y={950} name="Tesla Model Y Premium" value={250} max={260} unit="kW" color={C.white} from={44.2} to={45.3} t={t} />
    <MetricRow y={1150} name="Togg T10X 4More" value={180} max={260} unit="kW" color={RED} from={45.7} to={46.4} t={t} />
    <Label x={70} y={1380} text="Menzil WLTP; şarj gücü üreticinin belirttiği azami değerdir" p={0.7} />
    <div style={{position: 'absolute', left: 70, top: 1440, fontFamily: FONT, fontWeight: 700, fontSize: 40, letterSpacing: '0.06em', color: C.amber, opacity: ramp(t, 46.6, 46.8) * 0}}>.</div>
  </>
);

// ---------------------------------------------------------------------------
// SAHNE 5 – Duygu: lale, Anadolu, yapabiliriz
// ---------------------------------------------------------------------------
const Scene5: React.FC<{t: number}> = ({t}) => {
  const z = 1.0 + (t - 46.5) * 0.012;
  const dim = 1 - 0.55 * ramp(t, 55.6, 56.4);
  const big = ramp(t, 58.7, 59.8);
  const chips = [
    {x: 70, text: 'Kapadokya', at: 52.56},
    {x: 330, text: 'Kula', at: 53.6},
    {x: 500, text: 'Çukurova', at: 54.28},
  ];
  return (
    <>
      <div style={{opacity: dim}}>
        <FrontPanel src={CARS.togg.front} y={330} h={860} zoom={z * 1.15} title="Togg T10X" p={ramp(t, 46.7, 47.4)} cx={0.5} />
      </div>
      <Chip x={70} y={1130} text="Anadolu'nun lalesi · ön ızgara" p={ramp(t, 50.2, 50.8)} hot />
      {chips.map((c) => (
        <Chip key={c.text} x={c.x} y={1230} text={c.text} p={ramp(t, c.at, c.at + 0.4)} />
      ))}
      <svg style={{position: 'absolute', left: 0, top: 0, width: TT_W, height: TT_H}}>
        <line x1={70} x2={70 + 940 * ramp(t, 51.9, 55.4)} y1={1210} y2={1210} stroke={RED} strokeWidth={4} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 70,
          width: 940,
          top: 1310,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 124,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: C.white,
          opacity: big,
          transform: `scale(${0.94 + big * 0.06})`,
          textShadow: '0 4px 40px rgba(0,0,0,0.9)',
        }}
      >
        YAPA<span style={{color: RED}}>BİLİRİZ</span>
      </div>
      <div style={{position: 'absolute', left: 0, width: TT_W, top: 1450, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 26, letterSpacing: '0.18em', color: C.gray, textTransform: 'uppercase', opacity: ramp(t, 59.6, 60.4)}}>
        bir ülkenin deme biçimi
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// SAHNE 6 – Final
// ---------------------------------------------------------------------------
const ROWS: [string, string, string][] = [
  ['0–100 km/s', '4,6 sn', '4,5 sn'],
  ['Menzil (WLTP)', '622 km', '468 km'],
  ['Maks. DC şarj', '250 kW', '180 kW'],
];

const Scene6: React.FC<{t: number}> = ({t}) => {
  const q = ramp(t, 63.8, 64.6);
  const c = ramp(t, 65.3, 66.0);
  const table = 1 - ramp(t, 63.6, 64.1);
  return (
    <>
      <FrontPanel src={CARS.tesla.front} y={330} h={330} zoom={1 + (t - 61.2) * 0.006} title="Tesla Model Y" p={ramp(t, 61.3, 62.0) * (1 - 0.5 * q)} />
      <FrontPanel src={CARS.togg.front} y={680} h={330} zoom={1 + (t - 61.2) * 0.006} title="Togg T10X" p={ramp(t, 61.5, 62.2) * (1 - 0.5 * q)} />
      <div style={{position: 'absolute', left: 70, top: 1050, width: 940, fontFamily: FONT, opacity: table}}>
        <div style={{display: 'flex', padding: '0 0 10px', opacity: ramp(t, 61.6, 62.2)}}>
          <div style={{width: 260}} />
          <div style={{flex: 1, fontWeight: 700, fontSize: 20, letterSpacing: '0.12em', color: C.gray, textTransform: 'uppercase'}}>Tesla Model Y Premium</div>
          <div style={{flex: 1, fontWeight: 700, fontSize: 20, letterSpacing: '0.12em', color: RED, textTransform: 'uppercase', textAlign: 'right'}}>Togg T10X 4More</div>
        </div>
        {ROWS.map((r, i) => {
          const p = ramp(t, 61.8 + i * 0.2, 62.4 + i * 0.2);
          return (
            <div key={r[0]} style={{display: 'flex', alignItems: 'baseline', padding: '16px 0', borderBottom: '1px solid rgba(165,173,183,0.22)', opacity: p, transform: `translateY(${(1 - p) * 10}px)`}}>
              <div style={{width: 260, fontWeight: 500, fontSize: 22, letterSpacing: '0.12em', color: C.gray, textTransform: 'uppercase'}}>{r[0]}</div>
              <div style={{flex: 1, fontWeight: 700, fontSize: 40, color: C.white, ...TABULAR}}>{r[1]}</div>
              <div style={{flex: 1, fontWeight: 700, fontSize: 40, color: C.white, textAlign: 'right', ...TABULAR}}>{r[2]}</div>
            </div>
          );
        })}
        <div style={{marginTop: 16, fontWeight: 500, fontSize: 19, color: C.gray, opacity: 0.8}}>
          Üretici verileri: Tesla Türkiye (Model Y Premium, çift motor) · Togg (T10X 4More)
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
        SEN <span style={{color: C.amber}}>HANGİSİNİ</span>
        <br />
        SEÇERDİN?
      </div>
      <div style={{position: 'absolute', left: 0, width: TT_W, top: 1420, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 38, letterSpacing: '0.16em', color: C.amber, opacity: c, textTransform: 'uppercase'}}>
        Yorumlara yaz
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
export const TeslaVsTogg: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / TT_FPS;
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
  const showCaptions = t < 63.6;
  return (
    <AbsoluteFill style={{background: C.black, fontFamily: FONT}}>
      <style>{FONT_CSS}</style>
      <Background t={t} />
      <Scene t={t} range={SC.s1}><Scene1 t={t} /></Scene>
      <Scene t={t} range={SC.s2}><Scene2 t={t} /></Scene>
      <Scene t={t} range={SC.s3}><Scene3 t={t} /></Scene>
      <Scene t={t} range={SC.s4}><Scene4 t={t} /></Scene>
      <Scene t={t} range={SC.s5}><Scene5 t={t} /></Scene>
      <Scene t={t} range={SC.s6}><Scene6 t={t} /></Scene>
      {showCaptions && <Captions t={t} />}
    </AbsoluteFill>
  );
};
