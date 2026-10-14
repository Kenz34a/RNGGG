import { useEffect, useId, useRef } from 'react';
import type { ZoneId } from '../game/data';
import { useReducedMotion } from './Motion';

export function Starfield({ reducedMotion, meteorShower = false }: { reducedMotion: boolean; meteorShower?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion(reducedMotion);
  useEffect(() => {
    const canvas = ref.current!; const ctx = canvas.getContext('2d'); if (!ctx) return;
    let frame = 0, width = 0, height = 0, offsetX = 0, offsetY = 0, targetX = 0, targetY = 0;
    const started = performance.now();
    const stars = Array.from({ length: innerWidth < 600 ? 80 : 140 }, (_, i) => ({ x: ((i * 137.508) % 997) / 997, y: ((i * 73.71) % 991) / 991, r: .4 + i % 5 * .3, phase: i * .5, depth: .25 + i % 3 * .3 }));
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      offsetX += (targetX - offsetX) * .025; offsetY += (targetY - offsetY) * .025;
      stars.forEach(s => {
        const x = s.x * width + (reduced ? 0 : offsetX * s.depth), y = s.y * height + (reduced ? 0 : offsetY * s.depth);
        ctx.fillStyle = `rgba(181,224,222,${.13 + .37 * (1 + Math.sin((reduced ? 0 : time / 2600) + s.phase)) / 2})`;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.r > 1.3) { ctx.fillStyle = 'rgba(163,222,199,.045)'; ctx.beginPath(); ctx.arc(x, y, s.r * 2.4, 0, Math.PI * 2); ctx.fill(); }
      });
      if (!reduced) {
        const elapsed = (time - started) / 1000;
        for (let i = 0; i < (meteorShower ? 5 : 2); i++) {
          const t = (elapsed + i * 3.3) % (meteorShower ? 7 : 12);
          if (t > 1.6) continue;
          const x = width * (.5 + i * .12) - t * 300, y = height * (.06 + i * .09) + t * 155;
          const alpha = Math.sin(t / 1.6 * Math.PI) * .5;
          const gradient = ctx.createLinearGradient(x, y, x + 110, y - 57);
          gradient.addColorStop(0, `rgba(190,244,220,${alpha})`); gradient.addColorStop(1, 'rgba(190,244,220,0)');
          ctx.strokeStyle = gradient; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 110, y - 57); ctx.stroke();
          ctx.fillStyle = `rgba(218,255,238,${alpha})`; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
        }
        frame = requestAnimationFrame(draw);
      }
    };
    const resize = () => { const dpr = Math.min(devicePixelRatio, 2); width = innerWidth; height = innerHeight; canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (reduced) draw(0); };
    const pointer = (e: PointerEvent) => { if (e.pointerType === 'mouse') { targetX = (e.clientX / width - .5) * 20; targetY = (e.clientY / height - .5) * 20; } };
    resize(); window.addEventListener('resize', resize); if (!reduced) window.addEventListener('pointermove', pointer, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', pointer); };
  }, [reduced, meteorShower]);
  return <><div className="ambient-nebula" aria-hidden="true"><i /><i /><i /></div><canvas ref={ref} className="starfield" aria-hidden="true" /></>;
}

const palettes: Record<ZoneId, [string, string, string]> = {
  astral: ['#79cba7', '#234e47', '#0b2124'], forest: ['#9bdf8a', '#365c3b', '#122820'],
  frost: ['#87bdf8', '#294568', '#101b30'], ember: ['#f4b682', '#713d36', '#251a24'], void: ['#b39ce8', '#443d66', '#18152b'],
};
export function Landscape({ zone = 'astral', compact = false }: { zone?: ZoneId; compact?: boolean }) {
  const id = useId().replace(/:/g, ''); const [light, mid, dark] = palettes[zone];
  return <svg className={`landscape ${compact ? 'compact' : ''}`} viewBox="0 0 1000 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#0b1621" /><stop offset="1" stopColor={dark} /></linearGradient>
      <radialGradient id={`${id}-mist`}><stop stopColor={light} stopOpacity=".25" /><stop offset="1" stopColor={light} stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-mount`} x2="0" y2="1"><stop stopColor={mid} /><stop offset="1" stopColor="#0a151c" /></linearGradient>
      <linearGradient id={`${id}-beam`} x2="0" y2="1"><stop stopColor={light} stopOpacity="0" /><stop offset=".6" stopColor={light} stopOpacity=".11" /><stop offset="1" stopColor={light} stopOpacity="0" /></linearGradient>
    </defs>
    <path fill={`url(#${id}-sky)`} d="M0 0h1000v480H0z" />
    <ellipse cx="620" cy="240" rx="420" ry="240" fill={`url(#${id}-mist)`} />
    <path d="M690 -100 260 470h80L765 -80Z" fill={`url(#${id}-beam)`} />
    <path d="M840 -100 410 470h120L960 -80Z" fill={`url(#${id}-beam)`} />
    {Array.from({ length: 58 }, (_, i) => <circle key={i} cx={(i * 149.1) % 1000} cy={(i * 51.8) % 350} r={i % 7 === 0 ? 1.5 : .7} fill={i % 3 === 0 ? light : '#d0e2e9'} opacity={.2 + i % 4 * .17} />)}
    <path d="m0 335 65-35 44 26 86-82 73 63 48-19 71 39 93-60 51 45 58-28 72 35 121-88 90 67 56-30 77 57v195H0Z" fill={mid} opacity=".25" />
    <path d="m0 385 90-39 57 22 115-42 62 36 78-27 52 36 133-43 87 30 96-53 137 68 93-36v143H0Z" fill={`url(#${id}-mount)`} />
    <path d="m0 430 90-35 134 33 93-30 116 36 165-15 97-28 98 12 100-18 107 41v54H0Z" fill="#0b171e" />
    <path d="M430 480q160-100 299-86-172-8-230 86" fill={light} opacity=".1" />
    {Array.from({ length: compact ? 12 : 26 }, (_, i) => {
      const x = i < 13 ? i * 29 : 670 + (i - 13) * 29; const y = 423 + Math.sin(i) * 14; const h = 20 + (i * 37) % 67;
      return <g key={i} fill="#08141b" opacity={.65 + i % 3 * .1}><path d={`M${x} ${y - h}l${h * .22} ${h * .5}h-${h * .12}l${h * .27} ${h * .35}h-${h * .27}v${h * .2}h-3v-${h * .2}h-${h * .27}l${h * .27}-${h * .35}h-${h * .12}Z`} /></g>;
    })}
    {Array.from({ length: 15 }, (_, i) => <circle key={i} cx={45 + i * 66} cy={362 + Math.sin(i * 3) * 53} r="1.6" fill={light} opacity=".6" />)}
  </svg>;
}

export function Orb({ color = '#98e8c4', glyph = '✦', rolling = false, size = 'large', rarity = 0 }: { color?: string; glyph?: string; rolling?: boolean; size?: 'small' | 'large'; rarity?: number }) {
  const id = useId().replace(/:/g, '');
  return <div className={`orb-wrap ${size} ${rolling ? 'rolling' : ''} rarity-${rarity}`} style={{ '--aura-color': color } as React.CSSProperties} aria-hidden="true">
    <div className="orb-halo" /><div className="orb-corona" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
    {size === 'large' && <svg className="orb-astrolabe" viewBox="0 0 320 320"><circle cx="160" cy="160" r="139" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="1 12" /><circle cx="160" cy="160" r="124" fill="none" stroke="currentColor" strokeWidth=".5" strokeDasharray="26 168" />{Array.from({ length: 8 }, (_, i) => <g key={i} transform={`rotate(${i * 45} 160 160)`}><path d="M160 11v12m-4-6h8" fill="none" stroke="currentColor" strokeWidth=".6" /><circle cx="160" cy="36" r={i % 2 ? 1 : 2} fill="currentColor" /></g>)}</svg>}
    <svg className="orb-sphere" viewBox="0 0 240 240">
      <defs>
        <radialGradient id={`${id}-sphere`} cx="33%" cy="27%" r="78%"><stop stopColor="#edfff6" /><stop offset=".18" stopColor={color} /><stop offset=".46" stopColor={color} stopOpacity=".65" /><stop offset=".85" stopColor="#0d2928" /><stop offset="1" stopColor="#071018" /></radialGradient>
        <radialGradient id={`${id}-shade`} cx="29%" cy="24%" r="80%"><stop stopColor="#030b13" stopOpacity="0" /><stop offset=".4" stopColor="#030b13" stopOpacity="0" /><stop offset="1" stopColor="#02080f" stopOpacity=".96" /></radialGradient>
        <filter id={`${id}-texture`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="5" seed="12" /><feColorMatrix type="saturate" values="0" /><feBlend in="SourceGraphic" mode="soft-light" /></filter>
        <clipPath id={`${id}-clip`}><circle cx="120" cy="120" r="89" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="120" cy="120" r="89" fill={`url(#${id}-sphere)`} filter={`url(#${id}-texture)`} />
        <path d="M22 93q67-45 181 16M28 117q95-46 178 20M35 143q77-30 164 19" fill="none" stroke={color} strokeWidth="2" opacity=".25" />
        <circle cx="120" cy="120" r="89" fill={`url(#${id}-shade)`} />
      </g>
      <circle cx="120" cy="120" r="89" fill="none" stroke={color} opacity=".24" />
    </svg>
    <div className="orb-glyph">{glyph}</div>
    {size === 'large' && Array.from({ length: 10 }, (_, i) => <i key={i} className="orb-particle" style={{ '--particle-i': i } as React.CSSProperties} />)}
  </div>;
}
