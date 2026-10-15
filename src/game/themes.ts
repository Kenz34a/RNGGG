// Thirty authored worlds supply the language and visual identity of the expansion.
export const THEME_SEEDS = [
  ['astral', 'Tinh tú', 'Vườn tinh tú', '#95e6c0', 'orbit', 'orbit', 'Những hạt ánh sáng lưu giữ lời chúc đầu tiên của vũ trụ.'],
  ['forest', 'Linh mộc', 'Rừng linh hồn', '#79dd9e', 'tree', 'bloom', 'Mỗi chiếc lá là một ký ức chưa được kể của khu rừng biết hát.'],
  ['frost', 'Băng phách', 'Miền băng vĩnh cửu', '#8dcaff', 'snow', 'snow', 'Thời gian ngủ yên dưới lớp băng, chờ một tiếng chuông đánh thức.'],
  ['ember', 'Hỏa nhật', 'Tàn tích mặt trời', '#f6b377', 'flame', 'flame', 'Ngọn lửa cuối cùng của một mặt trời vẫn cháy trong những tàn tích.'],
  ['void', 'Hư không', 'Vực thẳm hư không', '#b5a0fa', 'moon', 'vortex', 'Phía sau bóng tối là những con đường chưa từng có tên trên bản đồ.'],
  ['ocean', 'Hải triều', 'Đại dương ánh trăng', '#6ed8e6', 'orbit', 'tide', 'Thủy triều mang theo ánh trăng từ đáy biển sâu không thấy tận cùng.'],
  ['thunder', 'Lôi đình', 'Đỉnh giông vĩnh cửu', '#d6b4ff', 'zap', 'storm', 'Những tia chớp viết lời tiên tri lên đỉnh núi bị mây che phủ.'],
  ['sakura', 'Anh đào', 'Thung lũng hoa bay', '#f3afcc', 'tree', 'bloom', 'Một cánh hoa chạm đất cũng có thể bắt đầu một mùa xuân mới.'],
  ['desert', 'Sa mạc', 'Biển cát hoàng hôn', '#e9c48e', 'flame', 'comet', 'Dưới những đụn cát là tiếng vọng của đoàn lữ hành cổ xưa.'],
  ['crystal', 'Pha lê', 'Thành phố lăng kính', '#a9e2ed', 'snow', 'prism', 'Ánh sáng được cất giữ trong những tòa tháp bằng pha lê sống.'],
  ['abyss', 'Vực sâu', 'Hải vực không đáy', '#7e9be0', 'moon', 'eclipse', 'Những sinh vật phát sáng canh giữ cánh cửa nơi biển chạm vào trời.'],
  ['clockwork', 'Thời cơ', 'Tháp đồng hồ thất lạc', '#d8bd82', 'orbit', 'rune', 'Các bánh răng quay theo nhịp của những phút giây chưa tới.'],
  ['dream', 'Mộng cảnh', 'Vườn mộng du', '#cfb0ed', 'moon', 'vortex', 'Những giấc mơ chưa thành hình lặng lẽ hóa thành những hòn đảo.'],
  ['toxic', 'Độc mộng', 'Đầm lầy phát quang', '#b6df78', 'tree', 'bloom', 'Sự sống kỳ lạ nở rộ trong màn sương xanh đầy bí mật.'],
  ['volcano', 'Dung nham', 'Trái tim núi lửa', '#f49479', 'flame', 'flame', 'Một trái tim bằng đá nóng vẫn đập bên dưới lớp vỏ thế giới.'],
  ['aurora', 'Cực quang', 'Cánh đồng trời bắc', '#9df1d4', 'snow', 'tide', 'Những dòng sông ánh sáng chảy qua bầu trời không có ranh giới.'],
  ['gravity', 'Trọng lực', 'Quần đảo lơ lửng', '#abaaf5', 'orbit', 'orbit', 'Đá và nước cùng trôi giữa những quỹ đạo không thể giải thích.'],
  ['rose', 'Huyết nguyệt', 'Lâu đài hoa hồng', '#e797b3', 'moon', 'eclipse', 'Những đóa hồng đỏ chỉ nở khi ánh trăng chạm vào cửa sổ cổ.'],
  ['machine', 'Cơ giới', 'Xưởng rèn ngân hà', '#8cc9c8', 'zap', 'rune', 'Những cỗ máy tự mơ về một ngày được nhìn thấy vì sao đầu tiên.'],
  ['spirit', 'Vong linh', 'Cổng ngàn linh hồn', '#b4d0f1', 'moon', 'comet', 'Những chiếc đèn dẫn lối cho ký ức trở về ngôi nhà đã mất.'],
  ['golden', 'Hoàng kim', 'Vương quốc mặt trời đôi', '#eed38b', 'flame', 'nova', 'Hai mặt trời soi sáng vương quốc được dựng từ những điều ước.'],
  ['fungal', 'Nấm mộng', 'Khu rừng dưới lòng đất', '#b8c2f5', 'tree', 'bloom', 'Những vòm nấm phát sáng tạo thành một bầu trời khác dưới đất sâu.'],
  ['mirror', 'Ảo kính', 'Mê cung gương bạc', '#c6dce9', 'snow', 'prism', 'Mỗi tấm gương phản chiếu một lựa chọn bạn chưa từng đưa ra.'],
  ['stormsea', 'Bão hải', 'Biển trời cuồng phong', '#89badb', 'zap', 'storm', 'Những con sóng vươn lên trời để đuổi theo đoàn tàu bằng mây.'],
  ['ink', 'Mặc ảnh', 'Thư viện mực đêm', '#b5a9df', 'moon', 'rune', 'Những trang sách tự viết tiếp câu chuyện của người dám bước vào.'],
  ['phoenix', 'Phượng linh', 'Cung điện tro tàn', '#efaf90', 'flame', 'nova', 'Từ tàn tro của ngày cũ, những đôi cánh mới lại vươn lên.'],
  ['quantum', 'Lượng tử', 'Ga tàu đa thực tại', '#a3e9e0', 'orbit', 'prism', 'Mỗi chuyến tàu rời ga đều đến một phiên bản khác của chính thế giới này.'],
  ['eclipse', 'Nhật thực', 'Vương tọa vành khuyên', '#c2a0e6', 'moon', 'eclipse', 'Một vương miện ánh sáng vây quanh bóng tối không bao giờ tan.'],
  ['genesis', 'Sáng thế', 'Biên giới khởi nguyên', '#f0d9be', 'flame', 'nova', 'Nơi ánh sáng đầu tiên vẫn đang học cách trở thành một vì sao.'],
  ['infinity', 'Vô tận', 'Miền tận cùng vũ trụ', '#b4f2e9', 'orbit', 'vortex', 'Mọi hành trình hội tụ ở đây rồi mở ra vô vàn hành trình khác.'],
] as const;
export type ZoneId = typeof THEME_SEEDS[number][0];
export type EffectMotif = typeof THEME_SEEDS[number][5];
export const THEMES = THEME_SEEDS.map(([id, name, world, color, icon, motif, lore]) => ({ id, name, world, color, icon, motif, lore }));
export const EFFECT_NAMES: Record<EffectMotif, string> = { orbit: 'Quỹ đạo sao', bloom: 'Cánh hoa linh hồn', snow: 'Tinh thể tuyết', flame: 'Hỏa vũ', vortex: 'Xoáy không gian', tide: 'Sóng ánh sáng', storm: 'Lôi trận', comet: 'Mưa sao', prism: 'Lăng kính', eclipse: 'Vành nhật thực', rune: 'Pháp trận', nova: 'Vụ nổ tinh tú' };
export interface EffectProfile { seed: number; motif: EffectMotif; particles: number; rings: number; petals: number; speed: number; spread: number; twist: number; secondary: string }
export function effectFor(seed: number, theme: typeof THEMES[number], rarity: number): EffectProfile {
  return { seed, motif: theme.motif, particles: 14 + seed % 19 + rarity * 3, rings: 1 + seed % 4, petals: 3 + seed % 9, speed: .25 + seed % 17 * .035, spread: .7 + seed % 13 * .025, twist: (seed % 2 ? -1 : 1) * (.4 + seed % 7 * .15), secondary: `hsl(${(seed * 137.508) % 360} 70% 77%)` };
}
