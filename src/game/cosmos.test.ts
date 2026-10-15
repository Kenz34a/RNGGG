import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, AURAS, AURA_BY_ID, BOSSES, CONTENT_COUNTS, CONTENT_TOTAL, CONTRACTS, EXPANSION_AURAS, RARITIES, RECIPES, THEMES, ZONES } from './data';
import { act, achievementProgress, auraProbabilities, bossIntent, createState, parseSave, roll } from './engine';
const NOW = new Date('2026-10-15T10:06:00Z').getTime();
const ready = () => { const s = createState(NOW); s.xp = 300000; s.coins = 5000000; s.materials = { dust: 100000, ore: 100000, crystal: 100000, essence: 100000 }; return s; };

describe('Cosmos catalogue integrity', () => {
  it('contains exactly 2000 distinct playable entries and 1500 additional auras', () => {
    expect(CONTENT_COUNTS).toEqual({ auras: 1556, zones: 30, relics: 120, contracts: 200, achievements: 64, bosses: 30 });
    expect(CONTENT_TOTAL).toBe(2000); expect(EXPANSION_AURAS).toHaveLength(1500);
    const entries = [...AURAS, ...ZONES, ...RECIPES, ...CONTRACTS, ...ACHIEVEMENTS, ...BOSSES];
    expect(new Set(entries.map(e => e.id)).size).toBe(2000);
    expect(new Set(AURAS.map(a => a.name)).size).toBe(1556);
  });
  it('provides 50 additional aura per world and a distinct effect profile per additional aura', () => {
    for (const theme of THEMES) expect(EXPANSION_AURAS.filter(a => a.affinity === theme.id)).toHaveLength(50);
    expect(new Set(EXPANSION_AURAS.map(a => JSON.stringify(a.effect))).size).toBe(1500);
    expect(new Set(EXPANSION_AURAS.map(a => a.effect.motif)).size).toBe(12);
    for (const a of AURAS) { expect(a.power).toBeGreaterThan(0); expect(a.effect.particles).toBeLessThanOrEqual(60); expect(a.effect.rings).toBeGreaterThan(0); expect(a.description.length).toBeGreaterThan(30); }
  });
  it('preserves all 56 original aura IDs and original world/relic/achievement IDs', () => {
    for (let r = 0; r < 7; r++) for (let i = 0; i < 8; i++) expect(AURA_BY_ID[`aura-${r}-${i}`]).toBeDefined();
    expect(ZONES.slice(0, 5).map(z => z.id)).toEqual(['astral', 'forest', 'frost', 'ember', 'void']);
    expect(RECIPES.slice(0, 6).map(r => r.id)).toEqual(['charm', 'lens', 'ring', 'blade', 'crown', 'heart']);
    expect(ACHIEVEMENTS.find(a => a.id === 'complete')?.target).toBe(56);
    expect(ACHIEVEMENTS.some(a => a.metric === 'collection' && a.target === 1556)).toBe(true);
  });
  it('connects all recipes and bosses to real zones, and all progress targets are attainable', () => {
    for (const r of RECIPES) { if (r.zone) expect(ZONES.some(z => z.id === r.zone)).toBe(true); expect(r.coins).toBeGreaterThan(0); for (const cost of Object.values(r.cost)) expect(cost).toBeGreaterThan(0); }
    for (const b of BOSSES) { expect(ZONES.some(z => z.id === b.zone)).toBe(true); expect(b.hp).toBeGreaterThan(0); }
    for (const c of CONTRACTS) { expect(c.target).toBeGreaterThan(0); if (c.metric === 'collection') expect(c.target).toBeLessThanOrEqual(AURAS.length); if (c.metric === 'uniqueBosses') expect(c.target).toBeLessThanOrEqual(BOSSES.length); }
  });
});
describe('expanded RNG', () => {
  it('preserves base rarity odds despite different numbers of aura per tier', () => {
    const probabilities = auraProbabilities(createState(NOW), NOW);
    expect(probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    RARITIES.forEach((r, i) => expect(probabilities.reduce((sum, p, n) => sum + (AURAS[n].rarity === i ? p : 0), 0)).toBeCloseTo(r.weight / 100, 12));
  });
  it('can actually award every one of the 1556 aura', () => {
    const s = createState(NOW), probabilities = auraProbabilities(s, NOW); let cumulative = 0;
    for (let i = 0; i < AURAS.length; i++) { const sample = cumulative + probabilities[i] / 2; expect(roll(s, 1, NOW, () => sample).results[0].auraId).toBe(AURAS[i].id); cumulative += probabilities[i]; }
  });
  it('tracks zone mastery across batches and keeps pity guarantees', () => {
    const s = createState(NOW); s.totalRolls = 50; s.zone = 'forest'; s.unlockedZones.push('forest'); s.pityMythic = 199;
    const next = roll(s, 10, NOW, () => 0);
    expect(AURA_BY_ID[next.results[0].auraId].rarity).toBe(5); expect(next.state.zoneRolls.forest).toBe(10);
    expect(achievementProgress(next.state, 'zoneMastery')).toBe(10);
  });
});
describe('contracts and collection utilities', () => {
  it('awards permanent contracts only when earned and only once', () => {
    const s = createState(NOW), c = CONTRACTS[0]; expect(act(s, { type: 'contract', id: c.id }, NOW).ok).toBe(false);
    s.totalRolls = c.target; const done = act(s, { type: 'contract', id: c.id }, NOW);
    expect(done.ok).toBe(true); expect(done.state.coins).toBe(s.coins + c.coins); expect(done.state.contractsClaimed).toContain(c.id);
    expect(act(done.state, { type: 'contract', id: c.id }, NOW).ok).toBe(false);
    expect(parseSave(JSON.stringify(done.state), NOW + 86400000)?.contractsClaimed).toContain(c.id);
  });
  it('bulk claims a snapshot of eligible contracts without duplicates or paying twice', () => {
    const s = createState(NOW); s.totalRolls = 1000;
    const eligible = CONTRACTS.filter(c => achievementProgress(s, c.metric) >= c.target);
    const done = act(s, { type: 'claimAllContracts' }, NOW);
    expect(done.state.contractsClaimed).toHaveLength(eligible.length); expect(new Set(done.state.contractsClaimed).size).toBe(eligible.length);
    expect(done.state.coins).toBe(s.coins + eligible.reduce((n, c) => n + c.coins, 0));
    const again = act(done.state, { type: 'claimAllContracts' }, NOW); for (const id of done.state.contractsClaimed) expect(again.state.contractsClaimed.filter(c => c === id)).toHaveLength(1);
  });
  it('favorites undiscovered aura, equips the most powerful owned aura, and salvages only duplicates', () => {
    const s = createState(NOW), target = EXPANSION_AURAS[49]; let next = act(s, { type: 'favorite', id: target.id }, NOW).state;
    expect(next.favorites).toContain(target.id); expect(next.inventory).toEqual({});
    next.inventory = { 'aura-0-0': 4, [target.id]: 2 }; next = act(next, { type: 'equipBest' }, NOW).state; expect(next.equipped).toBe(target.id);
    const dust = next.materials.dust; next = act(next, { type: 'salvageAll' }, NOW).state;
    expect(next.inventory).toEqual({ 'aura-0-0': 1, [target.id]: 1 }); expect(next.materials.dust).toBe(dust + 12 + (target.rarity + 1) * 4);
    expect(next.favorites).toContain(target.id); expect(act(next, { type: 'salvageAll' }, NOW).ok).toBe(false);
    expect(act(next, { type: 'favorite', id: target.id }, NOW).state.favorites).toEqual([]);
  });
  it('requires the listed level and region to craft expansion relics', () => {
    const r = RECIPES.find(r => r.zone === 'ocean')!, s = ready();
    expect(act(s, { type: 'craft', id: r.id }, NOW).ok).toBe(false);
    const unlocked = act(s, { type: 'zone', id: 'ocean' }, NOW).state;
    expect(act(unlocked, { type: 'craft', id: r.id }, NOW).ok).toBe(true);
  });
});
describe('thirty bosses', () => {
  it('enforces each boss region and gives independent recovery timers and correct rewards', () => {
    const s = ready(); s.crafted = RECIPES.map(r => r.id); s.unlockedZones = ZONES.map(z => z.id);
    for (const boss of BOSSES) {
      let battle = act(s, { type: 'bossStart', id: boss.id }, NOW).state; let turn = 0;
      while (battle.boss && turn++ < 100) battle = act(battle, { type: 'bossAttack', style: battle.boss.turn % 3 === 2 ? 'burst' : 'attack' }, NOW, () => 1).state;
      expect(battle.bossWins, boss.name).toBe(1); expect(battle.bossKills[boss.id], boss.name).toBe(1);
      expect(battle.coins).toBe(s.coins + boss.coins); expect(act(battle, { type: 'bossStart', id: boss.id }, NOW).ok).toBe(false);
      const other = BOSSES.find(b => b.id !== boss.id)!; expect(act(battle, { type: 'bossStart', id: other.id }, NOW).ok).toBe(true);
    }
    expect(act(createState(NOW), { type: 'bossStart', id: BOSSES[29].id }, NOW).ok).toBe(false);
  });
  it('telegraphs armored turns and lets burst penetrate armor', () => {
    const s = ready(); s.unlockedZones.push('frost'); s.inventory['aura-3-0'] = 1; s.equipped = 'aura-3-0';
    const b = act(s, { type: 'bossStart', id: BOSSES[2].id }, NOW).state;
    expect(bossIntent(b)).toContain('Thiết giáp');
    const guarded = act(b, { type: 'bossAttack', style: 'attack' }, NOW, () => 0).state;
    b.boss!.turn = 1; const exposed = act(b, { type: 'bossAttack', style: 'attack' }, NOW, () => 0).state;
    expect(b.boss!.hp - guarded.boss!.hp).toBeLessThan(b.boss!.hp - exposed.boss!.hp);
    b.boss!.turn = 2; expect(act(b, { type: 'bossAttack', style: 'burst' }, NOW, () => 0).ok).toBe(true);
  });
  it('reports damage and regeneration separately so combat feedback stays accurate', () => {
    const s = ready(); s.unlockedZones.push('ember');
    const b = act(s, { type: 'bossStart', id: BOSSES[3].id }, NOW).state;
    b.boss!.hp = 500; b.boss!.turn = 2;
    const result = act(b, { type: 'bossAttack', style: 'burst' }, NOW, () => 0);
    expect(result.combat?.healed).toBe(Math.round(BOSSES[3].hp * .03));
    expect(result.combat?.incoming).toBe(BOSSES[3].damage);
    expect(result.state.boss!.hp).toBe(500 - result.combat!.damage + result.combat!.healed);
  });
});
describe('backward-compatible persistence', () => {
  it('restores a real v1 shape including an active legacy boss', () => {
    const old = JSON.parse(JSON.stringify(createState(NOW)));
    for (const key of ['favorites', 'contractsClaimed', 'bossKills', 'bossCooldowns', 'zoneRolls']) delete old[key];
    old.inventory = { 'aura-3-0': 2 }; old.equipped = 'aura-3-0'; old.coins = 1700; old.bossWins = 2;
    old.boss = { hp: 300, playerHp: 111, turn: 2 };
    const restored = parseSave(JSON.stringify(old), NOW)!;
    expect(restored).not.toBeNull(); expect(restored.inventory).toEqual(old.inventory); expect(restored.coins).toBe(1700);
    expect(restored.favorites).toEqual([]); expect(restored.contractsClaimed).toEqual([]); expect(restored.bossKills[BOSSES[0].id]).toBe(2);
    expect(restored.boss).toEqual({ id: BOSSES[0].id, hp: 300, maxHp: 360, playerHp: 111, playerMaxHp: 150, turn: 2 });
    expect(act(restored, { type: 'bossAttack', style: 'guard' }, NOW, () => 0).ok).toBe(true);
  });
  it('round trips a full endgame save and rejects unknown IDs and prototype keys', () => {
    const s = ready(); s.inventory = Object.fromEntries(AURAS.map(a => [a.id, 2])); s.favorites = AURAS.map(a => a.id); s.unlockedZones = ZONES.map(z => z.id); s.crafted = RECIPES.map(r => r.id); s.contractsClaimed = CONTRACTS.map(c => c.id); s.bossKills = Object.fromEntries(BOSSES.map(b => [b.id, 1]));
    expect(parseSave(JSON.stringify(s), NOW)).toEqual(s);
    for (const patch of [{ favorites: ['missing'] }, { contractsClaimed: ['missing'] }, { zoneRolls: { nowhere: 10 } }, { bossKills: { nonexistent: 2 } }, { inventory: JSON.parse('{"__proto__":2}') }, { bossKills: JSON.parse('{"constructor":1}') }]) expect(parseSave(JSON.stringify({ ...s, ...patch }), NOW)).toBeNull();
  });
});
