import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Coins, Flame, Gem, Leaf, Moon, Orbit, Snowflake, Sparkles, Trees, X, Zap, Clover } from 'lucide-react';
import type { Material } from '../game/data';

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const icons: Record<string, typeof Orbit> = { orbit: Orbit, tree: Trees, snow: Snowflake, flame: Flame, moon: Moon, clover: Clover, zap: Zap, coins: Coins };
  const Component = icons[name] ?? Sparkles; return <Component size={size} strokeWidth={1.65} />;
}
export const format = (n: number) => n.toLocaleString('vi-VN');
export const short = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 10000 ? `${(n / 1000).toFixed(1)}k` : format(n);
export function timer(seconds: number) { const s = Math.max(0, Math.ceil(seconds)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
export function MaterialIcon({ material, size = 15 }: { material: Material; size?: number }) {
  return material === 'dust' ? <Sparkles size={size} /> : material === 'ore' ? <Leaf size={size} /> : material === 'crystal' ? <Gem size={size} /> : <Flame size={size} />;
}
export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{children}</div>;
}
export function Progress({ value, color }: { value: number; color?: string }) {
  return <div className="progress"><span style={{ width: `${Math.max(0, Math.min(value, 100))}%`, background: color }} /></div>;
}
export function Modal({ title, subtitle, children, onClose, wide = false, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId(), [closing, setClosing] = useState(false), timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const requestClose = useCallback(() => {
    if (timerRef.current) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || panel.current?.closest('.reduce-motion')) { closeRef.current(); return; }
    setClosing(true); timerRef.current = setTimeout(() => closeRef.current(), 180);
  }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      if (e.key === 'Tab') {
        const all = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href], [tabindex="0"]') ?? []);
        const first = all[0], last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); document.body.style.overflow = original; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [requestClose]);
  return <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onMouseDown={e => { if (e.target === e.currentTarget) requestClose(); }}>
    <div ref={panel} className={`modal ${wide ? 'wide' : ''} ${className} ${closing ? 'closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Đóng" onClick={requestClose}><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}
export function LinkButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="text-button" onClick={onClick}>{children}<ArrowUpRight size={15} /></button>; }
export function Empty({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><Orbit size={35} /><h3>{title}</h3><p>{description}</p>{action && <button className="button primary" onClick={onAction}>{action}<ChevronRight size={16} /></button>}</div>;
}
export function Checked({ children }: { children: React.ReactNode }) { return <span className="checked"><Check size={14} />{children}</span>; }
