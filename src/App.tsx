import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, ArrowUpToLine, Bell, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Clover, Coins, Compass, Crown, ExternalLink, FlaskConical, Gift, Hammer, Heart, Infinity, LockKeyhole, Menu, MoonStar, Orbit, Package, Pause, RefreshCw, Settings2, Shield, Sparkles, Star, Swords, Trophy, Volume2, VolumeX, WandSparkles, X, Zap } from 'lucide-react';
import { AURAS, RARITIES, ZONES, type Aura } from './game/data';
import { act, auraProbabilities, createState, dayKey, eventActive, eventRemaining, levelOf, levelProgress, luckOf, normalizeDaily, parseSave, powerOf, roll, rollDuration, SAVE_KEY, type Action, type GameState, type RollResult } from './game/engine';
import { Landscape, Orb, Starfield } from './components/Art';
import { Collection, Forge, Journey, QuestList, Worlds } from './components/Screens';
import { format, Icon, LinkButton, Modal, Progress, SectionHeading, timer } from './components/Ui';
import { AnimatedNumber, NextMilestone, ParticleBurst, RollSequence, StageReveal, useInteractionEffects, useReducedMotion, type BurstEvent } from './components/Motion';

type Page = 'observatory' | 'collection' | 'worlds' | 'forge' | 'journey';
type Dialog = 'help' | 'settings' | 'results' | 'boss' | 'rebirth' | 'import' | null;
type Toast = { id: number; text: string; ok: boolean };
const NAV = [
  { id: 'observatory', name: 'Trạm quan sát', icon: Orbit }, { id: 'collection', name: 'Bộ sưu tập', icon: Package },
  { id: 'worlds', name: 'Khám phá', icon: Compass }, { id: 'forge', name: 'Xưởng tinh tú', icon: Hammer }, { id: 'journey', name: 'Hành trình', icon: BookOpen },
] as const;

function initialSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const parsed = parseSave(raw); if (parsed) return { state: parsed, warning: '' }; return { state: createState(), warning: 'Bản lưu cũ không hợp lệ. Game đang dùng tiến trình mới; bản lưu cũ được giữ trong mục sao lưu.' }; } }
  catch { return { state: createState(), warning: 'Trình duyệt đang chặn lưu trữ. Hãy xuất bản lưu trước khi rời game.' }; }
  return { state: createState(), warning: '' };
}
function ToastMessage({ toast, close }: { toast: Toast; close: (id: number) => void }) {
  const closeRef = useRef(close); closeRef.current = close;
  useEffect(() => { const timeout = setTimeout(() => closeRef.current(toast.id), 4800); return () => clearTimeout(timeout); }, [toast.id]);
  return <div className={`toast ${toast.ok ? '' : 'error'}`} role="status">{toast.ok ? <Check size={17} /> : <CircleHelp size={17} />}<span>{toast.text}</span><button aria-label="Ẩn thông báo" onClick={() => close(toast.id)}><X size={14} /></button></div>;
}

export default function App() {
  const [initial] = useState(initialSave), [s, setState] = useState<GameState>(initial.state), [page, setPage] = useState<Page>('observatory');
  const [now, setNow] = useState(Date.now()), [dialog, setDialog] = useState<Dialog>(null), [selectedAura, setSelectedAura] = useState<Aura | null>(null);
  const [rolling, setRolling] = useState(false), [auto, setAuto] = useState(false), [batch, setBatch] = useState(1), [results, setResults] = useState<RollResult[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]), [mobileNav, setMobileNav] = useState(false), [saveFailed, setSaveFailed] = useState(false);
  const [imported, setImported] = useState<GameState | null>(null), [resetText, setResetText] = useState('');
  const [rollMs, setRollMs] = useState(1800), [burst, setBurst] = useState<BurstEvent | null>(null), [battleBusy, setBattleBusy] = useState(false);
  const [combatFx, setCombatFx] = useState<{ id: number; style: 'attack' | 'guard' | 'burst'; damage: number; incoming: number } | null>(null);
  const motionReduced = useReducedMotion(s.settings.reducedMotion);
  useInteractionEffects(motionReduced);
  const stateRef = useRef(s), rollingRef = useRef(false), autoRef = useRef(false), dialogRef = useRef<Dialog>(null), selectedAuraRef = useRef<Aura | null>(null);
  const rollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null), audioRef = useRef<AudioContext | null>(null), inputRef = useRef<HTMLInputElement>(null), toastId = useRef(0);
  const fxId = useRef(0), motionRef = useRef(motionReduced), battleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  motionRef.current = motionReduced;
  autoRef.current = auto; dialogRef.current = dialog; selectedAuraRef.current = selectedAura;
  const commit = useCallback((next: GameState) => { stateRef.current = next; setState(next); }, []);
  const notify = useCallback((text: string, ok = true) => {
    const id = ++toastId.current;
    setToasts(previous => [...(innerWidth < 760 ? [] : previous.slice(-2)), { id, text, ok }]);
  }, []);
  const closeToast = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), []);
  const celebrate = useCallback((color: string, kind: BurstEvent['kind'] = 'reward') => {
    if (motionRef.current) return;
    const target = kind === 'rare' ? document.querySelector('.roll-stage') : document.activeElement;
    const rect = target instanceof HTMLElement ? target.getBoundingClientRect() : null;
    const onScreen = rect && rect.width > 0 && rect.top >= 0 && rect.top < innerHeight;
    setBurst({ id: ++fxId.current, color, kind, x: onScreen ? rect.left + rect.width / 2 : innerWidth / 2, y: onScreen ? rect.top + rect.height * .4 : innerHeight * .4 });
  }, []);
  const tone = useCallback((rare = false) => {
    if (!stateRef.current.settings.sound) return;
    try {
      const ctx = audioRef.current ?? (audioRef.current = new AudioContext()); void ctx.resume();
      const notes = rare ? [440, 554.37, 659.25, 880] : [392, 523.25];
      notes.forEach((frequency, i) => {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + i * .09;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.07, start + .015); gain.gain.exponentialRampToValueAtTime(.001, start + .5);
        oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(start); oscillator.stop(start + .55);
      });
    } catch { /* Audio is optional if this browser does not support it. */ }
  }, []);
  const dispatch = useCallback((action: Action) => {
    const previous = stateRef.current, result = act(previous, action); if (result.ok) commit(result.state);
    if (action.type !== 'bossAttack' || !result.ok || !result.state.boss) notify(result.message, result.ok);
    if (result.ok && action.type !== 'setting') tone(['craft', 'achievement', 'bossAttack'].includes(action.type));
    if (result.ok) {
      if (['craft', 'upgrade', 'equip', 'potion', 'zone'].includes(action.type)) celebrate(action.type === 'craft' || action.type === 'potion' ? '#c5acff' : '#b4f0d1');
      if (['quest', 'achievement', 'dailyReward', 'expeditionClaim'].includes(action.type)) celebrate('#f5d598');
      if (levelOf(result.state.xp) > levelOf(previous.xp)) { notify(`Cấp ${levelOf(result.state.xp)}! Một chân trời mới đang mở ra.`); celebrate('#b4f0d1', 'level'); }
      if (action.type === 'bossStart') setCombatFx(null);
      if (action.type === 'bossAttack' && previous.boss) {
        setCombatFx({ id: ++fxId.current, style: action.style, damage: previous.boss.hp - (result.state.boss?.hp ?? 0), incoming: result.state.boss ? previous.boss.playerHp - result.state.boss.playerHp : result.state.bossWins > previous.bossWins ? 0 : previous.boss.playerHp });
        if (!motionRef.current) { setBattleBusy(true); if (battleTimer.current) clearTimeout(battleTimer.current); battleTimer.current = setTimeout(() => setBattleBusy(false), action.style === 'burst' ? 600 : 420); }
        if (result.state.bossWins > previous.bossWins) celebrate('#f5cddd', 'rare');
      }
    }
    return result.ok;
  }, [commit, notify, tone, celebrate]);

  useEffect(() => {
    if (initial.warning) {
      try { const raw = localStorage.getItem(SAVE_KEY); if (raw && !parseSave(raw)) localStorage.setItem(`${SAVE_KEY}-backup-${Date.now()}`, raw); } catch { /* Storage failure is shown by the save status. */ }
      notify(initial.warning, false);
    }
  }, [initial.warning, notify]);
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); setSaveFailed(false); } catch { setSaveFailed(true); }
  }, [s]);
  useEffect(() => {
    const interval = setInterval(() => { const time = Date.now(); setNow(time); const daily = normalizeDaily(stateRef.current, time); if (daily !== stateRef.current) commit(daily); }, 1000);
    return () => clearInterval(interval);
  }, [commit]);
  useEffect(() => () => { if (rollTimeout.current) clearTimeout(rollTimeout.current); if (battleTimer.current) clearTimeout(battleTimer.current); void audioRef.current?.close(); }, []);

  const beginRoll = useCallback((count: number) => {
    if (rollingRef.current || dialogRef.current || selectedAuraRef.current) return;
    const state = stateRef.current;
    if (count === 10 && state.totalRolls < 50) { notify('Quay 50 lần để mở khóa quay ×10.', false); return; }
    rollingRef.current = true; setRolling(true); tone();
    const duration = motionRef.current ? 220 : rollDuration(state) + (count === 10 ? 350 : 0);
    setRollMs(duration);
    rollTimeout.current = setTimeout(() => {
      const previous = stateRef.current, { state: next, results: found } = roll(previous, count);
      commit(next); setResults(found); rollingRef.current = false; setRolling(false); rollTimeout.current = null;
      const best = Math.max(...found.map(r => AURAS.find(a => a.id === r.auraId)!.rarity)); tone(best >= 3);
      if (best >= 3) celebrate(RARITIES[best].color, 'rare');
      if (levelOf(next.xp) > levelOf(previous.xp)) { notify(`Lên cấp ${levelOf(next.xp)} · Tiếp tục chạm tới những vì sao!`); if (best < 3) celebrate('#b4f0d1', 'level'); }
      const shouldCelebrate = count === 10 && !autoRef.current || best >= 4 && (!autoRef.current || next.settings.autoStop);
      if (shouldCelebrate) {
        if (autoRef.current && next.settings.autoStop) { autoRef.current = false; setAuto(false); }
        if (!dialogRef.current && !selectedAuraRef.current) setDialog('results');
        else notify(`Đã nhận ${RARITIES[best].name}! Kết quả được lưu trong bộ sưu tập.`);
      }
    }, duration);
  }, [commit, notify, tone, celebrate]);
  useEffect(() => {
    if (!auto || rolling || dialog || selectedAura) return;
    const timeout = setTimeout(() => beginRoll(batch), 650); return () => clearTimeout(timeout);
  }, [auto, rolling, dialog, selectedAura, batch, beginRoll]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.repeat || dialogRef.current || selectedAuraRef.current || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(target.tagName) || target.isContentEditable) return;
      if (page === 'observatory' && (e.code === 'Space' || e.key.toLowerCase() === 'r')) { e.preventDefault(); beginRoll(batch); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [page, beginRoll, batch]);

  const navigate = (next: Page) => { setPage(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: motionReduced ? 'instant' : 'smooth' }); };
  const toggleAuto = () => { if (auto) { setAuto(false); autoRef.current = false; } else { setAuto(true); autoRef.current = true; } };
  const openBoss = () => { if (stateRef.current.boss || dispatch({ type: 'bossStart' })) setDialog('boss'); };
  const exportSave = () => {
    const blob = new Blob([JSON.stringify(stateRef.current, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `astra-save-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Đã xuất bản lưu. Hãy giữ file để phục hồi tiến trình.');
  };
  const importSave = async (file?: File) => {
    if (!file) return; if (file.size > 1000000) { notify('File bản lưu quá lớn.', false); return; }
    try { const parsed = parseSave(await file.text()); if (!parsed) { notify('File không phải bản lưu ASTRA hợp lệ.', false); return; } setImported(parsed); setDialog('import'); }
    catch { notify('Không thể đọc file này.', false); }
    finally { if (inputRef.current) inputRef.current.value = ''; }
  };
  const progress = levelProgress(s.xp), zone = ZONES.find(z => z.id === s.zone)!, luck = luckOf(s, now);
  const featuredResult = results.reduce<RollResult | undefined>((best, item) => !best || AURAS.find(a => a.id === item.auraId)!.rarity > AURAS.find(a => a.id === best.auraId)!.rarity ? item : best, undefined);
  const currentAura = featuredResult ? AURAS.find(a => a.id === featuredResult.auraId)! : AURAS.find(a => a.id === s.equipped);
  const resultRarity = Math.max(0, ...results.map(r => AURAS.find(a => a.id === r.auraId)!.rarity));
  const collectionSize = Object.keys(s.inventory).length, completed = s.daily.claimed.length, event = eventActive(now), boost = s.boostUntil > now;
  const latest = s.log.filter(l => l.id !== 'welcome').slice(0, 3);

  return <div className={`app ${motionReduced ? 'reduce-motion' : ''}`}>
    <Starfield reducedMotion={motionReduced} meteorShower={event} />
    <ParticleBurst event={burst} reduced={motionReduced} />
    {mobileNav && <button className="nav-overlay" aria-label="Đóng menu" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <button className="brand" onClick={() => navigate('observatory')} aria-label="ASTRA — trang chủ"><span className="brand-symbol">✦</span><span>ASTRA<small>RNG UNIVERSE</small></span></button>
      <div className="sidebar-section-label">KHÔNG GIAN CỦA BẠN</div>
      <nav aria-label="Điều hướng chính">{NAV.map(n => <button key={n.id} className={page === n.id ? 'active' : ''} aria-current={page === n.id ? 'page' : undefined} onClick={() => navigate(n.id)}><n.icon size={19} strokeWidth={1.7} /><span>{n.name}</span>{n.id === 'collection' ? <span className="nav-count">{collectionSize}</span> : n.id === 'journey' && completed < 4 ? <i className="nav-dot" /> : page === n.id ? <ChevronRight size={14} /> : null}</button>)}</nav>
      <div className="sidebar-event"><div className="event-star">✷</div><span className="eyebrow">NHỊP ĐẬP THIÊN HÀ</span><h3>{event ? 'Mưa sao băng' : 'Chờ một vì sao rơi'}</h3><p>{event ? 'Bầu trời đang ưu ái bạn. May mắn +0,35 trên mọi vùng.' : 'Sự kiện may mắn tự động diễn ra mỗi 15 phút, kéo dài 5 phút.'}</p><div><span><i className={event ? 'live-dot' : ''} />{event ? 'ĐANG DIỄN RA' : 'SẮP BẮT ĐẦU'}</span><strong>{timer(eventRemaining(now))}</strong></div></div>
      <div className="sidebar-bottom"><div className="sidebar-section-label">TIỆN ÍCH</div><button className="utility" onClick={() => setDialog('help')}><CircleHelp size={18} />Hướng dẫn chơi<ArrowUpRight size={14} /></button><button className="utility" onClick={() => setDialog('settings')}><Settings2 size={18} />Thiết lập</button><div className="profile"><div className="avatar"><span>✦</span><i /></div><div><strong>Lữ khách tinh tú</strong><span>Cấp {progress.level} · {s.rebirths ? `${s.rebirths} lần tái sinh` : 'Hành trình mới'}</span></div><span className="level-badge">{progress.level}</span></div><Progress value={progress.percent} /><div className="xp-caption"><span>{format(progress.current)} / {format(progress.needed)} XP</span><span>Cấp {progress.level + 1}<ChevronRight size={11} /></span></div></div>
    </aside>

    <div className="main-shell" inert={mobileNav}><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Mở menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button><span className="breadcrumb-icon"><Orbit size={18} /></span><span>Vũ trụ của bạn</span><ChevronRight size={12} /><strong>{NAV.find(n => n.id === page)?.name}</strong></div><div className="topbar-right"><span className={`save-indicator ${saveFailed ? 'warning' : ''}`}><i />{saveFailed ? 'Chưa thể lưu · hãy xuất bản lưu' : 'Đã lưu tiến trình'}</span><button className="icon-button sound-toggle" aria-label={s.settings.sound ? 'Tắt âm thanh' : 'Bật âm thanh'} onClick={() => dispatch({ type: 'setting', id: 'sound', value: !s.settings.sound })}>{s.settings.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button><button className="wallet" onClick={() => navigate('forge')} title="Đến xưởng tinh tú"><Coins size={17} /><strong><AnimatedNumber value={s.coins} reduced={motionReduced} /></strong><span>VÀNG</span></button></div></header>
      <main>
        {page === 'observatory' && <div className="screen-enter">
          <div className="dashboard-intro"><div><span className="eyebrow"><i /> CHƯƠNG 01 · GIỮA NHỮNG VÌ SAO</span><h1>Điều kỳ diệu <span>đang chờ bạn.</span></h1><p>Một lượt quay, một khám phá. Câu chuyện của bạn bắt đầu từ đây.</p></div><button className="button daily-button" disabled={s.dailyReward === dayKey(now)} onClick={() => dispatch({ type: 'dailyReward' })}><Gift size={17} />{s.dailyReward === dayKey(now) ? 'Đã nhận quà hôm nay' : 'Quà hằng ngày'}{s.dailyReward !== dayKey(now) && <i />}</button></div>
          <div className="stat-row"><div className="stat-card"><span className="stat-icon mint"><Clover size={19} /></span><div><span>May mắn hiện tại</span><strong>{luck.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}<small>×</small>{boost && <em>BOOST</em>}</strong></div><span className="stat-spark">✧</span></div><div className="stat-card"><span className="stat-icon purple"><Package size={19} /></span><div><span>Aura đã khám phá</span><strong>{collectionSize}<small>/ 56</small></strong></div><div className="mini-progress"><i style={{ height: `${Math.max(12, collectionSize / 56 * 100)}%` }} /></div></div><div className="stat-card"><span className="stat-icon blue"><RefreshCw size={18} /></span><div><span>Tổng lượt quay</span><strong><AnimatedNumber value={s.totalRolls} reduced={motionReduced} /></strong></div><span className="stat-spark soft"><ArrowUpRight size={24} /></span></div><div className="stat-card"><span className="stat-icon gold"><Crown size={19} /></span><div><span>Aura tốt nhất</span><strong className="best-rarity" style={{ color: s.stats.bestRarity < 0 ? undefined : RARITIES[s.stats.bestRarity].color }}>{s.stats.bestRarity < 0 ? 'Đang chờ bạn' : RARITIES[s.stats.bestRarity].name}</strong></div></div></div>
          <div className="dashboard-grid"><div className="dashboard-primary">
            <section className={`roll-stage ${rolling ? 'is-rolling' : ''} ${auto ? 'auto-active' : ''}`} aria-busy={rolling} style={{ '--zone-color': zone.color } as React.CSSProperties} aria-label="Máy quay aura"><Landscape zone={s.zone} /><div className="stage-vignette" /><div className="stage-ornaments" aria-hidden="true"><i /><i /><i /><i /></div>{rolling && <RollSequence duration={rollMs} reduced={motionReduced} />}{!rolling && featuredResult && <StageReveal key={s.totalRolls} color={RARITIES[currentAura!.rarity].color} rarity={currentAura!.rarity} reduced={motionReduced} />}<div className="stage-heading"><button className="stage-zone" onClick={() => navigate('worlds')}><span><Icon name={zone.icon} size={15} /></span><strong>{zone.name}</strong><ChevronDown size={14} /></button><span className="stage-status"><i />{rolling ? 'ĐANG QUAY' : 'THIÊN HÀ 01'}</span></div><div className="coordinate coordinate-left">RA 23h 17m 09s</div><div className="coordinate coordinate-right">DEC +61° 32′ 08″</div>
              <div className="stage-center"><div className="orbit-caption top">✧ &nbsp; TÌM CHÒM SAO CỦA RIÊNG BẠN &nbsp; ✧</div><Orb color={currentAura?.color ?? zone.color} glyph={currentAura?.glyph ?? '✦'} rolling={rolling} rarity={currentAura?.rarity ?? 0} /><div key={s.totalRolls} className={`stage-result ${featuredResult && !rolling ? 'has-result' : ''}`} aria-live="polite"><span className="eyebrow" style={{ color: currentAura ? RARITIES[currentAura.rarity].color : undefined }}>{rolling ? 'VŨ TRỤ ĐANG HỒI ĐÁP…' : currentAura ? RARITIES[currentAura.rarity].name : 'VÔ VÀN KHẢ NĂNG'}</span><h2>{rolling ? 'Điều gì sẽ xuất hiện?' : currentAura?.name ?? 'Chạm tới vận mệnh'}</h2><p>{rolling ? 'Một vì sao đang tìm đường đến bạn' : results.length ? <>{results.length > 1 ? 'Aura nổi bật nhất' : featuredResult!.isNew ? '✧ Aura mới được khám phá' : 'Đã thêm vào bộ sưu tập'} · +{featuredResult!.coins} vàng{featuredResult!.guaranteed && ' · Bảo hiểm'}</> : '56 aura. 7 độ hiếm. Một hành trình của riêng bạn.'}</p></div></div>
              <div className="stage-bottom"><div className="roll-control"><button className={`auto-button ${auto ? 'active' : ''}`} aria-pressed={auto} onClick={toggleAuto} title="Bật hoặc tắt quay tự động">{auto ? <Pause size={16} /> : <Infinity size={18} />}<span>{auto ? 'Dừng tự động' : 'Tự động'}</span></button><button className="roll-button" disabled={rolling || auto} onClick={() => beginRoll(batch)}>{rolling ? <span className="spinner" /> : <Sparkles size={19} />}<span>{rolling ? 'Đang quay…' : `Quay aura${batch === 10 ? ' ×10' : ''}`}</span>{!rolling && <kbd>R</kbd>}</button><button className={`batch-button ${batch === 10 ? 'active' : ''}`} disabled={s.totalRolls < 50 || rolling} title={s.totalRolls < 50 ? `Mở khóa sau 50 lượt quay (${s.totalRolls}/50)` : 'Chuyển giữa quay ×1 và ×10'} onClick={() => setBatch(batch === 10 ? 1 : 10)}>{s.totalRolls < 50 ? <LockKeyhole size={14} /> : <WandSparkles size={15} />}×10</button></div><div className="stage-bottom-caption"><span><Shield size={12} />{auto ? 'Tự động quay đang bật' : 'Quay miễn phí, không giới hạn'}</span><span><Zap size={12} />{(rollDuration(s) / 1000).toLocaleString('vi-VN')} giây / lượt</span></div></div>
            </section>
            <div className="pity-panel panel"><div><span className="pity-icon"><Shield size={19} /></span><div><h3>Mỗi lượt quay đều có ý nghĩa</h3><p>Được đảm bảo Sử thi sau 40 lượt, Thần thoại sau 200 lượt.</p></div><button className="icon-button" aria-label="Tìm hiểu bảo hiểm quay" onClick={() => setDialog('help')}><CircleHelp size={17} /></button></div><div className="pity-meters"><div><div><span><i className="purple-dot" />Sử thi trở lên</span><strong>{s.pityEpic}<small> / 40</small></strong></div><Progress value={s.pityEpic / 40 * 100} color="#ae99eb" /></div><div><div><span><i className="pink-dot" />Thần thoại trở lên</span><strong>{s.pityMythic}<small> / 200</small></strong></div><Progress value={s.pityMythic / 200 * 100} color="#db93b2" /></div></div></div><NextMilestone state={s} navigate={navigate} />
          </div><aside className="daily-panel panel"><div className="daily-panel-heading"><div><span className="eyebrow">MỤC TIÊU NHỎ, HÀNH TRÌNH LỚN</span><h2>Nhiệm vụ hôm nay</h2></div><span className="quest-badge">{completed}/4</span></div><QuestList s={s} dispatch={dispatch} compact /><button className="all-quests" onClick={() => navigate('journey')}>Xem tất cả nhiệm vụ<ArrowRight size={16} /></button><div className="boost-card"><div className="boost-icon"><FlaskConical size={24} /></div><div><h3>{boost ? 'May mắn đang tăng!' : 'Thêm một chút may mắn'}</h3><p>{boost ? `Còn ${timer((s.boostUntil - now) / 1000)} · +1,5 may mắn` : `+1,5 may mắn trong 2 phút · ${s.potions} lọ`}</p></div><button className="icon-button" aria-label="Dùng thuốc may mắn" disabled={s.potions < 1} onClick={() => dispatch({ type: 'potion' })}><ArrowUpRight size={19} /></button></div></aside></div>
          <SectionHeading eyebrow="MỘT VŨ TRỤ ĐỂ KHÁM PHÁ" title="Hành trình không dừng lại"><LinkButton onClick={() => navigate('worlds')}>Bản đồ thế giới</LinkButton></SectionHeading>
          <div className="discover-grid"><button className="discover-card collection-discover" onClick={() => navigate('collection')}><div className="discover-art aura-stack"><span>✦</span><span>❋</span><span>◈</span></div><div><span className="eyebrow">56 AURA ĐỘC NHẤT</span><h3>Lưu giữ điều kỳ diệu</h3><p>Bộ sưu tập của những vì sao.</p></div><span className="discover-arrow"><ArrowUpRight size={18} /></span></button><button className="discover-card worlds-discover" onClick={() => navigate('worlds')}><div className="discover-art small-world"><Landscape zone="frost" compact /><div>◎</div></div><div><span className="eyebrow">5 THẾ GIỚI KHÁC BIỆT</span><h3>Phía bên kia đường chân trời</h3><p>Thám hiểm và tìm nguyên liệu hiếm.</p></div><span className="discover-arrow"><ArrowUpRight size={18} /></span></button><button className="discover-card boss-discover" onClick={() => navigate('worlds')}><div className="discover-art"><div className="tiny-blackhole" /></div><div><span className="eyebrow">THỬ THÁCH BOSS</span><h3>Đánh thức sức mạnh</h3><p>Đối mặt với Kẻ nuốt sao.</p></div><span className="discover-arrow"><ArrowUpRight size={18} /></span></button></div>
          {latest.length > 0 && <div className="recent-strip"><span><Sparkles size={14} />NHẬT KÝ CỦA BẠN</span><p>{latest[0].text}</p><button onClick={() => navigate('journey')} aria-label="Mở nhật ký"><ArrowRight size={15} /></button></div>}
        </div>}
        {page === 'collection' && <Collection s={s} now={now} dispatch={dispatch} onAura={setSelectedAura} onRoll={() => navigate('observatory')} />}
        {page === 'worlds' && <Worlds s={s} now={now} dispatch={dispatch} onBoss={openBoss} />}
        {page === 'forge' && <Forge s={s} now={now} dispatch={dispatch} onRebirth={() => setDialog('rebirth')} />}
        {page === 'journey' && <Journey s={s} now={now} dispatch={dispatch} />}
        <footer className="footer"><span><span>✦</span> ASTRA <i /> Một vũ trụ, vô vàn khả năng.</span><div><span>CHƠI THEO NHỊP CỦA BẠN</span><button onClick={() => setDialog('help')}>Hướng dẫn<ExternalLink size={11} /></button><span>v1.0</span></div></footer>
      </main>
    </div>

    <nav className="mobile-tabbar" aria-label="Điều hướng nhanh" inert={mobileNav}>{NAV.map((n, i) => <button key={n.id} className={page === n.id ? 'active' : ''} aria-current={page === n.id ? 'page' : undefined} onClick={() => navigate(n.id)}><n.icon size={20} strokeWidth={1.7} /><span>{['Quay', 'Aura', 'Khám phá', 'Chế tạo', 'Nhiệm vụ'][i]}</span>{page === n.id && <i />}</button>)}</nav>
    <div className="toast-stack">{toasts.map(t => <ToastMessage key={t.id} toast={t} close={closeToast} />)}</div>
    <input ref={inputRef} type="file" accept="application/json,.json" className="visually-hidden" aria-label="Nhập file bản lưu" onChange={e => void importSave(e.target.files?.[0])} />
    {selectedAura && <Modal title="Hồ sơ aura" subtitle="MỘT MẢNH GHÉP CỦA VŨ TRỤ" className={`aura-modal tier-${selectedAura.rarity}`} onClose={() => setSelectedAura(null)}><div className="aura-detail"><Orb color={selectedAura.color} glyph={selectedAura.glyph} rarity={selectedAura.rarity} /><span className="rarity-tag" style={{ color: RARITIES[selectedAura.rarity].color }}>{RARITIES[selectedAura.rarity].name}</span><h2>{selectedAura.name}</h2><p>{selectedAura.description}</p><div className="detail-stats"><div><small>Sở hữu</small><strong>{s.inventory[selectedAura.id] || 0}</strong></div><div><small>Tỷ lệ lượt thường hiện tại</small><strong>{(auraProbabilities(s, now)[AURAS.findIndex(a => a.id === selectedAura.id)] * 100).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}%</strong></div><div><small>Vùng cộng hưởng</small><strong>{ZONES.find(z => z.id === selectedAura.affinity)?.name}</strong></div></div>{s.inventory[selectedAura.id] ? <><button className="button primary full" disabled={s.equipped === selectedAura.id} onClick={() => dispatch({ type: 'equip', id: selectedAura.id })}>{s.equipped === selectedAura.id ? 'Đang trang bị' : 'Trang bị aura'}<Star size={16} /></button>{s.inventory[selectedAura.id] > 1 && <button className="button subtle full" onClick={() => dispatch({ type: 'salvage', id: selectedAura.id })}>Phân rã {s.inventory[selectedAura.id] - 1} bản sao · +{(s.inventory[selectedAura.id] - 1) * (selectedAura.rarity + 1) * 4} bụi sao<RefreshCw size={15} /></button>}</> : <p className="undiscovered-hint"><LockKeyhole size={15} />Tiếp tục quay để khám phá aura này.</p>}</div></Modal>}
    {dialog === 'results' && <Modal title={results.some(r => r.isNew) ? 'Một điều kỳ diệu vừa đến.' : 'Những vì sao đã hồi đáp.'} subtitle={results.length === 10 ? 'KẾT QUẢ 10 LƯỢT QUAY' : 'KẾT QUẢ LƯỢT QUAY'} onClose={() => setDialog(null)} wide={results.length > 1} className={`reveal-modal tier-${resultRarity}`}><div className="reveal-shell" style={{ '--reveal-color': RARITIES[resultRarity].color } as React.CSSProperties}><div className="reveal-spotlight" aria-hidden="true"><i /><i /><i /></div>{resultRarity >= 4 && <div className="rare-discovery"><Sparkles size={13} /><span>{resultRarity === 6 ? 'MỘT VÌ SAO BẤT TỬ' : resultRarity === 5 ? 'THẦN THOẠI ĐÃ THỨC GIẤC' : 'KHOẢNH KHẮC HUYỀN THOẠI'}</span><Sparkles size={13} /></div>}<div className={`results-grid ${results.length === 1 ? 'single' : ''}`}>{results.map((result, i) => {
      const aura = AURAS.find(a => a.id === result.auraId)!; return <div className="result-card" key={`${aura.id}-${i}`} style={{ '--aura-color': aura.color, '--rarity-color': RARITIES[aura.rarity].color, '--card-delay': `${i * 65}ms` } as React.CSSProperties}>{result.isNew && <span className="new-tag">MỚI</span>}<div className="result-glyph">{results.length === 1 ? <Orb color={aura.color} glyph={aura.glyph} rarity={aura.rarity} /> : aura.glyph}</div><span className="rarity-label">{RARITIES[aura.rarity].name}</span><h3>{aura.name}</h3><p>+{result.coins} vàng{result.guaranteed && ' · Bảo hiểm'}</p><button className="text-button" onClick={() => dispatch({ type: 'equip', id: aura.id })}>{s.equipped === aura.id ? 'Đang trang bị' : 'Trang bị'}<Star size={12} /></button></div>;
    })}</div></div><div className="result-total"><span><Coins size={17} />+{format(results.reduce((v, r) => v + r.coins, 0))} vàng</span><span><Package size={17} />{results.filter(r => r.isNew).length} aura mới</span></div><button className="button primary full" onClick={() => setDialog(null)}>Tiếp tục hành trình<ArrowRight size={16} /></button></Modal>}
    {dialog === 'boss' && <Modal title="Kẻ nuốt sao" subtitle="THỬ THÁCH THIÊN HÀ · CẤP 3+" onClose={() => setDialog(null)}><div className="boss-arena"><div className="boss-visual"><div key={`boss-${combatFx?.id ?? 'idle'}`} className={`black-hole ${s.boss ? 'alive' : ''} ${combatFx ? `hit-${combatFx.style}` : ''}`}><span /><i /><i /></div>{combatFx && <div key={`hit-${combatFx.id}`} className={`combat-effect ${combatFx.style}`} aria-hidden="true"><i className="combat-slash" /><i className="combat-wave" /><span className="damage-number">−{combatFx.damage}</span>{combatFx.style === 'guard' && <span className="guard-label"><Shield size={14} />PHÒNG THỦ</span>}</div>}</div>{s.boss ? <><div className="boss-health"><div><strong>Kẻ nuốt sao</strong><span>{s.boss.hp} / 360 HP</span></div><Progress value={s.boss.hp / 360 * 100} color="#ce96bd" /></div><div className="player-health"><div><strong><Heart size={14} />Lữ khách tinh tú</strong><span>{s.boss.playerHp} / 150 HP</span></div><Progress value={s.boss.playerHp / 150 * 100} /><p>{combatFx ? `Gây ${combatFx.damage} sát thương · Nhận ${combatFx.incoming} sát thương` : `Sức mạnh ${powerOf(s)} · Lượt ${s.boss.turn + 1}`}</p></div><div className="battle-actions" aria-busy={battleBusy}><button className="button primary" disabled={battleBusy} onClick={() => dispatch({ type: 'bossAttack', style: 'attack' })}><Swords size={17} />Tấn công</button><button className="button subtle" disabled={battleBusy} onClick={() => dispatch({ type: 'bossAttack', style: 'guard' })}><Shield size={17} />Phòng thủ</button><button className="button burst" disabled={battleBusy || s.boss.turn % 3 !== 2} onClick={() => dispatch({ type: 'bossAttack', style: 'burst' })}><Zap size={17} />Bùng nổ</button></div><p className="battle-tip">Phòng thủ giảm 75% sát thương nhận vào. Bùng nổ gây 2,4× sát thương, sẵn sàng mỗi 3 lượt.</p><button className="text-button retreat" onClick={() => { dispatch({ type: 'bossLeave' }); setDialog(null); }}>Rút lui an toàn</button></> : <div className="battle-end"><Trophy size={30} /><h3>Trận chiến đã kết thúc</h3><p>{s.log[0]?.type === 'boss' ? s.log[0].text : 'Chuẩn bị trang bị và trở lại khi boss hồi phục.'}</p><button className="button primary full" onClick={() => setDialog(null)}>Trở về thiên hà<ArrowRight size={16} /></button></div>}</div></Modal>}
    {dialog === 'rebirth' && <Modal title="Một khởi đầu mới." subtitle="TÁI SINH · TIẾN XA HƠN SAU MỖI CHU KỲ" onClose={() => setDialog(null)}><div className="rebirth-detail"><div className="rebirth-symbol">∞</div><p>Đánh đổi cấp độ, các nâng cấp thiết bị và 15.000 vàng để nhận <strong>+0,3 may mắn vĩnh viễn</strong> cùng +12 sức mạnh.</p><p>Bộ sưu tập, vùng đã mở, nguyên liệu, thành tựu và cổ vật được giữ lại. Bạn đã tái sinh {s.rebirths} lần.</p><div className="rebirth-requirements">{[{ label: 'Cấp độ', current: progress.level, target: 15 }, { label: 'Lượt quay', current: s.totalRolls, target: 500 }, { label: 'Vàng', current: s.coins, target: 15000 }].map(r => <div key={r.label}><span>{r.label}</span><strong className={r.current >= r.target ? 'mint-text' : ''}>{format(r.current)} / {format(r.target)}</strong></div>)}</div><button className="button primary full" disabled={progress.level < 15 || s.totalRolls < 500 || s.coins < 15000 || rolling} onClick={() => { if (dispatch({ type: 'rebirth' })) setDialog(null); }}>Xác nhận tái sinh<RefreshCw size={16} /></button></div></Modal>}
    {dialog === 'help' && <Modal title="Chào mừng đến ASTRA." subtitle="KHÔNG CẦN VỘI. THIÊN HÀ LUÔN Ở ĐÂY." onClose={() => setDialog(null)} wide><div className="help-grid">{[{ icon: Sparkles, title: '01 · Quay và khám phá', text: 'Nhấn Quay aura, phím R hoặc phím cách. Quay miễn phí, mỗi lượt nhận vàng, XP và bụi sao. Mở quay ×10 sau 50 lượt. Quay tự động tạm dừng khi mở hộp thoại.' }, { icon: Package, title: '02 · Sưu tập và trang bị', text: '56 aura chia thành 7 độ hiếm. Chọn aura trong bộ sưu tập để trang bị, xem tỷ lệ thật theo may mắn hiện tại hoặc phân rã bản sao thành bụi sao.' }, { icon: Compass, title: '03 · Đi xa hơn', text: 'Lên cấp, mở 5 vùng để tăng may mắn và tìm aura cộng hưởng. Gửi đội thám hiểm lấy nguyên liệu; nhận chiến lợi phẩm khi đồng hồ hoàn tất, cả sau khi đóng game.' }, { icon: Hammer, title: '04 · Trở nên mạnh mẽ', text: 'Nâng cấp may mắn, tốc độ và thu nhập. Chế tạo 6 cổ vật có hiệu ứng cộng dồn. Aura mạnh và cổ vật giúp bạn đánh bại boss ở cấp 3.' }, { icon: Shield, title: '05 · Mọi lượt quay đều có giá trị', text: 'Nếu 39 lượt liên tiếp chưa có Sử thi trở lên, lượt 40 đảm bảo Sử thi+. Nếu 199 lượt chưa có Thần thoại, lượt 200 đảm bảo Thần thoại+. Nhận aura tương ứng sẽ đặt lại bộ đếm.' }, { icon: Trophy, title: '06 · Một hành trình lâu dài', text: 'Làm 4 nhiệm vụ hằng ngày, nhận quà đăng nhập và chinh phục 10 thành tựu. Mưa sao băng diễn ra mỗi 15 phút. Đạt cấp 15, 500 lượt và 15.000 vàng để tái sinh.' }].map(h => <div key={h.title}><h.icon size={23} /><h3>{h.title}</h3><p>{h.text}</p></div>)}</div><div className="help-note"><MoonStar size={18} /><p>Đây là game chơi đơn, không dùng tiền thật. Tiến trình nằm trong trình duyệt của bạn. Hãy xuất bản lưu để chuyển máy hoặc dự phòng.</p></div><button className="button primary full" onClick={() => setDialog(null)}>Bắt đầu hành trình<ArrowRight size={17} /></button></Modal>}
    {dialog === 'settings' && <Modal title="Theo nhịp của bạn." subtitle="THIẾT LẬP & BẢN LƯU" onClose={() => setDialog(null)}><div className="settings-list">{[{ id: 'sound' as const, icon: Volume2, title: 'Âm thanh thiên hà', text: 'Âm thanh nhẹ khi quay và nhận thưởng.' }, { id: 'reducedMotion' as const, icon: Orbit, title: 'Giảm chuyển động', text: 'Tắt hiệu ứng chuyển động và rút ngắn hoạt ảnh quay.' }, { id: 'autoStop' as const, icon: Bell, title: 'Dừng khi gặp huyền thoại', text: 'Tự động dừng quay khi nhận Huyền thoại trở lên.' }].map(setting => <div className="setting" key={setting.id}><setting.icon size={21} /><div><h3>{setting.title}</h3><p>{setting.text}</p></div><button className={`toggle ${s.settings[setting.id] ? 'on' : ''}`} role="switch" aria-label={setting.title} aria-checked={s.settings[setting.id]} onClick={() => dispatch({ type: 'setting', id: setting.id, value: !s.settings[setting.id] })}><i /></button></div>)}</div><div className="save-settings"><h3><Shield size={17} />Bảo vệ hành trình của bạn</h3><p>{saveFailed ? 'Trình duyệt đang chặn lưu trữ. Hãy xuất file để tránh mất tiến trình.' : 'Game tự động lưu sau mỗi hành động. Xuất file để dự phòng hoặc chuyển sang trình duyệt khác.'}</p><div><button className="button subtle" onClick={exportSave}><ArrowDownToLine size={16} />Xuất bản lưu</button><button className="button subtle" disabled={rolling} onClick={() => inputRef.current?.click()}><ArrowUpToLine size={16} />Nhập bản lưu</button></div></div><details className="reset-settings"><summary>Bắt đầu lại từ đầu<ChevronDown size={14} /></summary><p>Thao tác này xóa tiến trình hiện tại trên trình duyệt. Xuất bản lưu trước khi tiếp tục. Nhập ASTRA để xác nhận.</p><label><input value={resetText} onChange={e => setResetText(e.target.value)} placeholder="Nhập ASTRA" aria-label="Nhập ASTRA để xác nhận xóa tiến trình" /><button className="button danger-button" disabled={resetText !== 'ASTRA' || rolling} onClick={() => { setAuto(false); autoRef.current = false; commit(createState()); setResults([]); setBatch(1); setResetText(''); setDialog(null); navigate('observatory'); notify('Đã bắt đầu một hành trình mới.'); }}>Bắt đầu lại</button></label></details></Modal>}
    {dialog === 'import' && imported && <Modal title="Tiếp tục một hành trình cũ?" subtitle="NHẬP BẢN LƯU" onClose={() => { setDialog('settings'); setImported(null); }}><div className="import-detail"><Package size={40} /><h3>Cấp {levelProgress(imported.xp).level} · {format(imported.totalRolls)} lượt quay</h3><p>{Object.keys(imported.inventory).length} aura · {format(imported.coins)} vàng</p><p>Nhập file sẽ thay thế tiến trình hiện tại. Bạn có thể xuất bản lưu hiện tại trước khi xác nhận.</p><button className="button subtle full" onClick={exportSave}><ArrowDownToLine size={16} />Xuất tiến trình hiện tại</button><button className="button primary full" disabled={rolling} onClick={() => { setAuto(false); autoRef.current = false; commit(imported); setResults([]); setBatch(1); setImported(null); setDialog(null); notify('Đã khôi phục tiến trình thành công!'); }}>Xác nhận khôi phục<Check size={16} /></button></div></Modal>}
  </div>;
}
