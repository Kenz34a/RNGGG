# ASTRA · Vũ trụ RNG

Game RNG chơi đơn bằng tiếng Việt, chạy ngay trên trình duyệt. Giao diện thiên hà, hành tinh có quỹ đạo, các vùng có phong cảnh riêng và âm thanh tổng hợp bằng Web Audio. Không sử dụng tiền thật.

## Khởi động

Yêu cầu Node.js 20.19+ hoặc 22+. Môi trường cloud đã kiểm tra với Node.js 24.

```sh
cd /workspace/RNGGG
npm ci
npm run dev -- --port 5173
```

Vite phục vụ trên cổng 5173. Bản production:

```sh
npm run build
npm run preview -- --port 4173
```

Kiểm thử cơ chế game: `npm test`. `npm run build` đồng thời kiểm tra TypeScript. Không cần database, API key hoặc dịch vụ bên ngoài. Font được đóng gói cục bộ.

## Nội dung hiện có

- **56 aura, 7 độ hiếm**: Thường → Độc đáo → Hiếm → Sử thi → Huyền thoại → Thần thoại → Thiên giới. Xem tỷ lệ thật của từng aura trong bộ sưu tập; tỷ lệ thay đổi theo may mắn và vùng. Trang bị aura để tăng sức mạnh; phân rã bản sao giữ lại ít nhất một bản.
- **Quay miễn phí**: quay đơn, tự động, quay 10 sau 50 lượt. Phím R hoặc Space tại trạm quan sát. Có tùy chọn tự dừng khi gặp Huyền thoại trở lên.
- **Bảo hiểm**: nếu 39 lượt liên tiếp chưa có Sử thi+, lượt 40 chắc chắn Sử thi+; nếu 199 lượt chưa có Thần thoại+, lượt 200 chắc chắn Thần thoại+. Bộ đếm reset khi nhận độ hiếm tương ứng. Trong quay 10, xử lý lần lượt từng lượt.
- **5 vùng**: Vườn tinh tú, Rừng linh hồn, Miền băng vĩnh cửu, Tàn tích mặt trời, Vực thẳm hư không. Vùng cần cấp độ và vàng để mở; vùng ngoài Vườn tinh tú tăng gấp đôi trọng số aura cùng hệ trước khi chuẩn hóa tỷ lệ.
- **Thám hiểm**: một chuyến tại một thời điểm, mang về nguyên liệu, vàng và XP. Đồng hồ dùng thời gian tuyệt đối, có thể hoàn tất khi đóng trang; nhận thưởng một lần khi trở lại.
- **3 tuyến nâng cấp**, tổng 37 cấp: may mắn, tốc độ quay và vàng mỗi lượt. **6 cổ vật** có hiệu ứng cộng dồn. Thuốc may mắn +1,5 trong 2 phút, có thể cộng dồn thời gian.
- **Boss Kẻ nuốt sao**: trận đánh theo lượt từ cấp 3. Tấn công, phòng thủ giảm 75% sát thương nhận vào, bùng nổ gây 2,4× sát thương mỗi ba lượt. Thắng nhận 1.600 vàng, 2 tinh chất, 8 tinh thể và 400 XP. Hồi phục 2 phút sau chiến thắng, 30 giây sau thua hoặc rút lui.
- **4 nhiệm vụ mỗi ngày**, quà đăng nhập với chuỗi ngày, **10 thành tựu**, nhật ký 60 sự kiện. Nhiệm vụ làm mới theo ngày trên máy người chơi.
- **Mưa sao băng**: 5 phút đầu mỗi chu kỳ 15 phút theo đồng hồ hệ thống, may mắn +0,35.
- **Tái sinh**: cần cấp 15, 500 lượt quay, 15.000 vàng. Reset XP và ba tuyến nâng cấp; tiêu hao 15.000 vàng. Giữ aura, nguyên liệu, vùng, cổ vật và thành tựu. Mỗi lần tăng vĩnh viễn +0,3 may mắn, +12 sức mạnh.

## Tiến trình và khả năng truy cập

Tự động lưu bằng `localStorage` dưới khóa `astra-rng-save-v1`. Thiết lập có xuất/nhập JSON được kiểm tra cấu trúc, xác nhận trước khi thay thế và reset phải nhập ASTRA. Nếu lưu trữ bị chặn, trạng thái cảnh báo và chức năng xuất file vẫn có sẵn. Bản lưu không hợp lệ được sao lưu riêng trước khi bắt đầu mới. Tiến trình gắn với trình duyệt và origin; dùng xuất/nhập để chuyển máy hoặc cổng phục vụ.

Game hỗ trợ điện thoại, điều hướng bằng bàn phím, giữ focus trong hộp thoại, `prefers-reduced-motion`, tùy chọn giảm chuyển động và âm thanh tắt mặc định. Khi mở hộp thoại, quay tự động tạm dừng; một lượt đang chạy vẫn hoàn thành.

## Giao diện và chuyển động

- Nền tinh vân, các lớp sao có chuyển động nhẹ theo con trỏ và sao băng; sự kiện Mưa sao băng tăng số vệt sao.
- Quay thưởng qua ba giai đoạn Khơi nguồn → Cộng hưởng → Hiển lộ, với vòng năng lượng, thanh tiến trình và sóng ánh sáng lúc nhận aura. Quay ×10 hiển thị aura có độ hiếm cao nhất tại trạm quan sát.
- Màn nhận aura Huyền thoại, Thần thoại và Thiên giới có màu, tiêu đề và ánh sáng riêng. Các thẻ kết quả lần lượt xuất hiện; số vàng và lượt quay chuyển mượt.
- Nút bấm có gợn sóng; thẻ aura, cổ vật và vùng có ánh sáng theo vị trí chuột. Chế tạo, phần thưởng và lên cấp có bụi sao; hiệu ứng được dọn sau khi hoàn tất.
- Boss có hiệu ứng chém, phòng thủ, sóng bùng nổ và số sát thương. Các hành động khóa ngắn 420–600 ms khi hiệu ứng đang diễn ra; chế độ giảm chuyển động bỏ khoảng khóa này.
- Thanh điều hướng dưới trên điện thoại cho phép đổi cả năm màn hình bằng một lần chạm. Mục tiêu tiếp theo giúp theo dõi mở quay ×10, mở vùng, chế tạo và tái sinh.
- Cả tùy chọn trong game và thiết lập giảm chuyển động của hệ điều hành đều tắt các chuyển động trang trí, vẫn giữ phần thưởng, trạng thái và tiến trình game.

Đây là bản game chơi đơn hoàn chỉnh. Tài khoản, đồng bộ cloud, giao dịch và multiplayer chưa được triển khai.

## Cấu trúc

```text
src/game/data.ts         Aura, vùng, công thức, nhiệm vụ, thành tựu
src/game/engine.ts       RNG, tiến trình, chiến đấu, kinh tế và kiểm tra bản lưu
src/game/engine.test.ts  Kiểm thử logic độc lập với giao diện
src/components/Art.tsx  Canvas sao, phong cảnh SVG, hành tinh
src/components/Screens.tsx  Các màn hình nội dung
src/components/Ui.tsx   Hộp thoại, thanh tiến trình và thành phần chung
src/components/Motion.tsx  Quay ba giai đoạn, phản hồi tương tác và hiệu ứng thưởng
src/App.tsx             Tương tác, tự động quay, âm thanh và lưu trữ
src/styles.css          Giao diện responsive và hiệu ứng
src/motion.css          Lớp giao diện và chuyển động nâng cao
```

Mỗi task cloud đã được cô lập. Dùng checkout hiện có; không cần tạo Git worktree.
