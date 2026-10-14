import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronRight, Clock3, Coins, Compass, Crown, Filter, FlaskConical, Hammer, LockKeyhole, MapPin, Package, RefreshCw, Search, Shield, Sparkles, Swords, Target, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, AURAS, MATERIALS, QUESTS, RARITIES, RECIPES, UPGRADES, ZONES, type Aura, type Material } from '../game/data';
import { achievementProgress, canCraft, dayKey, levelOf, powerOf, upgradeCost, type Action, type GameState } from '../game/engine';
import { Landscape, Orb } from './Art';
import { Checked, Empty, format, Icon, MaterialIcon, Progress, SectionHeading, timer } from './Ui';

export interface ScreenProps { s: GameState; now: number; dispatch: (action: Action) => void }
export function Collection({ s, onAura, onRoll }: ScreenProps & { onAura: (aura: Aura) => void; onRoll: () => void }) {
  const [query, setQuery] = useState(''), [rarity, setRarity] = useState(-1), [owned, setOwned] = useState(false), [sort, setSort] = useState('rarity');
  const list = AURAS.filter(a => (rarity === -1 || a.rarity === rarity) && (!owned || s.inventory[a.id]) && a.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
    .sort((a, b) => sort === 'rarity' ? b.rarity - a.rarity : sort === 'name' ? a.name.localeCompare(b.name, 'vi') : (s.inventory[b.id] || 0) - (s.inventory[a.id] || 0));
  const discovered = Object.keys(s.inventory).length;
  return <div className="screen-enter">
    <div className="page-intro"><span className="eyebrow">BẢN ĐỒ CỦA NHỮNG ĐIỀU KỲ DIỆU</span><h1>Bộ sưu tập <span>aura.</span></h1><p>Mỗi aura là một câu chuyện. Bạn sẽ tìm thấy câu chuyện nào tiếp theo?</p></div>
    <div className="collection-banner panel"><div className="collection-mark"><Package size={28} /></div><div><h3>Hành trình khám phá</h3><p>{discovered} trong số 56 aura đã được tìm thấy</p></div><div className="collection-progress"><div><span>{Math.round(discovered / 56 * 100)}% hoàn thành</span><span>{discovered} / 56</span></div><Progress value={discovered / 56 * 100} /></div></div>
    <div className="collection-tools"><label className="search-field"><Search size={17} /><input aria-label="Tìm aura" placeholder="Tìm một aura…" value={query} onChange={e => setQuery(e.target.value)} /></label><button className={`button subtle ${owned ? 'selected' : ''}`} onClick={() => setOwned(!owned)}><Filter size={15} />{owned ? 'Đã sở hữu' : 'Tất cả aura'}</button><select aria-label="Sắp xếp aura" value={sort} onChange={e => setSort(e.target.value)}><option value="rarity">Độ hiếm giảm dần</option><option value="name">Tên A → Z</option><option value="count">Số lượng sở hữu</option></select></div>
    <div className="filter-chips"><button className={rarity === -1 ? 'active' : ''} onClick={() => setRarity(-1)}>Tất cả <span>56</span></button>{RARITIES.map((r, i) => <button key={r.id} className={rarity === i ? 'active' : ''} style={{ '--chip-color': r.color } as React.CSSProperties} onClick={() => setRarity(i)}><i />{r.name}</button>)}</div>
    {list.length ? <div className="aura-grid">{list.map(a => {
      const count = s.inventory[a.id] || 0, equipped = s.equipped === a.id;
      return <button key={a.id} className={`aura-card ${count ? 'owned' : 'undiscovered'} ${equipped ? 'equipped' : ''}`} style={{ '--aura-color': a.color, '--rarity-color': RARITIES[a.rarity].color } as React.CSSProperties} onClick={() => onAura(a)}>
        <div className="aura-card-top"><span className="rarity-label"><i />{RARITIES[a.rarity].name}</span>{count > 0 ? <span className="count">×{count}</span> : <LockKeyhole size={13} />}</div>
        <div className="aura-symbol"><span>{a.glyph}</span><i /><i /></div>
        <h3>{a.name}</h3><p>{count ? equipped ? 'Đang trang bị' : 'Đã khám phá' : 'Chưa khám phá'}{equipped ? <Check size={12} /> : <ArrowUpRight size={12} />}</p>
      </button>;
    })}</div> : <Empty title="Chưa có aura phù hợp" description={owned && !discovered ? 'Hãy quay lần đầu để bắt đầu bộ sưu tập của bạn.' : 'Thử một từ khóa hoặc bộ lọc khác.'} action={owned && !discovered ? 'Quay ngay' : undefined} onAction={onRoll} />}
  </div>;
}

export function Worlds({ s, now, dispatch, onBoss }: ScreenProps & { onBoss: () => void }) {
  const level = levelOf(s.xp), expeditionZone = ZONES.find(z => z.id === s.expedition?.zone), expeditionReady = !!s.expedition && s.expedition.endsAt <= now;
  return <div className="screen-enter">
    <div className="page-intro"><span className="eyebrow">KHÔNG CÓ GIỚI HẠN CHO SỰ TÒ MÒ</span><h1>Đi xa hơn. <span>Tìm nhiều hơn.</span></h1><p>Năm thế giới, năm sắc thái. Có những điều chỉ xuất hiện khi bạn dám bước tiếp.</p></div>
    {s.expedition && <div className="expedition-status panel"><div className="status-icon"><Compass size={23} /></div><div><h3>{expeditionReady ? 'Đội thám hiểm đã trở về!' : `Đang thám hiểm ${expeditionZone?.name}`}</h3><p>{expeditionReady ? 'Nguyên liệu và kinh nghiệm đang chờ bạn.' : 'Bạn có thể tiếp tục quay. Tiến trình thám hiểm vẫn chạy khi đóng game.'}</p></div><span className="mono">{timer((s.expedition.endsAt - now) / 1000)}</span><button className="button primary" disabled={!expeditionReady} onClick={() => dispatch({ type: 'expeditionClaim' })}>{expeditionReady ? 'Nhận chiến lợi phẩm' : 'Đang khám phá'}<ArrowRight size={15} /></button></div>}
    <div className="world-grid">{ZONES.map((z, i) => {
      const unlocked = s.unlockedZones.includes(z.id), active = s.zone === z.id;
      return <article key={z.id} className={`world-card panel ${active ? 'active' : ''}`} style={{ '--zone-color': z.color } as React.CSSProperties}>
        <div className="world-art"><Landscape zone={z.id} compact /><div className="world-planet"><Orb color={z.color} glyph={['✦', '❋', '❄', '✺', '☾'][i]} size="small" /></div><span className="world-number">0{i + 1} / THẾ GIỚI</span>{active && <span className="pill current"><i />Đang ở đây</span>}{!unlocked && <span className="world-lock"><LockKeyhole size={17} /></span>}</div>
        <div className="world-info"><div className="world-title"><Icon name={z.icon} size={21} /><h3>{z.name}</h3></div><p>{z.description}</p><div className="world-specs"><span><Sparkles size={13} />May mắn +{z.luck.toLocaleString('vi-VN')}</span><span><Crown size={13} />Cấp {z.level}</span></div>
          <button className={`button ${active ? 'subtle' : 'primary'}`} disabled={active || (!unlocked && (level < z.level || s.coins < z.cost))} onClick={() => dispatch({ type: 'zone', id: z.id })}>{active ? 'Vùng hiện tại' : unlocked ? 'Dịch chuyển đến đây' : level < z.level ? `Mở khóa ở cấp ${z.level}` : `Mở khóa · ${format(z.cost)} vàng`}{active ? <Check size={16} /> : <ArrowRight size={16} />}</button>
          <button className="world-expedition" disabled={!unlocked || !!s.expedition} onClick={() => dispatch({ type: 'expedition', id: z.id })}><Compass size={15} />Thám hiểm · {timer(z.duration)}<span>+{z.reward}<MaterialIcon material={z.expedition} /></span></button>
        </div>
      </article>;
    })}</div>
    <div className="boss-banner panel"><div className="boss-banner-art"><div className="black-hole"><span /><i /><i /></div></div><div className="boss-banner-copy"><span className="eyebrow danger"><Swords size={13} /> THỬ THÁCH THIÊN HÀ</span><h2>Kẻ nuốt sao</h2><p>Thực thể cổ đại đang nuốt chửng ánh sáng. Trang bị aura, chế tạo cổ vật và bảo vệ thiên hà.</p><div className="boss-specs"><span><Shield size={15} />Sức mạnh của bạn: {powerOf(s)}</span><span><Trophy size={15} />{s.bossWins} chiến thắng</span></div></div><div className="boss-banner-action"><span className="boss-reward"><Coins size={15} />1.600 vàng <span>+ nguyên liệu hiếm</span></span><button className="button danger-button" disabled={level < 3 || (!s.boss && s.bossCooldown > now)} onClick={onBoss}>{s.boss ? 'Tiếp tục trận chiến' : level < 3 ? 'Mở khóa ở cấp 3' : s.bossCooldown > now ? `Hồi phục ${timer((s.bossCooldown - now) / 1000)}` : 'Thách đấu boss'}<Swords size={17} /></button></div></div>
  </div>;
}

export function Forge({ s, dispatch, onRebirth }: ScreenProps & { onRebirth: () => void }) {
  return <div className="screen-enter">
    <div className="page-intro"><span className="eyebrow">BIẾN NHỮNG ĐIỀU NHỎ BÉ THÀNH PHI THƯỜNG</span><h1>Xưởng <span>tinh tú.</span></h1><p>Chế tạo cổ vật, nâng cấp thiết bị. Chính bạn là người viết lại vận mệnh.</p></div>
    <div className="materials-bar panel">{(Object.keys(MATERIALS) as Material[]).map(key => <div key={key} style={{ '--material-color': MATERIALS[key].color } as React.CSSProperties}><span className="material-icon"><MaterialIcon material={key} size={23} /></span><span><small>{MATERIALS[key].name}</small><strong>{format(s.materials[key])}</strong></span></div>)}</div>
    <SectionHeading eyebrow="MỘT BƯỚC TIẾN MỖI NGÀY" title="Nâng cấp thiết bị"><span className="muted small">Dùng vàng để nâng cấp vĩnh viễn</span></SectionHeading>
    <div className="upgrade-grid">{UPGRADES.map(u => {
      const maxed = s.upgrades[u.id] >= u.max, cost = upgradeCost(s, u.id);
      return <article className="upgrade-card panel" key={u.id}><div className="upgrade-icon" style={{ color: u.color }}><Icon name={u.icon} size={24} /></div><span className="pill">Cấp {s.upgrades[u.id]} / {u.max}</span><h3>{u.name}</h3><p>{u.description}</p><div className="level-dots">{Array.from({ length: u.max }, (_, i) => <i key={i} className={i < s.upgrades[u.id] ? 'filled' : ''} />)}</div><button className="button subtle" disabled={maxed || s.coins < cost} onClick={() => dispatch({ type: 'upgrade', id: u.id })}>{maxed ? 'Đã đạt tối đa' : <><Coins size={15} />{format(cost)} vàng</>}{maxed ? <Check size={15} /> : <ArrowUpRight size={16} />}</button></article>;
    })}</div>
    <SectionHeading eyebrow="CỔ VẬT CỦA NHỮNG VÌ SAO" title="Chế tạo cổ vật"><span className="muted small">Hiệu ứng của tất cả cổ vật được cộng dồn</span></SectionHeading>
    <div className="recipe-grid">{RECIPES.map(r => {
      const crafted = s.crafted.includes(r.id);
      return <article className={`recipe-card panel ${crafted ? 'crafted' : ''}`} key={r.id}><div className="recipe-art" style={{ '--aura-color': r.color } as React.CSSProperties}><span>{r.glyph}</span><i /><i />{crafted && <span className="recipe-check"><Check size={15} /></span>}</div><div className="recipe-copy"><h3>{r.name}</h3><p>{r.description}</p><div className="recipe-cost"><span className={s.coins < r.coins ? 'insufficient' : ''}><Coins size={13} />{format(r.coins)}</span>{Object.entries(r.cost).map(([key, value]) => <span key={key} className={s.materials[key as Material] < value ? 'insufficient' : ''} title={MATERIALS[key as Material].name}><MaterialIcon material={key as Material} size={13} />{value}</span>)}</div><button className={`button ${crafted ? 'subtle' : 'primary'}`} disabled={!canCraft(s, r.id)} onClick={() => dispatch({ type: 'craft', id: r.id })}>{crafted ? 'Đã chế tạo · hiệu ứng đang hoạt động' : 'Chế tạo cổ vật'}{crafted ? <CheckCheck size={16} /> : <Hammer size={16} />}</button></div></article>;
    })}</div>
    <div className="forge-extras"><div className="potion-shop panel"><div className="potion-bottle"><FlaskConical size={40} /></div><div><span className="eyebrow">MỘT CHÚT MAY MẮN</span><h3>Thuốc ánh sao</h3><p>May mắn +1,5 trong 2 phút. Đang có {s.potions} lọ.</p></div><button className="button subtle" disabled={s.coins < 700} onClick={() => dispatch({ type: 'buyPotion' })}><Coins size={15} />700 vàng</button></div><div className="rebirth-panel panel"><RefreshCw size={27} /><div><h3>Khởi đầu một chu kỳ mới</h3><p>Tái sinh để nhận +0,3 may mắn vĩnh viễn.</p></div><button className="icon-button" aria-label="Tìm hiểu tái sinh" onClick={onRebirth}><ArrowUpRight size={20} /></button></div></div>
    <div className="tip"><Compass size={16} />Cần nguyên liệu? Thám hiểm các vùng hoặc phân rã aura trùng trong bộ sưu tập.</div>
  </div>;
}

export function QuestList({ s, dispatch, compact = false }: { s: GameState; dispatch: (action: Action) => void; compact?: boolean }) {
  return <div className={`quest-list ${compact ? 'compact' : ''}`}>{QUESTS.slice(0, compact ? 3 : 4).map((q, i) => {
    const value = Math.min(q.target, s.daily[q.metric]), done = value >= q.target, claimed = s.daily.claimed.includes(q.id);
    return <div className={`quest ${claimed ? 'claimed' : ''}`} key={q.id}><div className="quest-heading"><span className="quest-icon">{claimed ? <Check size={15} /> : <Target size={15} />}</span><h3>{q.name}</h3>{!compact && <span className="quest-number">0{i + 1}</span>}</div><p>{q.description}</p><div className="quest-progress"><Progress value={value / q.target * 100} /><span>{value}/{q.target}</span></div><div className="quest-footer"><span><Coins size={13} />{q.coins}{!compact && <><Sparkles size={13} />{q.dust}<span>+{q.xp} XP</span></>}</span>{claimed ? <Checked>Đã nhận</Checked> : <button className={done ? 'claim-button' : 'text-button muted'} disabled={!done} onClick={() => dispatch({ type: 'quest', id: q.id })}>{done ? 'Nhận thưởng' : 'Đang thực hiện'}{done && <ArrowRight size={12} />}</button>}</div></div>;
  })}</div>;
}

export function Journey({ s, now, dispatch }: ScreenProps) {
  const [tab, setTab] = useState<'quests' | 'achievements' | 'log'>('quests');
  const ready = ACHIEVEMENTS.filter(a => !s.achievementsClaimed.includes(a.id) && achievementProgress(s, a.metric) >= a.target).length;
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  return <div className="screen-enter">
    <div className="page-intro"><span className="eyebrow">MỖI NGÀY LÀ MỘT KHỞI ĐẦU MỚI</span><h1>Hành trình <span>của bạn.</span></h1><p>Những cột mốc nhỏ hôm nay sẽ trở thành huyền thoại của ngày mai.</p></div>
    <div className="journey-tabs"><button className={tab === 'quests' ? 'active' : ''} onClick={() => setTab('quests')}><Target size={17} />Nhiệm vụ hằng ngày</button><button className={tab === 'achievements' ? 'active' : ''} onClick={() => setTab('achievements')}><Trophy size={17} />Thành tựu{ready > 0 && <span className="badge">{ready}</span>}</button><button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}><Clock3 size={17} />Nhật ký</button></div>
    {tab === 'quests' && <><div className="daily-banner panel"><div className="daily-gift">✧</div><div><span className="eyebrow">CUỘC HẸN VỚI THIÊN HÀ</span><h3>Quà đăng nhập hằng ngày</h3><p>Chuỗi {s.dailyStreak} ngày · Vàng, bụi sao và một lọ thuốc may mắn.</p></div><button className="button primary" disabled={s.dailyReward === dayKey(now)} onClick={() => dispatch({ type: 'dailyReward' })}>{s.dailyReward === dayKey(now) ? 'Đã nhận hôm nay' : 'Nhận quà hôm nay'}{s.dailyReward === dayKey(now) ? <Check size={16} /> : <ArrowRight size={16} />}</button></div><SectionHeading title="Nhiệm vụ hôm nay"><span className="muted small"><Clock3 size={14} /> Làm mới sau {timer((midnight.getTime() - now) / 1000)}</span></SectionHeading><div className="daily-quests panel"><QuestList s={s} dispatch={dispatch} /></div></>}
    {tab === 'achievements' && <><div className="achievement-summary"><span><Trophy size={18} />{s.achievementsClaimed.length} / {ACHIEVEMENTS.length} thành tựu đã nhận</span><p>Mỗi thành tựu tặng thêm một lọ thuốc may mắn.</p></div><div className="achievement-grid">{ACHIEVEMENTS.map(a => {
      const progress = Math.min(achievementProgress(s, a.metric), a.target), done = progress >= a.target, claimed = s.achievementsClaimed.includes(a.id);
      return <article className={`achievement panel ${done ? 'done' : ''}`} key={a.id}><div className="achievement-glyph">{a.glyph}</div><div><h3>{a.name}</h3><p>{a.description}</p><Progress value={Math.max(0, progress) / a.target * 100} /><div className="achievement-bottom"><span><Coins size={13} />{format(a.coins)}</span>{claimed ? <Checked>Đã nhận</Checked> : <button className="text-button" disabled={!done} onClick={() => dispatch({ type: 'achievement', id: a.id })}>{done ? 'Nhận thưởng' : `${Math.max(0, progress)} / ${a.target}`}{done && <ArrowRight size={13} />}</button>}</div></div></article>;
    })}</div></>}
    {tab === 'log' && <div className="log-panel panel"><SectionHeading title="Những dấu ấn gần đây"><span className="muted small">Lưu 60 sự kiện mới nhất</span></SectionHeading>{s.log.map((l, i) => <div className="log-entry" key={`${l.id}-${i}`}><span className={`log-icon ${l.type}`}>{l.type === 'roll' ? <Sparkles size={15} /> : l.type === 'boss' ? <Swords size={15} /> : l.type === 'craft' ? <Hammer size={15} /> : l.type === 'quest' ? <Trophy size={15} /> : <MapPin size={15} />}</span><span>{l.text}</span><time>{new Date(l.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div>}
    <div className="tip"><Compass size={16} />Tiến trình được lưu tự động trên trình duyệt này. Bạn có thể xuất bản lưu trong phần thiết lập.<ChevronRight size={14} /></div>
  </div>;
}
