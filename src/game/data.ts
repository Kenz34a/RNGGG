export const RARITIES = [
  { id: 'common', name: 'Thường', color: '#a3bac5', weight: 48, value: 8 },
  { id: 'uncommon', name: 'Độc đáo', color: '#94e6bc', weight: 27, value: 16 },
  { id: 'rare', name: 'Hiếm', color: '#76bdff', weight: 15, value: 32 },
  { id: 'epic', name: 'Sử thi', color: '#b29aff', weight: 6.8, value: 70 },
  { id: 'legendary', name: 'Huyền thoại', color: '#f9c777', weight: 2.55, value: 150 },
  { id: 'mythic', name: 'Thần thoại', color: '#ff94be', weight: .55, value: 360 },
  { id: 'celestial', name: 'Thiên giới', color: '#b9fff2', weight: .1, value: 1200 },
] as const;

export const ZONES = [
  { id: 'astral', name: 'Vườn tinh tú', sub: 'Nơi mọi hành trình bắt đầu', icon: 'orbit', color: '#95e6c0', level: 1, cost: 0, luck: 0, description: 'Những hạt ánh sáng trôi giữa một khu vườn bất tận. Tất cả aura đều có thể xuất hiện tại đây.', expedition: 'dust', duration: 60, reward: 45 },
  { id: 'forest', name: 'Rừng linh hồn', sub: 'Tiếng thì thầm của sự sống', icon: 'tree', color: '#79dd9e', level: 3, cost: 500, luck: .15, description: 'Cây cổ thụ lưu giữ ký ức của các vì sao. Aura hệ sinh mệnh có tần suất xuất hiện cao hơn.', expedition: 'ore', duration: 90, reward: 8 },
  { id: 'frost', name: 'Miền băng vĩnh cửu', sub: 'Vẻ đẹp sau màn cực quang', icon: 'snow', color: '#8dcaff', level: 5, cost: 1400, luck: .3, description: 'Cực quang đóng băng thời gian. Những aura hệ băng và ánh sáng đang chờ người tìm thấy.', expedition: 'crystal', duration: 120, reward: 6 },
  { id: 'ember', name: 'Tàn tích mặt trời', sub: 'Ngọn lửa chưa từng tắt', icon: 'flame', color: '#f6b377', level: 8, cost: 3500, luck: .5, description: 'Một nền văn minh đã mất, một mặt trời còn cháy. Aura hệ lửa hội tụ giữa những tàn tích.', expedition: 'ore', duration: 150, reward: 20 },
  { id: 'void', name: 'Vực thẳm hư không', sub: 'Phía bên kia của thực tại', icon: 'moon', color: '#b5a0fa', level: 12, cost: 8000, luck: .8, description: 'Mọi định luật tan biến ở rìa thiên hà. Aura hư không và những bí mật hiếm nhất đang thức giấc.', expedition: 'essence', duration: 180, reward: 3 },
] as const;
export type ZoneId = typeof ZONES[number]['id'];
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
export interface Aura { id: string; name: string; rarity: number; affinity: ZoneId; color: string; glyph: string; description: string }
export const AURAS: Aura[] = names.flatMap((group, rarity) => group.map((name, i) => ({
  id: `aura-${rarity}-${i}`, name, rarity, affinity: ZONES[i % 5].id, color: colors[i], glyph: glyphs[i],
  description: `${name} mang theo ${['một tia hy vọng nhỏ bé', 'nhịp thở của thiên nhiên', 'ký ức từ một vì sao xa', 'sức mạnh vượt khỏi tưởng tượng', 'dấu ấn của những vị thần', 'bí mật viết trước khi vũ trụ ra đời', 'quyền năng khai sinh một thực tại mới'][rarity]}. ${ZONES[i % 5].sub}.`,
})));

export const UPGRADES = [
  { id: 'luck', name: 'La bàn vận mệnh', description: 'Tăng may mắn +0,2 mỗi cấp', icon: 'clover', color: '#9ce3bc', base: 220, max: 15 },
  { id: 'speed', name: 'Động cơ lượng tử', description: 'Giảm thời gian quay 8% mỗi cấp', icon: 'zap', color: '#f4d18a', base: 300, max: 10 },
  { id: 'income', name: 'Máy gom ánh sao', description: 'Tăng vàng từ mỗi lượt quay 15%', icon: 'coins', color: '#edb683', base: 250, max: 12 },
] as const;
export type UpgradeId = typeof UPGRADES[number]['id'];
export const RECIPES: { id: string; name: string; description: string; glyph: string; color: string; cost: Partial<Record<Material, number>>; coins: number; luck: number; power: number }[] = [
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
export const ACHIEVEMENTS = [
  { id: 'first', name: 'Tín hiệu đầu tiên', description: 'Thực hiện lượt quay đầu tiên', glyph: '✧', target: 1, metric: 'rolls', coins: 100 },
  { id: 'collector', name: 'Nhà lưu trữ', description: 'Khám phá 10 aura khác nhau', glyph: '◈', target: 10, metric: 'collection', coins: 400 },
  { id: 'hundred', name: 'Chạm tới những vì sao', description: 'Thực hiện 100 lượt quay', glyph: '✦', target: 100, metric: 'rolls', coins: 600 },
  { id: 'epic', name: 'Câu chuyện sử thi', description: 'Tìm một aura Sử thi trở lên', glyph: '❋', target: 3, metric: 'rarity', coins: 500 },
  { id: 'legend', name: 'Một huyền thoại mới', description: 'Tìm một aura Huyền thoại trở lên', glyph: '♔', target: 4, metric: 'rarity', coins: 1000 },
  { id: 'traveler', name: 'Người đi qua thế giới', description: 'Mở khóa 3 vùng', glyph: '◎', target: 3, metric: 'zones', coins: 1200 },
  { id: 'smith', name: 'Nghệ nhân ánh sao', description: 'Chế tạo 3 cổ vật', glyph: '⚒', target: 3, metric: 'crafted', coins: 1000 },
  { id: 'hunter', name: 'Người bảo vệ thiên hà', description: 'Đánh bại boss lần đầu', glyph: '✺', target: 1, metric: 'bosses', coins: 1500 },
  { id: 'thousand', name: 'Không ngừng mơ ước', description: 'Thực hiện 1.000 lượt quay', glyph: '∞', target: 1000, metric: 'rolls', coins: 3000 },
  { id: 'complete', name: 'Bản đồ của vũ trụ', description: 'Khám phá đủ 56 aura', glyph: '✷', target: 56, metric: 'collection', coins: 20000 },
] as const;
