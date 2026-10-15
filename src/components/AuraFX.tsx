import { useEffect, useRef } from 'react';
import type { EffectProfile } from '../game/data';
import { useReducedMotion } from './Motion';

// Each aura carries its own deterministic visual DNA. Only the active preview
// renders particles; catalogue cards remain inexpensive SVG/CSS thumbnails.
export function AuraFX({ profile, color, reducedMotion = false }: { profile: EffectProfile; color: string; reducedMotion?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null), reduced = useReducedMotion(reducedMotion);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d'); if (!ctx) return;
    const size = 320, dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = size * dpr; canvas.height = size * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let frame = 0, visible = true; const start = performance.now();
    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size); ctx.save(); ctx.translate(160, 160);
      const t = reduced ? 0 : (time - start) / 1000, phase = t * profile.speed * profile.twist + profile.seed * .017;
      const radius = 103 * profile.spread, motif = profile.motif;
      ctx.strokeStyle = color; ctx.lineWidth = .7; ctx.globalAlpha = .38;
      const polygon = (r: number, sides: number, rotation: number) => {
        ctx.beginPath(); for (let j = 0; j <= sides; j++) { const a = j / sides * Math.PI * 2 + rotation; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (!j) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      };
      for (let ring = 0; ring < profile.rings; ring++) {
        ctx.save(); ctx.rotate(phase * (.12 + ring * .05) + ring * .7); const r = radius - ring * 10;
        if (motif === 'prism' || motif === 'rune') polygon(r, profile.petals, phase * .1);
        else if (motif === 'bloom') {
          ctx.beginPath(); for (let j = 0; j <= 120; j++) { const a = j / 120 * Math.PI * 2, rr = r * (.82 + .18 * Math.cos(profile.petals * a + phase)); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (!j) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        } else if (motif === 'tide') {
          ctx.beginPath(); for (let j = -110; j <= 110; j += 4) { const y = Math.sin(j / 35 + phase + ring) * 14 + (ring - 1) * 23; if (j === -110) ctx.moveTo(j, y); else ctx.lineTo(j, y); } ctx.stroke();
        } else if (motif === 'vortex') {
          ctx.beginPath(); for (let j = 0; j <= 80; j++) { const a = j / 80 * Math.PI * 4 + phase, rr = 35 + j / 80 * (r - 35); if (!j) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke();
        } else { ctx.beginPath(); ctx.ellipse(0, 0, r, motif === 'orbit' ? r * .45 : r, 0, motif === 'eclipse' ? phase % 6.28 : 0, (motif === 'eclipse' ? phase % 6.28 : 0) + Math.PI * (motif === 'eclipse' ? 1.6 : 2)); ctx.stroke(); }
        ctx.restore();
      }
      if (motif === 'storm' || motif === 'nova' || motif === 'rune' || motif === 'snow' || motif === 'flame') {
        ctx.strokeStyle = profile.secondary; ctx.globalAlpha = .42;
        for (let j = 0; j < profile.petals; j++) {
          ctx.save(); ctx.rotate(j / profile.petals * Math.PI * 2 + phase * .2);
          ctx.beginPath(); ctx.moveTo(0, 68);
          if (motif === 'storm') { ctx.lineTo(9 * Math.sin(phase + j), 87); ctx.lineTo(-5, 99); ctx.lineTo(3, radius + 12); }
          else if (motif === 'flame') { ctx.bezierCurveTo(-15, 90, 18 * Math.sin(phase + j), 108, 0, radius + 12 + Math.sin(phase + j) * 8); }
          else { ctx.lineTo(0, radius + 7); if (motif === 'snow') { ctx.moveTo(-6, 100); ctx.lineTo(0, 107); ctx.lineTo(6, 100); } }
          ctx.stroke(); ctx.restore();
        }
      }
      if (!reduced) {
        const count = Math.min(profile.particles, innerWidth < 600 ? 32 : 60);
        for (let j = 0; j < count; j++) {
          const a = j * 2.399963 + phase * (1 + j % 3 * .15), rr = radius * (.67 + j % 11 * .035);
          let x = Math.cos(a) * rr, y = Math.sin(a) * rr;
          if (motif === 'flame') { y = 108 - (j * 31 + t * 30) % 220; x = Math.sin(j + t * .8) * (30 + j % 60); }
          if (motif === 'comet') { x = 130 - (j * 47 + t * 40) % 260; y = -85 + (j * 29 + t * 20) % 170; }
          ctx.globalAlpha = .18 + .52 * (1 + Math.sin(t + j)) / 2; ctx.fillStyle = j % 3 ? color : profile.secondary;
          if (motif === 'comet') { ctx.strokeStyle = color; ctx.globalAlpha *= .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 5); ctx.stroke(); }
          ctx.beginPath(); ctx.arc(x, y, .7 + j % 4 * .35, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      if (!reduced && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const resume = () => { cancelAnimationFrame(frame); if (visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }); observer.observe(canvas);
    document.addEventListener('visibilitychange', resume); resume();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', resume); ctx.clearRect(0, 0, size, size); };
  }, [profile, color, reduced]);
  return <canvas ref={ref} className="aura-fx" data-motif={profile.motif} data-effect-seed={profile.seed} aria-hidden="true" />;
}
