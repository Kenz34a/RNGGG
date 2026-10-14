import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Compass, LockKeyhole, Sparkles } from 'lucide-react';
import { levelOf, type GameState } from '../game/engine';
import { format } from './Ui';

export function useReducedMotion(preference = false) {
  const [system, setSystem] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystem(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return preference || system;
}

// Pointer updates stay outside React renders. Touch devices get a simple tap ripple.
export function useInteractionEffects(reduced: boolean) {
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const ripples = new Map<HTMLElement, Animation>();
    const cards = '.aura-card,.world-card,.recipe-card,.upgrade-card,.discover-card,.stat-card,.achievement';
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>(cards) : null;
      if (!target) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--pointer-x', `${e.clientX - rect.left}px`);
        target.style.setProperty('--pointer-y', `${e.clientY - rect.top}px`);
      });
    };
    const tap = (e: PointerEvent) => {
      const button = e.target instanceof Element ? e.target.closest<HTMLButtonElement>('button.button,.roll-button,.auto-button,.batch-button,.claim-button,.mobile-tabbar button') : null;
      if (!button || button.disabled) return;
      const rect = button.getBoundingClientRect(), diameter = Math.hypot(rect.width, rect.height) * 2;
      const ripple = document.createElement('i');
      ripple.className = 'tap-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.cssText = `width:${diameter}px;height:${diameter}px;left:${e.clientX - rect.left - diameter / 2}px;top:${e.clientY - rect.top - diameter / 2}px`;
      button.appendChild(ripple);
      const animation = ripple.animate([{ transform: 'scale(0)', opacity: .3 }, { transform: 'scale(1)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.2,.7,.3,1)' });
      ripples.set(ripple, animation);
      const cleanup = () => { ripple.remove(); ripples.delete(ripple); };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', tap, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', tap);
      for (const [ripple, animation] of ripples) { animation.cancel(); ripple.remove(); }
      ripples.clear();
    };
  }, [reduced]);
}

export function AnimatedNumber({ value, reduced = false }: { value: number; reduced?: boolean }) {
  const [display, setDisplay] = useState(value), displayed = useRef(value);
  useEffect(() => {
    if (reduced) { displayed.current = value; setDisplay(value); return; }
    const start = displayed.current;
    if (start === value) return;
    const startedAt = performance.now(); let frame = 0;
    const draw = (time: number) => {
      const fraction = Math.min(1, (time - startedAt) / 650);
      const next = Math.round(start + (value - start) * (1 - (1 - fraction) ** 3));
      displayed.current = next; setDisplay(next);
      if (fraction < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <span className="animated-number">{format(reduced ? value : display)}</span>;
}

export function RollSequence({ duration, reduced }: { duration: number; reduced: boolean }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (reduced) { setProgress(100); return; }
    const started = performance.now(); let frame = 0;
    const draw = (time: number) => { const p = Math.min(100, (time - started) / duration * 100); setProgress(p); if (p < 100) frame = requestAnimationFrame(draw); };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [duration, reduced]);
  const phase = progress < 34 ? 0 : progress < 77 ? 1 : 2;
  return <div className="roll-sequence" data-phase={phase} aria-hidden="true">
    <div className="summon-energy"><i /><i /><i /><span /><span /></div>
    <div className="roll-phases">{['Khơi nguồn', 'Cộng hưởng', 'Hiển lộ'].map((name, i) => <span className={i === phase ? 'active' : i < phase ? 'complete' : ''} key={name}>{i < phase ? <Check size={9} /> : <i />}{name}{i < 2 && <ChevronRight size={9} />}</span>)}</div>
    <div className="roll-track"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
  </div>;
}

export function StageReveal({ color, rarity, reduced }: { color: string; rarity: number; reduced: boolean }) {
  if (reduced) return null;
  return <div className={`stage-reveal tier-${rarity}`} style={{ '--reveal-color': color } as React.CSSProperties} aria-hidden="true">
    <div className="reveal-wave" /><div className="reveal-wave second" /><div className="reveal-glow" />
    {Array.from({ length: rarity >= 4 ? 24 : 12 }, (_, i) => <i key={i} style={{ '--ray-angle': `${i * 137.5}deg`, '--ray-distance': `${80 + i % 5 * 24}px`, '--ray-delay': `${i % 4 * 35}ms` } as React.CSSProperties} />)}
  </div>;
}

export interface BurstEvent { id: number; color: string; x: number; y: number; kind: 'reward' | 'rare' | 'level' }
export function ParticleBurst({ event, reduced }: { event: BurstEvent | null; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (!event || reduced) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    const dpr = Math.min(devicePixelRatio, 2), width = innerWidth, height = innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = width < 600 ? 34 : 64, started = performance.now(); let frame = 0;
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = i * 2.399963, speed = 65 + i % 9 * 22;
      return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 75, size: 1.3 + i % 4 * .7, delay: i % 5 * .018, star: i % 4 === 0 };
    });
    const draw = (time: number) => {
      const elapsed = (time - started) / 1000; ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        const t = Math.max(0, elapsed - p.delay), alpha = Math.max(0, 1 - t / 1.65);
        ctx.globalAlpha = alpha; ctx.fillStyle = event.color;
        const x = event.x + p.vx * t, y = event.y + p.vy * t + 65 * t * t;
        ctx.beginPath();
        if (p.star) {
          const r = p.size * 2; ctx.moveTo(x, y - r); ctx.lineTo(x + r * .3, y - r * .3); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .3, y + r * .3); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .3, y + r * .3); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .3, y - r * .3); ctx.closePath();
        } else ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (elapsed < 1.9) frame = requestAnimationFrame(draw); else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, width, height); };
  }, [event, reduced]);
  return <canvas ref={ref} className="particle-burst" aria-hidden="true" />;
}

export function NextMilestone({ state, navigate }: { state: GameState; navigate: (page: 'observatory' | 'worlds' | 'forge') => void }) {
  const level = levelOf(state.xp);
  const milestone = state.totalRolls < 50 ? { title: 'Quay nhanh hơn, khám phá nhiều hơn', desc: 'Mở khóa quay ×10 sau 50 lượt.', value: state.totalRolls, target: 50, page: 'observatory' as const, icon: Sparkles }
    : !state.unlockedZones.includes('forest') ? { title: 'Một thế giới mới đang gọi', desc: 'Đạt cấp 3 và tích lũy 500 vàng để đến Rừng linh hồn.', value: Math.min(level, 3), target: 3, page: 'worlds' as const, icon: Compass }
    : state.crafted.length < 3 ? { title: 'Viết lại vận mệnh của bạn', desc: 'Chế tạo 3 cổ vật để nhận thành tựu Nghệ nhân ánh sao.', value: state.crafted.length, target: 3, page: 'forge' as const, icon: Sparkles }
    : { title: 'Tiến tới một khởi đầu mới', desc: '500 lượt quay là một trong những cột mốc để tái sinh.', value: Math.min(state.totalRolls, 500), target: 500, page: 'forge' as const, icon: Compass };
  return <button className="next-milestone" onClick={() => navigate(milestone.page)}>
    <span className="milestone-icon"><milestone.icon size={19} /></span><span className="milestone-copy"><small>MỤC TIÊU TIẾP THEO</small><strong>{milestone.title}</strong><span>{milestone.desc}</span></span>
    <span className="milestone-ring" style={{ '--milestone-progress': `${milestone.value / milestone.target * 100}%` } as React.CSSProperties}>{milestone.value >= milestone.target ? <Check size={14} /> : <LockKeyhole size={12} />}</span><span className="milestone-count">{milestone.value}/{milestone.target}</span><ChevronRight size={16} />
  </button>;
}
