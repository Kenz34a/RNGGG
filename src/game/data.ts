import { THEMES, effectFor, type EffectProfile, type ZoneId } from './themes';
export { THEMES, EFFECT_NAMES, type EffectProfile, type ZoneId } from './themes';
export const RARITIES = [
  { id: 'common', name: 'Thường', color: '#a3bac5', weight: 48, value: 8 },
  { id: 'uncommon', name: 'Độc đáo', color: '#94e6bc', weight: 27, value: 16 },
  { id: 'rare', name: 'Hiếm', color: '#76bdff', weight: 15, value: 32 },
  { id: 'epic', name: 'Sử thi', color: '#b29aff', weight: 6.8, value: 70 },
  { id: 'legendary', name: 'Huyền thoại', color: '#f9c777', weight: 2.55, value: 150 },
  { id: 'mythic', name: 'Thần thoại', color: '#ff94be', weight: .55, value: 360 },
  { id: 'celestial', name: 'Thiên giới', color: '#b9fff2', weight: .1, value: 1200 },
] as const;

const BASE_ZONES = [
  { id: 'astral', name: 'Vườn tinh tú', sub: 'Nơi mọi hành trình bắt đầu', icon: 'orbit', color: '#95e6c0', level: 1, cost: 0, luck: 0, description: 'Những hạt ánh sáng trôi giữa một khu vườn bất tận. Tất cả aura đều có thể xuất hiện tại đây.', expedition: 'dust', duration: 60, reward: 45 },
  { id: 'forest', name: 'Rừng linh hồn', sub: 'Tiếng thì thầm của sự sống', icon: 'tree', color: '#79dd9e', level: 3, cost: 500, luck: .15, description: 'Cây cổ thụ lưu giữ ký ức của các vì sao. Aura hệ sinh mệnh có tần suất xuất hiện cao hơn.', expedition: 'ore', duration: 90, reward: 8 },
  { id: 'frost', name: 'Miền băng vĩnh cửu', sub: 'Vẻ đẹp sau màn cực quang', icon: 'snow', color: '#8dcaff', level: 5, cost: 1400, luck: .3, description: 'Cực quang đóng băng thời gian. Những aura hệ băng và ánh sáng đang chờ người tìm thấy.', expedition: 'crystal', duration: 120, reward: 6 },
  { id: 'ember', name: 'Tàn tích mặt trời', sub: 'Ngọn lửa chưa từng tắt', icon: 'flame', color: '#f6b377', level: 8, cost: 3500, luck: .5, description: 'Một nền văn minh đã mất, một mặt trời còn cháy. Aura hệ lửa hội tụ giữa những tàn tích.', expedition: 'ore', duration: 150, reward: 20 },
  { id: 'void', name: 'Vực thẳm hư không', sub: 'Phía bên kia của thực tại', icon: 'moon', color: '#b5a0fa', level: 12, cost: 8000, luck: .8, description: 'Mọi định luật tan biến ở rìa thiên hà. Aura hư không và những bí mật hiếm nhất đang thức giấc.', expedition: 'essence', duration: 180, reward: 3 },
] as const;
export interface Zone { id: ZoneId; name: string; sub: string; icon: string; color: string; level: number; cost: number; luck: number; description: string; expedition: Material; duration: number; reward: number }
export const ZONES: Zone[] = [...BASE_ZONES, ...THEMES.slice(5).map((t, i) => ({
  id: t.id, name: t.world, sub: t.name, icon: t.icon, color: t.color, level: 14 + i * 2,
  cost: 10000 + i * 2800 + i * i * 220, luck: Math.round((.9 + i * .12) * 100) / 100,
  description: `${t.lore} Aura hệ ${t.name} cộng hưởng mạnh tại đây.`, expedition: (['dust', 'ore', 'crystal', 'essence'] as const)[i % 4], duration: 120 + i * 10, reward: [80, 24, 15, 5][i % 4] + Math.floor(i / 4) * 2,
}))];
export type Material = 'dust' | 'ore' | 'crystal' | 'essence';
export const MATERIALS: Record<Material, { name: string; color: string }> = {
  dust: { name: 'Bụi sao', color: '#bca7fa' }, ore: { name: 'Quặng tinh tú', color: '#f2be83' },
  crystal: { name: 'Tinh thể', color: '#8dccf2' }, essence: { name: 'Tinh chất', color: '#ff9dbb' },
};
const names = [
  ['Tia sáng', 'Giọt sương', 'Bông tuyết', 'Tàn lửa', 'Bóng mờ', 'Gió nhẹ', 'Đom đóm', 'Sương mai'],
  ['Ánh trăng', 'Mầm sống', 'Thạch băng', 'Hổ phách', 'Nhật thực', 'Sao lạc', 'Lá ngọc', 'Lam ngọc'],
  ['Tinh vân', 'Linh mộc', 'Bắc cực quang', 'Hỏa điểu', 'Bóng đêm', 'Thủy tinh', 'Cỏ bốn lá', 'Kim cương'],
  ['Ngân hà', 'Tiên rừng', 'Băng phách', 'Phượng hoàng', 'Hư ảnh', 'Ngôi sao đôi', 'Cổ thụ', 'Thiên thanh'],
  ['Tinh vương', 'Thần mộc', 'Băng long', 'Nhật vương', 'Hắc long', 'Siêu tân tinh', 'Vĩnh sinh', 'Thánh quang'],
  ['Thiên mệnh', 'Yggdrasil', 'Vương miện cực quang', 'Mặt trời bất diệt', 'Hố đen', 'Andromeda', 'Nguồn cội', 'Hằng hà'],
  ['Khởi nguyên', 'Cây thế giới', 'Thời gian vĩnh hằng', 'Kẻ sáng tạo', 'Vô cực', 'Thiên hà thất lạc', 'Bản giao hưởng sự sống', 'ASTRA'],
];
const glyphs = ['✧', '❋', '❄', '✺', '☾', '✦', '❈', '◈'];
const colors = ['#b8efd9', '#93e8ae', '#9acdf9', '#f4be84', '#b5a0f5', '#c1b0ff', '#acd79c', '#97e0e4'];
export interface Aura { id: string; name: string; rarity: number; affinity: ZoneId; color: string; glyph: string; description: string; effect: EffectProfile; family: string; power: number }
const LEGACY_AURAS: Aura[] = names.flatMap((group, rarity) => group.map((name, i) => ({
  effect: effectFor(1500 + rarity * 8 + i, THEMES[i % 5], rarity), family: THEMES[i % 5].name, power: [3, 8, 18, 35, 65, 110, 180][rarity],
  id: `aura-${rarity}-${i}`, name, rarity, affinity: ZONES[i % 5].id, color: colors[i], glyph: glyphs[i],
  description: `${name} mang theo ${['một tia hy vọng nhỏ bé', 'nhịp thở của thiên nhiên', 'ký ức từ một vì sao xa', 'sức mạnh vượt khỏi tưởng tượng', 'dấu ấn của những vị thần', 'bí mật viết trước khi vũ trụ ra đời', 'quyền năng khai sinh một thực tại mới'][rarity]}. ${ZONES[i % 5].sub}.`,
})));

export const UPGRADES = [
  { id: 'luck', name: 'La bàn vận mệnh', description: 'Tăng may mắn +0,2 mỗi cấp', icon: 'clover', color: '#9ce3bc', base: 220, max: 15 },
  { id: 'speed', name: 'Động cơ lượng tử', description: 'Giảm thời gian quay 8% mỗi cấp', icon: 'zap', color: '#f4d18a', base: 300, max: 10 },
  { id: 'income', name: 'Máy gom ánh sao', description: 'Tăng vàng từ mỗi lượt quay 15%', icon: 'coins', color: '#edb683', base: 250, max: 12 },
] as const;
export type UpgradeId = typeof UPGRADES[number]['id'];
const LEGACY_RECIPES: Recipe[] = [
  { id: 'charm', name: 'Bùa cỏ bốn lá', description: 'Một điều ước nhỏ. May mắn +0,25.', glyph: '❈', color: '#a8edb5', cost: { dust: 35 }, coins: 150, luck: .25, power: 5 },
  { id: 'lens', name: 'Thấu kính tinh tú', description: 'Nhìn sâu vào màn đêm. May mắn +0,4.', glyph: '◈', color: '#97cbf5', cost: { dust: 80, ore: 5 }, coins: 500, luck: .4, power: 12 },
  { id: 'ring', name: 'Nhẫn ngân hà', description: 'Một quỹ đạo quanh ngón tay. May mắn +0,5.', glyph: '◎', color: '#c5a7f3', cost: { dust: 120, crystal: 8 }, coins: 1000, luck: .5, power: 20 },
  { id: 'blade', name: 'Lưỡi kiếm bình minh', description: 'Sức mạnh chiến đấu +45. May mắn +0,2.', glyph: '✧', color: '#f5c284', cost: { ore: 25, crystal: 10 }, coins: 1800, luck: .2, power: 45 },
  { id: 'crown', name: 'Vương miện thiên hà', description: 'Cổ vật của tinh vương. May mắn +1.', glyph: '♔', color: '#f2d398', cost: { crystal: 35, essence: 3, dust: 250 }, coins: 4000, luck: 1, power: 50 },
  { id: 'heart', name: 'Trái tim hư không', description: 'Giữ một hố đen trong tay. May mắn +1,5.', glyph: '✺', color: '#e09eb9', cost: { essence: 12, crystal: 50, ore: 50 }, coins: 8000, luck: 1.5, power: 100 },
];

export const QUESTS = [
  { id: 'daily-roll', name: 'Lắng nghe những vì sao', description: 'Quay 30 lần trong hôm nay', target: 30, metric: 'rolls', coins: 350, dust: 25, xp: 100 },
  { id: 'daily-discover', name: 'Nhà sưu tập', description: 'Tìm 3 aura mới trong hôm nay', target: 3, metric: 'discoveries', coins: 450, dust: 35, xp: 140 },
  { id: 'daily-rare', name: 'Một chút phi thường', description: 'Nhận 5 aura Hiếm trở lên', target: 5, metric: 'rares', coins: 600, dust: 40, xp: 200 },
  { id: 'daily-expedition', name: 'Dấu chân giữa ngân hà', description: 'Hoàn thành 2 chuyến thám hiểm', target: 2, metric: 'expeditions', coins: 500, dust: 30, xp: 180 },
] as const;
const LEGACY_ACHIEVEMENTS: Achievement[] = [
  { id: 'first', name: 'Tín hiệu đầu tiên', description: 'Thực hiện lượt quay đầu tiên', glyph: '✧', target: 1, metric: 'rolls', coins: 100 },
  { id: 'collector', name: 'Nhà lưu trữ', description: 'Khám phá 10 aura khác nhau', glyph: '◈', target: 10, metric: 'collection', coins: 400 },
  { id: 'hundred', name: 'Chạm tới những vì sao', description: 'Thực hiện 100 lượt quay', glyph: '✦', target: 100, metric: 'rolls', coins: 600 },
  { id: 'epic', name: 'Câu chuyện sử thi', description: 'Tìm một aura Sử thi trở lên', glyph: '❋', target: 3, metric: 'rarity', coins: 500 },
  { id: 'legend', name: 'Một huyền thoại mới', description: 'Tìm một aura Huyền thoại trở lên', glyph: '♔', target: 4, metric: 'rarity', coins: 1000 },
  { id: 'traveler', name: 'Người đi qua thế giới', description: 'Mở khóa 3 vùng', glyph: '◎', target: 3, metric: 'zones', coins: 1200 },
  { id: 'smith', name: 'Nghệ nhân ánh sao', description: 'Chế tạo 3 cổ vật', glyph: '⚒', target: 3, metric: 'crafted', coins: 1000 },
  { id: 'hunter', name: 'Người bảo vệ thiên hà', description: 'Đánh bại boss lần đầu', glyph: '✺', target: 1, metric: 'bosses', coins: 1500 },
  { id: 'thousand', name: 'Không ngừng mơ ước', description: 'Thực hiện 1.000 lượt quay', glyph: '∞', target: 1000, metric: 'rolls', coins: 3000 },
  { id: 'complete', name: 'Bản đồ của vũ trụ', description: 'Khám phá 56 aura khác nhau', glyph: '✷', target: 56, metric: 'collection', coins: 20000 },
] as const;


export interface Recipe { id: string; name: string; description: string; glyph: string; color: string; cost: Partial<Record<Material, number>>; coins: number; luck: number; power: number; zone?: ZoneId; level?: number }
export interface Achievement { id: string; name: string; description: string; glyph: string; target: number; metric: string; coins: number }
const forms = ['Tiếng vọng', 'Vương miện', 'Trái tim', 'Mảnh hồn', 'Lời thề', 'Ấn chú', 'Cánh chim', 'Lưỡi kiếm', 'Vũ điệu', 'Cực điểm'];
const aspects = ['Bình minh', 'Sương sớm', 'Chiều tím', 'Đêm sâu', 'Vĩnh cửu'];
const formLore = ['Một âm thanh lan truyền qua những thực tại.', 'Biểu tượng dành cho người bảo vệ thế giới.', 'Nhịp đập nuôi dưỡng những vì sao nhỏ.', 'Một ký ức đã có hình hài của riêng nó.', 'Lời hứa chưa từng bị thời gian bào mòn.', 'Những ký tự chỉ hiện ra khi chủ nhân gọi tên.', 'Đôi cánh mang ước mơ vượt qua đường chân trời.', 'Ánh sáng được rèn thành một đường kiếm.', 'Nhịp điệu khiến các vì sao đổi quỹ đạo.', 'Sự hội tụ của mọi điều tưởng như không thể.'];
export const EXPANSION_AURAS: Aura[] = THEMES.flatMap((theme, themeIndex) => Array.from({ length: 50 }, (_, i) => {
  const rarity = i < 10 ? 0 : i < 20 ? 1 : i < 30 ? 2 : i < 38 ? 3 : i < 44 ? 4 : i < 48 ? 5 : 6;
  const seed = themeIndex * 50 + i;
  return { id: `cosmos-${theme.id}-${i}`, name: `${forms[i % 10]} ${theme.name} · ${aspects[Math.floor(i / 10)]}`, rarity, affinity: theme.id, family: theme.name,
    color: theme.color, glyph: glyphs[(i + themeIndex) % glyphs.length], description: `${formLore[i % 10]} ${theme.lore} Dấu ấn ${aspects[Math.floor(i / 10)].toLowerCase()} định hình sắc thái của aura này.`,
    effect: effectFor(seed, theme, rarity), power: [3, 8, 18, 35, 65, 110, 180][rarity] + (i % 10) * (rarity + 1),
  };
}));
export const AURAS: Aura[] = [...LEGACY_AURAS, ...EXPANSION_AURAS];
export const AURA_BY_ID = Object.assign(Object.create(null), Object.fromEntries(AURAS.map(a => [a.id, a]))) as Record<string, Aura>;
export const RARITY_COUNTS = RARITIES.map((_, i) => AURAS.filter(a => a.rarity === i).length);
export const RECIPES: Recipe[] = [...LEGACY_RECIPES, ...Array.from({ length: 114 }, (_, i) => {
  const theme = THEMES[i % 30], tier = Math.floor(i / 30), power = 8 + tier * 14 + i % 7 * 2, luck = Math.round((.08 + tier * .07 + i % 5 * .01) * 100) / 100;
  return { id: `relic-${theme.id}-${tier}`, name: `${['Ấn tín', 'Trượng', 'Thánh tích', 'Vương bảo'][tier]} ${theme.name}`, description: `May mắn +${luck.toLocaleString('vi-VN')} · Sức mạnh +${power}. ${theme.lore}`, glyph: glyphs[i % 8], color: theme.color,
    zone: theme.id, level: 3 + tier * 6, cost: { dust: 45 + i * 5, ore: 4 + tier * 12, crystal: 2 + tier * 8, ...(tier > 1 ? { essence: tier * 2 } : {}) }, coins: 250 + i * 140 + tier * 1500, luck, power };
})];
export type BossStyle = 'striker' | 'berserker' | 'bastion' | 'regenerator';
export interface Boss { id: string; name: string; zone: ZoneId; level: number; color: string; glyph: string; hp: number; damage: number; style: BossStyle; coins: number; essence: number; crystal: number; xp: number; description: string }
const bossNames = ['Kẻ nuốt sao', 'Mộc vương ngàn tuổi', 'Long vương băng giá', 'Phượng hoàng tro tàn', 'Người gác hư vô', 'Nữ hoàng thủy triều', 'Thần sấm lưu đày', 'Hồ ly anh đào', 'Người khổng lồ sa mạc', 'Long vương pha lê', 'Leviathan không đáy', 'Kẻ đánh cắp thời gian', 'Vua của những giấc mơ', 'Nữ hoàng đầm độc', 'Bạo chúa dung nham', 'Rồng cực quang', 'Người bẻ cong quỹ đạo', 'Nữ vương huyết nguyệt', 'Cỗ máy tận thế', 'Người chèo đò linh hồn', 'Sư tử hoàng kim', 'Chúa tể rừng nấm', 'Bản ngã phản chiếu', 'Hải long cuồng phong', 'Thư thần mực đêm', 'Phượng tổ bất diệt', 'Kẻ du hành lượng tử', 'Chủ nhân vành khuyên', 'Cự thần sáng thế', 'Hiện thân vô tận'];
export const BOSS_STYLES: Record<BossStyle, { name: string; description: string }> = {
  striker: { name: 'Cuồng kích', description: 'Đòn đánh mạnh hơn mỗi lượt thứ ba. Phòng thủ đúng lúc để sống sót.' },
  berserker: { name: 'Cuồng nộ', description: 'Sát thương tăng 45% khi dưới nửa máu.' },
  bastion: { name: 'Thiết giáp', description: 'Giảm 60% sát thương ở lượt đầu mỗi chu kỳ ba lượt. Bùng nổ xuyên giáp.' },
  regenerator: { name: 'Tái tạo', description: 'Hồi 3% máu tối đa sau mỗi ba lượt còn sống.' },
};
export const BOSSES: Boss[] = THEMES.map((t, i) => ({ id: i === 0 ? 'star-devourer' : `boss-${t.id}`, name: bossNames[i], zone: t.id, level: i === 0 ? 3 : ZONES[i].level,
  color: t.color, glyph: glyphs[i % 8], hp: 360 + i * 120 + i * i * 22, damage: 20 + i * 2, style: (['striker', 'berserker', 'bastion', 'regenerator'] as const)[i % 4], coins: 1600 + i * 450, essence: 2 + Math.floor(i / 5), crystal: 8 + Math.floor(i / 2), xp: 400 + i * 50, description: `${t.lore} ${bossNames[i]} canh giữ quyền năng của thế giới này.` }));
export const BOSS_BY_ID = Object.assign(Object.create(null), Object.fromEntries(BOSSES.map(b => [b.id, b]))) as Record<string, Boss>;
export interface Contract { id: string; name: string; description: string; group: string; metric: string; target: number; coins: number; dust: number; xp: number }
const tracks = [
  ['rolls', 'Lữ khách', 'lượt quay', (n: number) => n * n * 15],
  ['collection', 'Nhà sưu tập', 'aura khác nhau', (n: number) => n * 25],
  ['crafted', 'Nghệ nhân', 'cổ vật đã chế tạo', (n: number) => n * 5],
  ['zones', 'Người mở đường', 'vùng đã mở', (n: number) => n + 1],
  ['bosses', 'Thợ săn', 'trận thắng boss', (n: number) => n * 3],
  ['expeditions', 'Nhà thám hiểm', 'chuyến thám hiểm', (n: number) => n * 3],
  ['earned', 'Thương nhân', 'vàng kiếm từ quay', (n: number) => n * n * 1000],
  ['level', 'Người học việc', 'cấp độ hiện tại', (n: number) => n * 3],
  ['zoneMastery', 'Người cộng hưởng', 'lượt quay tại một vùng bất kỳ', (n: number) => n * n * 10],
  ['uniqueBosses', 'Hộ vệ thiên hà', 'boss khác nhau đã đánh bại', (n: number) => n],
] as const;
export const CONTRACTS: Contract[] = tracks.flatMap(([metric, group, unit, target]) => Array.from({ length: 20 }, (_, i) => ({ id: `contract-${metric}-${i + 1}`, group, metric, target: target(i + 1), name: `${group} · Chương ${i + 1}`, description: `Đạt ${target(i + 1).toLocaleString('vi-VN')} ${unit}.`, coins: 150 + i * 120, dust: 10 + i * 4, xp: 40 + i * 25 })));
const achievementTracks = [
  ['rolls', 'Nhịp đập thiên hà', [250, 500, 2000, 5000, 10000, 25000]],
  ['collection', 'Kho tàng ánh sáng', [25, 50, 100, 250, 500, 1556]],
  ['crafted', 'Bậc thầy lò rèn', [6, 12, 24, 48, 80, 120]],
  ['zones', 'Tấm bản đồ mới', [5, 10, 15, 20, 25, 30]],
  ['bosses', 'Chiến binh bất khuất', [3, 10, 25, 50, 100, 200]],
  ['expeditions', 'Đường chân trời', [5, 15, 30, 60, 120, 240]],
  ['contracts', 'Người giữ lời', [5, 15, 30, 60, 100, 200]],
  ['rebirths', 'Vòng đời tinh tú', [1, 2, 3, 5, 10, 20]],
  ['uniqueBosses', 'Hội đồng hộ vệ', [2, 5, 10, 15, 20, 30]],
] as const;
export const ACHIEVEMENTS: Achievement[] = [...LEGACY_ACHIEVEMENTS, ...achievementTracks.flatMap(([metric, name, targets]) => targets.map((target, i) => ({ id: `achievement-${metric}-${i}`, name: `${name} ${i + 1}`, description: `Đạt mốc ${target.toLocaleString('vi-VN')} · ${name.toLowerCase()}.`, glyph: glyphs[i % 8], metric, target, coins: 500 + i * 650 })))];
export const CONTENT_COUNTS = { auras: AURAS.length, zones: ZONES.length, relics: RECIPES.length, contracts: CONTRACTS.length, achievements: ACHIEVEMENTS.length, bosses: BOSSES.length };
export const CONTENT_TOTAL = Object.values(CONTENT_COUNTS).reduce((a, b) => a + b, 0);
