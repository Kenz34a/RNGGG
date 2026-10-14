import { describe, expect, it } from 'vitest';
import { AURAS, RECIPES, ZONES } from './data';
import { act, achievementProgress, auraProbabilities, createState, dayKey, eventActive, levelOf, luckOf, normalizeDaily, parseSave, powerOf, roll, rollDuration, upgradeCost, type GameState } from './engine';

const NOW = new Date('2026-10-15T10:06:00Z').getTime();
function ready(): GameState { const s = createState(NOW); s.coins = 100000; s.xp = 20000; s.materials = { dust: 1000, ore: 1000, crystal: 1000, essence: 1000 }; return s; }
const json = (s: GameState) => JSON.stringify(s);

describe('RNG and progression', () => {
  it('has 56 unique aura IDs, 7 complete rarity tiers, and 5 worlds', () => {
    expect(AURAS).toHaveLength(56); expect(new Set(AURAS.map(a => a.id)).size).toBe(56);
    for (let r = 0; r < 7; r++) expect(AURAS.filter(a => a.rarity === r)).toHaveLength(8);
    expect(ZONES).toHaveLength(5);
  });
  it('normalizes probabilities and increases rare-tier odds with luck', () => {
    const s = createState(NOW), plain = auraProbabilities(s, NOW); s.upgrades.luck = 5;
    const boosted = auraProbabilities(s, NOW);
    expect(plain.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(boosted.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(boosted.slice(40).reduce((a, b) => a + b, 0)).toBeGreaterThan(plain.slice(40).reduce((a, b) => a + b, 0));
  });
  it('awards free rolls, currencies, XP, new discoveries and equips the first aura', () => {
    const s = createState(NOW), result = roll(s, 1, NOW, () => 0);
    expect(result.state.totalRolls).toBe(1); expect(result.state.coins).toBe(358); expect(result.state.xp).toBe(8);
    expect(result.state.inventory['aura-0-0']).toBe(1); expect(result.state.equipped).toBe('aura-0-0'); expect(result.results[0].isNew).toBe(true);
    expect(s.inventory).toEqual({});
  });
  it('does not mark duplicate rolls as new discoveries', () => {
    let s = roll(createState(NOW), 1, NOW, () => 0).state;
    const duplicate = roll(s, 1, NOW, () => 0); s = duplicate.state;
    expect(duplicate.results[0].isNew).toBe(false); expect(s.inventory['aura-0-0']).toBe(2); expect(s.daily.discoveries).toBe(1);
  });
  it('guarantees epic+ on the 40th dry roll and resets that pity counter', () => {
    let s = createState(NOW); for (let i = 0; i < 39; i++) s = roll(s, 1, NOW, () => 0).state;
    expect(s.pityEpic).toBe(39); const next = roll(s, 1, NOW, () => 0);
    expect(AURAS.find(a => a.id === next.results[0].auraId)!.rarity).toBe(3);
    expect(next.results[0].guaranteed).toBe(true); expect(next.state.pityEpic).toBe(0);
  });
  it('guarantees mythic+ on the 200th dry roll even with epic pity', () => {
    let s = createState(NOW); for (let i = 0; i < 199; i++) s = roll(s, 1, NOW, () => 0).state;
    expect(s.pityMythic).toBe(199); const next = roll(s, 1, NOW, () => 0);
    expect(AURAS.find(a => a.id === next.results[0].auraId)!.rarity).toBe(5);
    expect(next.state.pityMythic).toBe(0); expect(next.state.pityEpic).toBe(0);
  });
  it('processes batch pity sequentially and enforces the batch unlock', () => {
    const fresh = createState(NOW); expect(roll(fresh, 10, NOW, () => 0).results).toHaveLength(1);
    fresh.totalRolls = 50; fresh.pityEpic = 38; const batch = roll(fresh, 10, NOW, () => 0);
    expect(batch.results).toHaveLength(10); expect(batch.state.totalRolls).toBe(60);
    expect(AURAS.find(a => a.id === batch.results[1].auraId)!.rarity).toBe(3);
  });
  it('covers the lower and upper ends of the random range', () => {
    expect(roll(createState(NOW), 1, NOW, () => 0).results[0].auraId).toBe(AURAS[0].id);
    expect(roll(createState(NOW), 1, NOW, () => 1).results[0].auraId).toBe(AURAS[55].id);
  });
  it('adds zone resonance to matching aura probabilities', () => {
    const s = createState(NOW); s.zone = 'forest'; const p = auraProbabilities(s, NOW);
    expect(p[1] / p[0]).toBeCloseTo(2);
  });
  it('grows levels and bounds upgrade speed', () => {
    expect(levelOf(0)).toBe(1); expect(levelOf(260)).toBe(3);
    const s = createState(NOW); s.upgrades.speed = 10; expect(rollDuration(s)).toBe(360);
  });
});

describe('economy, goals and exploration', () => {
  it('charges exact upgrade costs, raises future prices, and refuses overdrafts/max levels', () => {
    const s = createState(NOW), price = upgradeCost(s, 'luck'), next = act(s, { type: 'upgrade', id: 'luck' }, NOW);
    expect(next.ok).toBe(true); expect(next.state.coins).toBe(s.coins - price); expect(upgradeCost(next.state, 'luck')).toBeGreaterThan(price);
    expect(act(next.state, { type: 'upgrade', id: 'luck' }, NOW).ok).toBe(false);
    const max = ready(); max.upgrades.luck = 15; expect(act(max, { type: 'upgrade', id: 'luck' }, NOW).ok).toBe(false);
  });
  it('requires materials for crafting and applies each relic once', () => {
    expect(act(createState(NOW), { type: 'craft', id: 'charm' }, NOW).ok).toBe(false);
    const s = ready(), next = act(s, { type: 'craft', id: 'charm' }, NOW);
    expect(next.ok).toBe(true); expect(next.state.materials.dust).toBe(965); expect(next.state.coins).toBe(99850);
    expect(luckOf(next.state, NOW) - luckOf(s, NOW)).toBeCloseTo(RECIPES[0].luck);
    expect(act(next.state, { type: 'craft', id: 'charm' }, NOW).ok).toBe(false);
  });
  it('keeps the last copy when salvaging, including an equipped aura', () => {
    const s = createState(NOW); s.inventory['aura-2-0'] = 4; s.equipped = 'aura-2-0';
    const next = act(s, { type: 'salvage', id: 'aura-2-0' }, NOW);
    expect(next.state.inventory['aura-2-0']).toBe(1); expect(next.state.materials.dust).toBe(56);
    expect(next.state.equipped).toBe('aura-2-0'); expect(act(next.state, { type: 'salvage', id: 'aura-2-0' }, NOW).ok).toBe(false);
  });
  it('blocks unowned equipment and locked worlds, charges world unlock only once', () => {
    expect(act(createState(NOW), { type: 'equip', id: 'aura-6-0' }, NOW).ok).toBe(false);
    expect(act(createState(NOW), { type: 'zone', id: 'forest' }, NOW).ok).toBe(false);
    const s = ready(), next = act(s, { type: 'zone', id: 'forest' }, NOW);
    expect(next.state.coins).toBe(s.coins - 500); expect(next.state.zone).toBe('forest');
    expect(act(next.state, { type: 'zone', id: 'forest' }, NOW).state.coins).toBe(next.state.coins);
  });
  it('supports an expedition across reload, rejects early and duplicate claims', () => {
    const s = createState(NOW), started = act(s, { type: 'expedition', id: 'astral' }, NOW).state;
    expect(act(started, { type: 'expeditionClaim' }, NOW + 59000).ok).toBe(false);
    expect(act(started, { type: 'expedition', id: 'astral' }, NOW).ok).toBe(false);
    const restored = parseSave(json(started), NOW + 61000)!; expect(restored).not.toBeNull();
    const done = act(restored, { type: 'expeditionClaim' }, NOW + 61000);
    expect(done.ok).toBe(true); expect(done.state.materials.dust).toBe(65); expect(done.state.daily.expeditions).toBe(1);
    expect(act(done.state, { type: 'expeditionClaim' }, NOW + 61000).ok).toBe(false);
  });
  it('makes daily quest rewards claimable only after completion and once', () => {
    const s = createState(NOW); expect(act(s, { type: 'quest', id: 'daily-roll' }, NOW).ok).toBe(false);
    s.daily.rolls = 30; const done = act(s, { type: 'quest', id: 'daily-roll' }, NOW);
    expect(done.state.coins).toBe(700); expect(act(done.state, { type: 'quest', id: 'daily-roll' }, NOW).ok).toBe(false);
  });
  it('resets only daily counters on date changes', () => {
    const s = ready(); s.daily.rolls = 12; s.daily.claimed = ['daily-roll']; s.totalRolls = 99;
    const next = normalizeDaily(s, NOW + 86400000);
    expect(next.daily.rolls).toBe(0); expect(next.daily.claimed).toEqual([]); expect(next.totalRolls).toBe(99); expect(next.coins).toBe(s.coins);
  });
  it('handles one daily gift per day, consecutive streaks and a missed day', () => {
    const day1 = act(createState(NOW), { type: 'dailyReward' }, NOW).state;
    expect(day1.dailyStreak).toBe(1); expect(day1.coins).toBe(650); expect(day1.dailyReward).toBe(dayKey(NOW));
    expect(act(day1, { type: 'dailyReward' }, NOW).ok).toBe(false);
    const day2 = act(day1, { type: 'dailyReward' }, NOW + 86400000).state; expect(day2.dailyStreak).toBe(2);
    expect(act(day2, { type: 'dailyReward' }, NOW + 3 * 86400000).state.dailyStreak).toBe(1);
  });
  it('stacks potion duration, expires boosts, and never uses negative quantities', () => {
    const s = createState(NOW); const once = act(s, { type: 'potion' }, NOW).state; const twice = act(once, { type: 'potion' }, NOW).state;
    expect(twice.boostUntil).toBe(NOW + 240000); expect(twice.potions).toBe(0);
    expect(luckOf(once, NOW) - luckOf(s, NOW)).toBeCloseTo(1.5);
    expect(luckOf(twice, NOW + 240001)).toBe(luckOf(s, NOW + 240001));
    expect(act(twice, { type: 'potion' }, NOW).ok).toBe(false);
  });
  it('runs meteor events for 5 minutes out of every 15', () => {
    expect(eventActive(0)).toBe(true); expect(eventActive(299000)).toBe(true); expect(eventActive(300000)).toBe(false); expect(eventActive(900000)).toBe(true);
  });
  it('prevents achievement reward duplication', () => {
    const s = roll(createState(NOW), 1, NOW, () => 0).state;
    expect(achievementProgress(s, 'rolls')).toBe(1); const claimed = act(s, { type: 'achievement', id: 'first' }, NOW);
    expect(claimed.state.coins).toBe(s.coins + 100); expect(claimed.state.potions).toBe(3);
    expect(act(claimed.state, { type: 'achievement', id: 'first' }, NOW).ok).toBe(false);
  });
});

describe('combat and rebirth', () => {
  it('blocks low-level boss access and gates burst to its proper turns', () => {
    expect(act(createState(NOW), { type: 'bossStart' }, NOW).ok).toBe(false);
    const s = act(ready(), { type: 'bossStart' }, NOW).state;
    expect(act(s, { type: 'bossAttack', style: 'burst' }, NOW).ok).toBe(false);
    let next = act(s, { type: 'bossAttack', style: 'guard' }, NOW, () => 0).state;
    next = act(next, { type: 'bossAttack', style: 'guard' }, NOW, () => 0).state;
    expect(act(next, { type: 'bossAttack', style: 'burst' }, NOW, () => 0).ok).toBe(true);
  });
  it('uses defensive damage reduction and awards exactly one boss victory', () => {
    const started = act(ready(), { type: 'bossStart' }, NOW).state;
    const attacked = act(started, { type: 'bossAttack', style: 'attack' }, NOW, () => 0).state;
    const guarded = act(started, { type: 'bossAttack', style: 'guard' }, NOW, () => 0).state;
    expect(guarded.boss!.playerHp).toBeGreaterThan(attacked.boss!.playerHp);
    const strong = ready(); strong.inventory['aura-6-0'] = 1; strong.equipped = 'aura-6-0'; strong.crafted = RECIPES.map(r => r.id);
    expect(powerOf(strong)).toBeGreaterThan(400);
    const battle = act(strong, { type: 'bossStart' }, NOW).state, won = act(battle, { type: 'bossAttack', style: 'attack' }, NOW, () => 1).state;
    expect(won.boss).toBeNull(); expect(won.bossWins).toBe(1); expect(won.coins).toBe(strong.coins + 1600);
    expect(act(won, { type: 'bossAttack', style: 'attack' }, NOW).ok).toBe(false); expect(act(won, { type: 'bossStart' }, NOW).ok).toBe(false);
  });
  it('ends a losing battle and enforces the recovery cooldown', () => {
    const s = ready(); s.xp = 260; const b = act(s, { type: 'bossStart' }, NOW).state; b.boss!.playerHp = 1;
    const lost = act(b, { type: 'bossAttack', style: 'attack' }, NOW, () => 0).state;
    expect(lost.boss).toBeNull(); expect(lost.bossWins).toBe(0); expect(lost.bossCooldown).toBe(NOW + 30000);
  });
  it('requires rebirth milestones and preserves collectibles, zones and relics', () => {
    expect(act(createState(NOW), { type: 'rebirth' }, NOW).ok).toBe(false);
    const s = ready(); s.totalRolls = 500; s.inventory['aura-3-0'] = 1; s.equipped = 'aura-3-0'; s.crafted = ['charm']; s.upgrades.luck = 3;
    const next = act(s, { type: 'rebirth' }, NOW);
    expect(next.ok).toBe(true); expect(next.state.rebirths).toBe(1); expect(next.state.xp).toBe(0); expect(next.state.upgrades.luck).toBe(0);
    expect(next.state.inventory).toEqual(s.inventory); expect(next.state.crafted).toEqual(s.crafted); expect(next.state.coins).toBe(85000);
  });
});

describe('save validation', () => {
  it('round trips a live state with timestamps, active expedition, potion and battle', () => {
    let s = act(ready(), { type: 'expedition', id: 'astral' }, NOW).state; s = act(s, { type: 'potion' }, NOW).state;
    s = roll(s, 1, NOW, () => .99).state; s = act(s, { type: 'bossStart' }, NOW).state;
    expect(parseSave(json(s), NOW)).toEqual(s);
  });
  it('rejects malformed data, non-finite/negative currency, unknown IDs and missing fields', () => {
    expect(parseSave('{bad')).toBeNull(); expect(parseSave('null')).toBeNull(); expect(parseSave('[]')).toBeNull();
    const s = createState(NOW);
    for (const invalid of [{ ...s, coins: -1 }, { ...s, coins: '99' }, { ...s, xp: 1.5 }, { ...s, inventory: { hacked: 99 } }, { ...s, equipped: 'aura-6-0' }, { ...s, pityEpic: 40 }, { ...s, upgrades: { ...s.upgrades, speed: 999 } }, { ...s, unlockedZones: ['void'], zone: 'void' }, { ...s, crafted: ['charm', 'charm'] }, { ...s, settings: {} }, { ...s, boss: {} }, { ...s, expedition: { zone: 'void', endsAt: NOW } }]) expect(parseSave(JSON.stringify(invalid), NOW)).toBeNull();
  });
  it('expires daily progress while restoring permanent progress', () => {
    const s = ready(); s.daily.rolls = 20; s.totalRolls = 20;
    const restored = parseSave(json(s), NOW + 86400000)!; expect(restored.daily.rolls).toBe(0); expect(restored.totalRolls).toBe(20);
  });
});
