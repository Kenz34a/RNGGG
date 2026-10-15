# ASTRA · Cosmos Expansion

Game RNG chơi đơn bằng tiếng Việt với **2.000 nội dung chính**, hiệu ứng thiên hà và tiến trình dài hạn. Chạy trên trình duyệt, không sử dụng tiền thật, không cần tài khoản hay API key.

## Chạy dự án

Yêu cầu Node.js 20.19+ hoặc 22+. Môi trường hiện tại dùng Node.js 24.

```sh
npm ci
npm run dev -- --port 5173
```

Trong cloud, checkout nằm ở `/workspace/RNGGG`. Mỗi task đã được cô lập; dùng checkout hiện có, không tạo worktree trừ khi được yêu cầu.

```sh
npm test                 # 44 kiểm thử logic
npm run build            # TypeScript + production bundle
npm run preview -- --port 4173
```

Không cần database, biến môi trường hay dịch vụ bên ngoài. Font, phong cảnh và hiệu ứng được phục vụ cục bộ. Chưa triển khai tài khoản, multiplayer hay đồng bộ cloud.

## Danh mục 2.000 nội dung

| Loại | Tổng | Phần mở rộng |
| --- | ---: | ---: |
| Aura | 1.556 | 1.500 aura mới, giữ 56 aura gốc |
| Vùng | 30 | 25 vùng mới |
| Cổ vật | 120 | 114 công thức mới |
| Hợp đồng dài hạn | 200 | 10 hành trình × 20 chương |
| Thành tựu | 64 | 54 mốc mới |
| Boss | 30 | 29 boss mới |
| **Tổng** | **2.000** | **1.922 mục mới** |

Tổng trên không đếm lặp hiệu ứng thành aura, không đếm các cấp nâng cấp và không bao gồm 4 nhiệm vụ hằng ngày có sẵn. Số lượng được tính trực tiếp từ danh mục `CONTENT_COUNTS`; kiểm thử kiểm tra ID độc nhất và tổng chính xác.

## Aura và hiệu ứng

30 hệ gồm Tinh tú, Linh mộc, Băng phách, Hỏa nhật, Hư không, Hải triều, Lôi đình, Anh đào, Sa mạc, Pha lê, Vực sâu, Thời cơ, Mộng cảnh, Độc mộng, Dung nham, Cực quang, Trọng lực, Huyết nguyệt, Cơ giới, Vong linh, Hoàng kim, Nấm mộng, Ảo kính, Bão hải, Mặc ảnh, Phượng linh, Lượng tử, Nhật thực, Sáng thế và Vô tận.

Mỗi hệ có 50 aura mới. Mỗi aura có ID ổn định, tên, mô tả, độ hiếm, vùng cộng hưởng, sức mạnh và một hồ sơ hiệu ứng xác định. Đây là các biến thể được sinh từ **12 họ chuyển động**: quỹ đạo, cánh hoa, tuyết, lửa, xoáy, sóng, sấm, sao băng, lăng kính, nhật thực, pháp trận và tân tinh. Thông số vòng, cánh, tốc độ, hướng xoáy, độ mở, màu phụ và vị trí hạt tạo bản sắc cho từng aura; không phải 1.500 đoạn hoạt ảnh viết tay độc lập.

Hiệu ứng Canvas thực sự chạy tại aura đang quay, xem trước hoặc nhận thưởng. Danh mục chỉ dựng 24 thẻ mỗi trang, không chạy hàng nghìn Canvas cùng lúc. Renderer giới hạn hạt, tỷ lệ điểm ảnh và dừng khi ra khỏi màn hình hoặc tab bị ẩn. Cả tùy chọn trong game và `prefers-reduced-motion` đều được hỗ trợ.

Bộ sưu tập có tìm kiếm không dấu, lọc 30 hệ, lọc 7 độ hiếm, chỉ hiện aura sở hữu/yêu thích, sắp xếp tên/sức mạnh/số lượng, phân trang và nhập số trang. Có thể xem trước và yêu thích aura chưa sở hữu. Trang bị mạnh nhất chọn theo sức mạnh thực; phân rã hàng loạt giữ lại ít nhất một bản của mọi aura.

## RNG và tiến trình

Quay miễn phí bằng nút Quay aura, phím R hoặc Space. Mở quay ×10 sau 50 lượt. Mỗi lượt nhận vàng, XP, bụi sao và có thể nhận tinh thể/tinh chất. Quay tự động tạm dừng khi mở hộp thoại; có tùy chọn dừng khi gặp Huyền thoại trở lên.

Bảy độ hiếm: Thường, Độc đáo, Hiếm, Sử thi, Huyền thoại, Thần thoại, Thiên giới. Trọng số cơ bản tương ứng là 48%, 27%, 15%, 6,8%, 2,55%, 0,55%, 0,1% trước điều chỉnh may mắn/vùng. Mỗi trọng số được chia theo số aura trong tầng, nên thêm nhiều aura không làm sai tỷ lệ độ hiếm. Hồ sơ aura hiển thị tỷ lệ thường thực tế theo may mắn và vùng hiện tại.

- **Bảo hiểm Sử thi**: nếu 39 lượt chưa có Sử thi+, lượt 40 chắc chắn Sử thi+.
- **Bảo hiểm Thần thoại**: nếu 199 lượt chưa có Thần thoại+, lượt 200 chắc chắn Thần thoại+.
- Nhận tầng tương ứng sẽ reset bộ đếm; quay ×10 xử lý tuần tự từng lượt.
- Vùng ngoài Vườn tinh tú nhân đôi trọng số aura cùng hệ trước khi chuẩn hóa.
- Thuốc may mắn +1,5 trong 2 phút; dùng thêm cộng dồn thời gian.
- Mưa sao băng diễn ra 5 phút đầu mỗi chu kỳ 15 phút theo đồng hồ hệ thống, may mắn +0,35.

Ba tuyến nâng cấp có tổng 37 cấp. Mọi cổ vật đã chế tạo đều cộng dồn may mắn và sức mạnh. Cổ vật mới cần đúng vùng đã mở, cấp độ, vàng và nguyên liệu được ghi trong công thức.

## Vùng, thám hiểm và boss

Vùng mở dần theo cấp và vàng. Một đội thám hiểm hoạt động tại một thời điểm; đồng hồ dùng thời gian tuyệt đối, vẫn có thể hoàn tất khi đóng trang. Nhận phần thưởng một lần khi quay lại.

Mỗi vùng có một boss với HP, yêu cầu cấp, chiến lợi phẩm và hồi chiêu riêng. Các kiểu chiến thuật:

- **Cuồng kích**: đòn thứ ba mạnh hơn 50%; phòng thủ đúng lúc.
- **Cuồng nộ**: sát thương tăng 45% khi còn dưới nửa máu.
- **Thiết giáp**: giảm 60% sát thương ở đầu chu kỳ ba lượt; Bùng nổ xuyên giáp.
- **Tái tạo**: hồi 3% máu tối đa mỗi ba lượt nếu còn sống.

Phòng thủ giảm 75% sát thương nhận vào. Bùng nổ gây 2,4× sát thương, sẵn sàng mỗi ba lượt. Máu người chơi là 150 + 5 × cấp khi bắt đầu trận. UI thông báo ý đồ sắp tới. Hiệu ứng đòn đánh có khoảng khóa 420–600 ms; chế độ giảm chuyển động bỏ khoảng khóa này.

Boss đầu vẫn có 360 HP và thưởng 1.600 vàng, 2 tinh chất, 8 tinh thể, 400 XP. Các boss sau tăng chỉ số và phần thưởng. Thắng hồi chiêu 2 phút; thua/rút lui 30 giây. Hồi chiêu không chặn boss khác. Thống kê theo dõi số lần thắng từng boss và số boss khác nhau đã đánh bại.

## Mục tiêu dài hạn

4 nhiệm vụ hằng ngày và quà đăng nhập làm mới theo ngày trên máy người chơi. 200 hợp đồng theo dõi lượt quay, bộ sưu tập, chế tạo, mở vùng, thắng boss, thám hiểm, vàng từ quay, cấp hiện tại, số lượt tại một vùng và số boss khác nhau. Hợp đồng không reset qua ngày và chỉ trả thưởng một lần. Nhận tất cả chỉ nhận những mục đủ điều kiện tại thời điểm bấm.

64 thành tựu trả vàng và thêm một lọ thuốc. 10 ID gốc được giữ, bao gồm mốc 56 aura; có mốc Cosmos riêng cho đủ 1.556 aura. Nhật ký giữ 60 sự kiện.

Tái sinh cần cấp 15, 500 lượt quay và 15.000 vàng. Reset XP và ba tuyến nâng cấp, tiêu hao 15.000 vàng; giữ aura, vùng, cổ vật, nguyên liệu, hợp đồng đã nhận và thành tựu. Mỗi lần thêm vĩnh viễn +0,3 may mắn và +12 sức mạnh. Các hợp đồng dùng “cấp hiện tại” tiếp tục phụ thuộc cấp sau tái sinh.

## Lưu và tương thích

Khóa lưu vẫn là `astra-rng-save-v1`. Bản lưu cũ được bổ sung các trường mới với giá trị mặc định, giữ ID aura/vùng/cổ vật gốc, tiền, XP, bộ sưu tập, chuyến thám hiểm và trận boss đang diễn ra. Trận boss cũ giữ 150 HP tối đa của người chơi. Các chiến thắng cũ được ghi cho Kẻ nuốt sao; thống kê số lượt theo vùng bắt đầu từ bản Cosmos vì phiên bản cũ chưa lưu dữ liệu này.

Tự động lưu sau mỗi hành động. Có xuất/nhập JSON với kiểm tra cấu trúc, ID, giá trị và xác nhận trước khi thay thế. Đổi máy, cổng hoặc trình duyệt cần xuất/nhập. Nếu lưu trữ bị chặn, game báo trạng thái và vẫn cho xuất file. Reset yêu cầu nhập ASTRA.

## Cấu trúc chính

```text
src/game/themes.ts          30 thế giới và cấu hình hiệu ứng
src/game/data.ts            Danh mục 2.000 mục, ID và số lượng
src/game/engine.ts          RNG, chiến đấu, hợp đồng, kinh tế, migration
src/game/engine.test.ts     28 kiểm thử lõi
src/game/cosmos.test.ts     16 kiểm thử mở rộng và tương thích
src/components/AuraFX.tsx   12 renderer hiệu ứng theo hồ sơ aura
src/components/CatalogueUi.tsx  Tìm kiếm và phân trang
src/components/Screens.tsx  Bộ sưu tập, vùng/boss, xưởng và hành trình
src/components/Art.tsx      Phong cảnh, hành tinh, nền sao
src/components/Motion.tsx   Chuyển động, quay ba giai đoạn, phản hồi
src/App.tsx                Tương tác, âm thanh và lưu game
src/catalogue.css          Giao diện mở rộng
```

## Khu vực quản trị `/admin`

Admin có đăng nhập máy chủ, cookie HttpOnly/SameSite, CSRF, giới hạn đăng nhập sai, phiên 8 giờ và đăng xuất thu hồi phiên. Không có tài khoản hay mật khẩu mặc định. Mật khẩu phải ít nhất 16 ký tự, cấu hình bằng secret `ASTRA_ADMIN_PASSWORD` trên nơi chạy server; không đưa vào biến `VITE_*`, Git hay mã frontend. Chưa cấu hình thì API admin trả 503, game vẫn hoạt động.

- Biên tập tên/mô tả cho 1.556 aura, 30 thế giới, 120 cổ vật, 30 boss; khôi phục từng mục về mặc định.
- Đăng thông báo, tạo sự kiện cộng 0–5 may mắn có thời hạn. Người chơi nhận cấu hình mới khi tải lại game; sự kiện tự hết hạn trong phiên chơi.
- Dữ liệu cấu hình lưu nguyên tử tại `.local/server/config.json`. Có kiểm tra phiên bản tránh ghi đè thay đổi của phiên quản trị khác. Đặt `ASTRA_DATA_DIR` vào thư mục lưu trữ bền vững khi deploy; sao lưu thư mục này. Đây là server một instance, không dùng chung file giữa nhiều replica.
- Chỉ sửa nội dung hiển thị, không đổi ID, tỉ lệ hiếm hoặc tiến trình đã lưu. Chưa có tài khoản người chơi nên chưa có quản lý người dùng/thống kê trực tuyến. Game vẫn chạy RNG trên trình duyệt.

Chạy bản đầy đủ: `npm ci`, `npm run build`, cấu hình secret bên trên rồi `npm start` (cổng `PORT`, mặc định 3001). Server phục vụ cả game, `/admin` và API; chỉ upload `dist` lên static hosting sẽ không có API admin. Môi trường production cần `NODE_ENV=production`, `ASTRA_PUBLIC_ORIGIN=https://ten-mien-cua-ban` (không có dấu `/` cuối), HTTPS qua reverse proxy để cookie Secure hoạt động. Origin phải đúng địa chỉ công khai.

Phát triển: chạy `npm start` cho API và `npm run dev` cho giao diện; Vite chuyển tiếp `/api` sang cổng 3001. Không đặt `NODE_ENV=production` khi thử HTTP cục bộ. Đổi mật khẩu hoặc khởi động lại server sẽ hủy các phiên cũ. Kiểm thử: `npm test`, `npm run test:server`, `npm run build`.
