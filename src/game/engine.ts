import { adminLuck } from './liveConfig';
import { ACHIEVEMENTS, AURAS, AURA_BY_ID, BOSSES, BOSS_BY_ID, CONTRACTS, QUESTS, RARITIES, RARITY_COUNTS, RECIPES, UPGRADES, ZONES, type Material, type UpgradeId, type ZoneId } from './data';

export const SAVE_KEY = 'astra-rng-save-v1';
export const dayKey = (now = Date.now()) => new Date(now).toLocaleDateString('en-CA');
export interface LogEntry { id: string; time: number; text: string; type: 'roll' | 'quest' | 'craft' | 'world' | 'boss' }
export interface GameState {
  version: 1; coins: number; xp: number; totalRolls: number; rebirths: number;
  materials: Record<Material, number>; inventory: Record<string, number>; equipped: string | null;
  upgrades: Record<UpgradeId, number>; crafted: string[]; unlockedZones: ZoneId[]; zone: ZoneId;
  pityEpic: number; pityMythic: number; potions: number; boostUntil: number;
  expedition: { zone: ZoneId; endsAt: number } | null; expeditionsDone: number;
  boss: { id: string; hp: number; maxHp: number; playerHp: number; playerMaxHp: number; turn: number } | null; bossWins: number; bossCooldown: number;
  daily: { date: string; rolls: number; discoveries: number; rares: number; expeditions: number; claimed: string[] };
  favorites: string[]; contractsClaimed: string[]; bossKills: Record<string, number>; bossCooldowns: Record<string, number>; zoneRolls: Record<string, number>;
  dailyReward: string; dailyStreak: number; achievementsClaimed: string[];
  stats: { bestRarity: number; totalEarned: number }; log: LogEntry[];
  settings: { sound: boolean; reducedMotion: boolean; autoStop: boolean };
}
export function createState(now = Date.now()): GameState {
  return { version: 1, coins: 350, xp: 0, totalRolls: 0, rebirths: 0,
    materials: { dust: 20, ore: 0, crystal: 0, essence: 0 }, inventory: {}, equipped: null,
    upgrades: { luck: 0, speed: 0, income: 0 }, crafted: [], unlockedZones: ['astral'], zone: 'astral',
    pityEpic: 0, pityMythic: 0, potions: 2, boostUntil: 0, expedition: null, expeditionsDone: 0,
    boss: null, bossWins: 0, bossCooldown: 0,
    daily: { date: dayKey(now), rolls: 0, discoveries: 0, rares: 0, expeditions: 0, claimed: [] },
    favorites: [], contractsClaimed: [], bossKills: {}, bossCooldowns: {}, zoneRolls: {},
    dailyReward: '', dailyStreak: 0, achievementsClaimed: [], stats: { bestRarity: -1, totalEarned: 0 },
    log: [{ id: 'welcome', time: now, text: 'Chào mừng đến ASTRA. Vũ trụ đang chờ bạn.', type: 'world' }],
    settings: { sound: false, reducedMotion: false, autoStop: true },
  };
}
export function levelOf(xp: number) { return Math.floor(Math.sqrt(xp / 65)) + 1; }
export function levelProgress(xp: number) {
  const level = levelOf(xp), floor = 65 * (level - 1) ** 2, ceiling = 65 * level ** 2;
  return { level, current: xp - floor, needed: ceiling - floor, percent: (xp - floor) / (ceiling - floor) * 100 };
}
export function luckOf(s: GameState, now = Date.now()) {
  return 1 + adminLuck(now) + s.upgrades.luck * .2 + s.rebirths * .3 + RECIPES.filter(r => s.crafted.includes(r.id)).reduce((v, r) => v + r.luck, 0)
    + (ZONES.find(z => z.id === s.zone)?.luck ?? 0) + (s.boostUntil > now ? 1.5 : 0) + (eventActive(now) ? .35 : 0);
}
export function eventActive(now = Date.now()) { return Math.floor(now / 1000) % 900 < 300; }
export function eventRemaining(now = Date.now()) { const t = Math.floor(now / 1000) % 900; return t < 300 ? 300 - t : 900 - t; }
export function rollDuration(s: GameState) { return Math.round(1800 * (1 - .08 * s.upgrades.speed)); }
export function upgradeCost(s: GameState, id: UpgradeId) { return Math.round(UPGRADES.find(u => u.id === id)!.base * 1.65 ** s.upgrades[id]); }
export function powerOf(s: GameState) {
  const aura = s.equipped ? AURA_BY_ID[s.equipped] : undefined;
  return 12 + (aura?.power ?? 0) + levelOf(s.xp) * 3 + s.rebirths * 12
    + RECIPES.filter(r => s.crafted.includes(r.id)).reduce((v, r) => v + r.power, 0);
}
export function auraProbabilities(s: GameState, now = Date.now(), minRarity = 0) {
  const luck = luckOf(s, now);
  const weights = AURAS.map(a => a.rarity < minRarity ? 0 : RARITIES[a.rarity].weight / RARITY_COUNTS[a.rarity] * (1 + (luck - 1) * a.rarity * .65)
    * (s.zone !== 'astral' && a.affinity === s.zone ? 2 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / total);
}
export function normalizeDaily(s: GameState, now = Date.now()): GameState {
  return s.daily.date === dayKey(now) ? s : { ...s, daily: { date: dayKey(now), rolls: 0, discoveries: 0, rares: 0, expeditions: 0, claimed: [] } };
}
function entry(s: GameState, text: string, type: LogEntry['type'], now: number) {
  s.log = [{ id: `${now}-${s.totalRolls}-${s.log.length}`, time: now, text, type }, ...s.log].slice(0, 60);
}
export interface RollResult { auraId: string; isNew: boolean; coins: number; guaranteed: boolean }
export function roll(s: GameState, count = 1, now = Date.now(), random = Math.random): { state: GameState; results: RollResult[] } {
  const next = structuredClone(normalizeDaily(s, now)); const results: RollResult[] = [];
  const actualCount = count === 10 && s.totalRolls >= 50 ? 10 : 1;
  for (let i = 0; i < actualCount; i++) {
    const min = next.pityMythic >= 199 ? 5 : next.pityEpic >= 39 ? 3 : 0;
    const probabilities = auraProbabilities(next, now, min);
    let sample = Math.max(0, Math.min(.999999999999, random())), selected = AURAS.length - 1;
    for (let n = 0; n < probabilities.length; n++) { sample -= probabilities[n]; if (sample < 0) { selected = n; break; } }
    const aura = AURAS[selected], isNew = !next.inventory[aura.id];
    const coins = Math.round(RARITIES[aura.rarity].value * (1 + next.upgrades.income * .15));
    next.inventory[aura.id] = (next.inventory[aura.id] || 0) + 1;
    next.coins += coins; next.stats.totalEarned += coins; next.xp += 8 + aura.rarity * 5;
    next.materials.dust += 1 + aura.rarity + (isNew ? 2 : 0);
    if (aura.rarity >= 2) next.materials.crystal += 1;
    if (aura.rarity >= 4) next.materials.essence += 1;
    next.zoneRolls[next.zone] = (next.zoneRolls[next.zone] || 0) + 1;
    next.totalRolls++; next.daily.rolls++; if (isNew) next.daily.discoveries++; if (aura.rarity >= 2) next.daily.rares++;
    next.pityEpic = aura.rarity >= 3 ? 0 : next.pityEpic + 1;
    next.pityMythic = aura.rarity >= 5 ? 0 : next.pityMythic + 1;
    next.stats.bestRarity = Math.max(next.stats.bestRarity, aura.rarity);
    if (!next.equipped) next.equipped = aura.id;
    if (isNew || aura.rarity >= 3) entry(next, `${isNew ? 'Khám phá' : 'Nhận được'} ${aura.name} · ${RARITIES[aura.rarity].name}`, 'roll', now);
    results.push({ auraId: aura.id, isNew, coins, guaranteed: min > 0 });
  }
  return { state: next, results };
}
export type Action =
  | { type: 'equip'; id: string } | { type: 'upgrade'; id: UpgradeId } | { type: 'craft'; id: string }
  | { type: 'zone'; id: ZoneId } | { type: 'expedition'; id: ZoneId } | { type: 'expeditionClaim' }
  | { type: 'quest'; id: string } | { type: 'achievement'; id: string } | { type: 'dailyReward' }
  | { type: 'potion' } | { type: 'buyPotion' } | { type: 'bossStart'; id?: string } | { type: 'bossAttack'; style: 'attack' | 'guard' | 'burst' }
  | { type: 'bossLeave' } | { type: 'rebirth' } | { type: 'setting'; id: keyof GameState['settings']; value: boolean }
  | { type: 'salvage'; id: string } | { type: 'favorite'; id: string } | { type: 'contract'; id: string }
  | { type: 'claimAllContracts' } | { type: 'salvageAll' } | { type: 'equipBest' };
export function achievementProgress(s: GameState, metric: string): number {
  return ({ rolls: s.totalRolls, collection: Object.keys(s.inventory).length, rarity: s.stats.bestRarity,
    zones: s.unlockedZones.length, crafted: s.crafted.length, bosses: s.bossWins, expeditions: s.expeditionsDone, earned: s.stats.totalEarned, level: levelOf(s.xp), rebirths: s.rebirths, contracts: s.contractsClaimed.length, uniqueBosses: Object.keys(s.bossKills).length, zoneMastery: Math.max(0, ...Object.values(s.zoneRolls)) } as Record<string, number>)[metric] ?? 0;
}
export function canCraft(s: GameState, id: string) {
  const r = RECIPES.find(r => r.id === id);
  return !!r && !s.crafted.includes(id) && levelOf(s.xp) >= (r.level ?? 1) && (!r.zone || s.unlockedZones.includes(r.zone)) && s.coins >= r.coins && Object.entries(r.cost).every(([key, value]) => s.materials[key as Material] >= value);
}
export interface ActionResult { state: GameState; message: string; ok: boolean; combat?: { damage: number; incoming: number; healed: number } }
export function act(state: GameState, action: Action, now = Date.now(), random = Math.random): ActionResult {
  const s = structuredClone(normalizeDaily(state, now));
  const fail = (message: string) => ({ state, message, ok: false }); let message = ''; let combat: ActionResult['combat'];
  switch (action.type) {
    case 'equip': {
      const a = AURA_BY_ID[action.id]; if (!a || !s.inventory[a.id]) return fail('Bạn chưa sở hữu aura này.');
      s.equipped = a.id; message = `Đã trang bị ${a.name}.`; break;
    }
    case 'upgrade': {
      const u = UPGRADES.find(u => u.id === action.id)!; const cost = upgradeCost(s, u.id);
      if (s.upgrades[u.id] >= u.max) return fail('Đã đạt cấp tối đa.'); if (s.coins < cost) return fail('Chưa đủ vàng để nâng cấp.');
      s.coins -= cost; s.upgrades[u.id]++; message = `${u.name} đạt cấp ${s.upgrades[u.id]}.`; break;
    }
    case 'craft': {
      const r = RECIPES.find(r => r.id === action.id); if (!r || !canCraft(s, r.id)) return fail('Chưa đủ nguyên liệu hoặc cổ vật đã được chế tạo.');
      s.coins -= r.coins; Object.entries(r.cost).forEach(([key, value]) => s.materials[key as Material] -= value);
      s.crafted.push(r.id); s.xp += 100; message = `Đã chế tạo ${r.name}!`; entry(s, message, 'craft', now); break;
    }
    case 'zone': {
      const z = ZONES.find(z => z.id === action.id); if (!z) return fail('Vùng không tồn tại.');
      if (!s.unlockedZones.includes(z.id)) {
        if (levelOf(s.xp) < z.level) return fail(`Cần đạt cấp ${z.level} để mở vùng này.`);
        if (s.coins < z.cost) return fail('Chưa đủ vàng để mở vùng.');
        s.coins -= z.cost; s.unlockedZones.push(z.id); entry(s, `Mở khóa ${z.name}.`, 'world', now);
      }
      s.zone = z.id; message = `Đã đến ${z.name}.`; break;
    }
    case 'expedition': {
      const z = ZONES.find(z => z.id === action.id); if (!z || !s.unlockedZones.includes(z.id)) return fail('Hãy mở khóa vùng này trước.');
      if (s.expedition) return fail('Một chuyến thám hiểm đang diễn ra.');
      s.expedition = { zone: z.id, endsAt: now + z.duration * 1000 }; message = `Đội thám hiểm đã đến ${z.name}.`; break;
    }
    case 'expeditionClaim': {
      if (!s.expedition || s.expedition.endsAt > now) return fail('Chuyến thám hiểm chưa hoàn thành.');
      const z = ZONES.find(z => z.id === s.expedition!.zone)!; s.materials[z.expedition] += z.reward; s.coins += 100 + z.level * 25;
      s.xp += z.level * 30; s.expeditionsDone++; s.daily.expeditions++; s.expedition = null;
      message = `Thám hiểm thành công! +${z.reward} ${z.expedition === 'dust' ? 'bụi sao' : z.expedition === 'ore' ? 'quặng' : z.expedition === 'crystal' ? 'tinh thể' : 'tinh chất'}.`; entry(s, message, 'world', now); break;
    }
    case 'quest': {
      const q = QUESTS.find(q => q.id === action.id); if (!q || s.daily.claimed.includes(q.id) || s.daily[q.metric] < q.target) return fail('Nhiệm vụ chưa hoàn thành hoặc đã nhận thưởng.');
      s.daily.claimed.push(q.id); s.coins += q.coins; s.materials.dust += q.dust; s.xp += q.xp;
      message = `Hoàn thành “${q.name}”. +${q.coins} vàng!`; entry(s, message, 'quest', now); break;
    }
    case 'achievement': {
      const a = ACHIEVEMENTS.find(a => a.id === action.id);
      if (!a || s.achievementsClaimed.includes(a.id) || achievementProgress(s, a.metric) < a.target) return fail('Thành tựu chưa hoàn thành hoặc đã nhận.');
      s.achievementsClaimed.push(a.id); s.coins += a.coins; s.potions++; message = `${a.name}: +${a.coins} vàng và 1 thuốc may mắn.`; entry(s, message, 'quest', now); break;
    }
    case 'dailyReward': {
      if (s.dailyReward === dayKey(now)) return fail('Bạn đã nhận quà hôm nay.');
      const yesterday = dayKey(now - 86400000); s.dailyStreak = s.dailyReward === yesterday ? s.dailyStreak + 1 : 1;
      s.dailyReward = dayKey(now); const coins = 250 + Math.min(s.dailyStreak, 7) * 50; s.coins += coins; s.potions++; s.materials.dust += 25;
      message = `Quà ngày ${s.dailyStreak}: +${coins} vàng, +25 bụi sao, +1 thuốc!`; entry(s, message, 'quest', now); break;
    }
    case 'potion': {
      if (s.potions < 1) return fail('Bạn đã hết thuốc may mắn.'); s.potions--; s.boostUntil = Math.max(now, s.boostUntil) + 120000;
      message = 'May mắn +1,5 trong 2 phút. Hiệu lực được cộng dồn thời gian!'; break;
    }
    case 'buyPotion': {
      if (s.coins < 700) return fail('Cần 700 vàng để mua thuốc.'); s.coins -= 700; s.potions++; message = 'Đã mua 1 thuốc may mắn.'; break;
    }
    case 'bossStart': {
      if (s.boss) return fail('Trận chiến đang diễn ra.');
      const boss = BOSS_BY_ID[action.id ?? BOSSES[0].id]; if (!boss) return fail('Boss không tồn tại.');
      if (levelOf(s.xp) < boss.level || !s.unlockedZones.includes(boss.zone)) return fail(`Cần cấp ${boss.level} và mở vùng ${ZONES.find(z => z.id === boss.zone)!.name}.`);
      if ((s.bossCooldowns[boss.id] ?? (boss.id === BOSSES[0].id ? s.bossCooldown : 0)) > now) return fail('Boss đang hồi phục.');
      const maxHp = 150 + levelOf(s.xp) * 5;
      s.boss = { id: boss.id, hp: boss.hp, maxHp: boss.hp, playerHp: maxHp, playerMaxHp: maxHp, turn: 0 };
      message = `${boss.name} đã thức giấc. Chuẩn bị chiến đấu!`; break;
    }
    case 'bossAttack': {
      if (!s.boss) return fail('Chưa bắt đầu trận chiến.'); const b = s.boss, boss = BOSS_BY_ID[b.id];
      if (action.style === 'burst' && b.turn % 3 !== 2) return fail('Bùng nổ sẵn sàng sau 2 hành động.');
      const armor = boss.style === 'bastion' && b.turn % 3 === 0 && action.style !== 'burst' ? .4 : 1;
      const damage = Math.round(powerOf(s) * (.9 + random() * .2) * (action.style === 'burst' ? 2.4 : action.style === 'guard' ? .4 : 1) * armor);
      combat = { damage, incoming: 0, healed: 0 };
      b.hp = Math.max(0, b.hp - damage); b.turn++;
      if (b.hp === 0) {
        s.boss = null; s.bossWins++; s.bossKills[boss.id] = (s.bossKills[boss.id] || 0) + 1; s.bossCooldowns[boss.id] = now + 120000;
        if (boss.id === BOSSES[0].id) s.bossCooldown = now + 120000;
        s.coins += boss.coins; s.materials.essence += boss.essence; s.materials.crystal += boss.crystal; s.xp += boss.xp;
        message = `Chiến thắng ${boss.name}! +${boss.coins.toLocaleString('vi-VN')} vàng, +${boss.essence} tinh chất, +${boss.crystal} tinh thể, +${boss.xp} XP.`; entry(s, message, 'boss', now);
      } else {
        const rage = boss.style === 'berserker' && b.hp <= b.maxHp / 2 ? 1.45 : boss.style === 'striker' && b.turn % 3 === 0 ? 1.5 : 1;
        const incoming = Math.round((boss.damage + random() * 10) * rage * (action.style === 'guard' ? .25 : 1));
        combat.incoming = incoming;
        b.playerHp = Math.max(0, b.playerHp - incoming);
        if (!b.playerHp) {
          s.boss = null; s.bossCooldowns[boss.id] = now + 30000; if (boss.id === BOSSES[0].id) s.bossCooldown = now + 30000;
          message = 'Bạn đã rút lui an toàn. Nâng cấp cổ vật, trang bị aura mạnh hơn và thử lại sau 30 giây.'; entry(s, `Thất bại trước ${boss.name}. Hãy trở lại mạnh mẽ hơn.`, 'boss', now);
        } else {
          const heal = boss.style === 'regenerator' && b.turn % 3 === 0 ? Math.min(b.maxHp - b.hp, Math.round(b.maxHp * .03)) : 0; b.hp += heal;
          combat.healed = heal;
          message = `${action.style === 'burst' ? 'Bùng nổ' : action.style === 'guard' ? 'Phòng thủ' : 'Tấn công'} gây ${damage} sát thương. Boss phản công ${incoming}.${heal ? ` Hồi phục ${heal} HP.` : ''}`;
        }
      }
      break;
    }
    case 'bossLeave': {
      if (s.boss) { s.bossCooldowns[s.boss.id] = now + 30000; if (s.boss.id === BOSSES[0].id) s.bossCooldown = now + 30000; }
      s.boss = null; message = 'Đã rời trận chiến. Bạn có thể quay lại sau 30 giây.'; break;
    }
    case 'favorite': {
      if (!AURA_BY_ID[action.id]) return fail('Aura không tồn tại.');
      s.favorites = s.favorites.includes(action.id) ? s.favorites.filter(id => id !== action.id) : [...s.favorites, action.id]; message = 'Đã cập nhật danh sách yêu thích.'; break;
    }
    case 'equipBest': {
      const best = Object.keys(s.inventory).map(id => AURA_BY_ID[id]).sort((a, b) => b.power - a.power)[0];
      if (!best) return fail('Bạn chưa sở hữu aura.'); s.equipped = best.id; message = `Đã trang bị ${best.name} · Sức mạnh +${best.power}.`; break;
    }
    case 'salvageAll': {
      let count = 0, dust = 0;
      for (const [id, quantity] of Object.entries(s.inventory)) if (quantity > 1) { count += quantity - 1; dust += (quantity - 1) * (AURA_BY_ID[id].rarity + 1) * 4; s.inventory[id] = 1; }
      if (!count) return fail('Chưa có bản sao để phân rã.'); s.materials.dust += dust; message = `Phân rã ${count} bản sao: +${dust} bụi sao. Giữ lại mỗi aura một bản.`; break;
    }
    case 'contract':
    case 'claimAllContracts': {
      const ready = CONTRACTS.filter(c => (action.type === 'claimAllContracts' || c.id === action.id) && !s.contractsClaimed.includes(c.id) && achievementProgress(s, c.metric) >= c.target);
      if (!ready.length) return fail('Chưa có hợp đồng đủ điều kiện nhận thưởng.');
      for (const c of ready) { s.contractsClaimed.push(c.id); s.coins += c.coins; s.materials.dust += c.dust; s.xp += c.xp; }
      message = `Hoàn thành ${ready.length} hợp đồng! +${ready.reduce((v, c) => v + c.coins, 0).toLocaleString('vi-VN')} vàng.`; entry(s, message, 'quest', now); break;
    }
    case 'rebirth': {
      if (levelOf(s.xp) < 15 || s.totalRolls < 500 || s.coins < 15000) return fail('Tái sinh cần cấp 15, 500 lượt quay và 15.000 vàng.');
      s.coins -= 15000; s.xp = 0; s.upgrades = { luck: 0, speed: 0, income: 0 }; s.rebirths++; s.boss = null;
      message = `Tái sinh lần ${s.rebirths}. May mắn vĩnh viễn +0,3. Bộ sưu tập, vùng và cổ vật được giữ lại!`; entry(s, message, 'world', now); break;
    }
    case 'setting': s.settings[action.id] = action.value; message = 'Đã lưu thiết lập.'; break;
    case 'salvage': {
      const aura = AURA_BY_ID[action.id]; if (!aura || (s.inventory[aura.id] || 0) <= 1) return fail('Chỉ có thể phân rã bản sao.');
      const count = s.inventory[aura.id] - 1, dust = count * (aura.rarity + 1) * 4; s.inventory[aura.id] = 1; s.materials.dust += dust;
      message = `Đã phân rã ${count} bản sao: +${dust} bụi sao.`; break;
    }
  }
  return { state: s, message, ok: true, combat };
}

// Only validated, bounded game data enters the runtime; imported saves are untrusted.
export function parseSave(raw: string, now = Date.now()): GameState | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    const x = v as Record<string, unknown>;
    if (x.version !== 1) return null;
    const s = createState(now); const validNumber = (n: unknown, max = 1e12): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max && Number.isInteger(n);
    for (const key of ['coins', 'xp', 'totalRolls', 'rebirths', 'potions', 'expeditionsDone', 'bossWins', 'dailyStreak'] as const) {
      if (!validNumber(x[key], key === 'rebirths' ? 1000 : 1e12)) return null; s[key] = x[key];
    }
    for (const key of ['pityEpic', 'pityMythic', 'boostUntil', 'bossCooldown'] as const) { if (!validNumber(x[key], 8.64e15)) return null; s[key] = x[key]; }
    if (s.pityEpic > 39 || s.pityMythic > 199) return null;
    const record = (o: unknown): o is Record<string, unknown> => !!o && typeof o === 'object' && !Array.isArray(o);
    if (!record(x.materials) || !record(x.upgrades) || !record(x.inventory) || !record(x.daily) || !record(x.settings) || !record(x.stats)) return null;
    for (const key of Object.keys(s.materials) as Material[]) { if (!validNumber(x.materials[key])) return null; s.materials[key] = x.materials[key]; }
    for (const u of UPGRADES) { const value = x.upgrades[u.id]; if (!validNumber(value, u.max)) return null; s.upgrades[u.id] = value; }
    if (Object.keys(x.inventory).some(id => !AURA_BY_ID[id])) return null;
    s.inventory = {}; for (const [id, count] of Object.entries(x.inventory)) { if (!validNumber(count) || count === 0) return null; s.inventory[id] = count; }
    if (x.equipped !== null && (typeof x.equipped !== 'string' || !AURA_BY_ID[x.equipped] || !s.inventory[x.equipped])) return null; s.equipped = x.equipped;
    const arrayOfIds = (v: unknown, allowed: readonly string[]): v is string[] => Array.isArray(v) && v.length <= allowed.length && new Set(v).size === v.length && v.every(id => typeof id === 'string' && allowed.includes(id));
    if (!arrayOfIds(x.crafted, RECIPES.map(r => r.id)) || !arrayOfIds(x.unlockedZones, ZONES.map(z => z.id)) || !x.unlockedZones.includes('astral') || !x.unlockedZones.includes(String(x.zone))) return null;
    s.crafted = x.crafted; s.unlockedZones = x.unlockedZones as ZoneId[]; s.zone = x.zone as ZoneId;
    if (!arrayOfIds(x.achievementsClaimed, ACHIEVEMENTS.map(a => a.id))) return null; s.achievementsClaimed = x.achievementsClaimed;
    const date = (v: unknown) => typeof v === 'string' && v.length < 25;
    if (!date(x.daily.date) || !date(x.dailyReward) || !arrayOfIds(x.daily.claimed, QUESTS.map(q => q.id))) return null;
    s.daily.date = x.daily.date as string; s.dailyReward = x.dailyReward as string; s.daily.claimed = x.daily.claimed;
    for (const key of ['rolls', 'discoveries', 'rares', 'expeditions'] as const) { if (!validNumber(x.daily[key])) return null; s.daily[key] = x.daily[key]; }
    for (const key of ['sound', 'reducedMotion', 'autoStop'] as const) { if (typeof x.settings[key] !== 'boolean') return null; s.settings[key] = x.settings[key]; }
    if (!validNumber(x.stats.totalEarned) || typeof x.stats.bestRarity !== 'number' || !Number.isInteger(x.stats.bestRarity) || x.stats.bestRarity < -1 || x.stats.bestRarity > 6) return null;
    s.stats = { bestRarity: x.stats.bestRarity, totalEarned: x.stats.totalEarned };
    if (x.expedition !== null) {
      if (!record(x.expedition) || !s.unlockedZones.includes(x.expedition.zone as ZoneId) || !validNumber(x.expedition.endsAt, 8.64e15)) return null;
      s.expedition = { zone: x.expedition.zone as ZoneId, endsAt: x.expedition.endsAt };
    }
    for (const key of ['favorites', 'contractsClaimed'] as const) {
      if (x[key] !== undefined) { const value = x[key]; if (!arrayOfIds(value, key === 'favorites' ? AURAS.map(a => a.id) : CONTRACTS.map(c => c.id))) return null; s[key] = value; }
    }
    for (const key of ['bossKills', 'bossCooldowns', 'zoneRolls'] as const) {
      if (x[key] !== undefined) {
        const value = x[key]; if (!record(value)) return null;
        for (const [id, count] of Object.entries(value)) { if (!(key === 'zoneRolls' ? ZONES.some(z => z.id === id) : BOSS_BY_ID[id]) || !validNumber(count, key === 'bossCooldowns' ? 8.64e15 : 1e12) || (key !== 'bossCooldowns' && count === 0)) return null; s[key][id] = count; }
      }
    }
    if (x.bossKills === undefined && s.bossWins > 0) s.bossKills[BOSSES[0].id] = s.bossWins;
    if (x.boss !== null) {
      if (!record(x.boss)) return null;
      const id = x.boss.id === undefined ? BOSSES[0].id : x.boss.id;
      if (typeof id !== 'string' || !BOSS_BY_ID[id]) return null;
      const maxHp = x.boss.maxHp ?? BOSS_BY_ID[id].hp, playerMaxHp = x.boss.playerMaxHp ?? 150;
      if (maxHp !== BOSS_BY_ID[id].hp || !validNumber(playerMaxHp, 1000000) || playerMaxHp < 150 || !validNumber(x.boss.hp, maxHp) || !validNumber(x.boss.playerHp, playerMaxHp) || !validNumber(x.boss.turn) || x.boss.hp === 0 || x.boss.playerHp === 0) return null;
      s.boss = { id, hp: x.boss.hp, maxHp, playerHp: x.boss.playerHp, playerMaxHp, turn: x.boss.turn };
    }
    if (Array.isArray(x.log)) s.log = x.log.filter((l): l is LogEntry => record(l) && typeof l.id === 'string' && l.id.length < 100 && validNumber(l.time, 8.64e15) && typeof l.text === 'string' && l.text.length < 500 && ['roll', 'quest', 'craft', 'world', 'boss'].includes(String(l.type))).slice(0, 60);
    return normalizeDaily(s, now);
  } catch { return null; }
}

export function bossIntent(s: GameState) {
  if (!s.boss) return '';
  const boss = BOSS_BY_ID[s.boss.id], b = s.boss;
  if (boss.style === 'bastion' && b.turn % 3 === 0) return 'Thiết giáp đang bật · Bùng nổ xuyên giáp';
  if (boss.style === 'regenerator' && (b.turn + 1) % 3 === 0) return 'Sắp hồi 3% máu nếu còn sống';
  if (boss.style === 'berserker' && b.hp <= b.maxHp / 2) return 'Cuồng nộ · Sát thương tăng 45%';
  if (boss.style === 'striker' && (b.turn + 1) % 3 === 0) return 'Sắp cuồng kích · Phòng thủ giảm sát thương';
  return 'Đòn tấn công thường đang được chuẩn bị';
}
