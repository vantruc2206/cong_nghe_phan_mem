MỤC TIÊU DỰ ÁN: BỔ SUNG & HOÀN THIỆN LAYER INFLASTRUCTURE & API THEO CƠ SỞ DỮ LIỆU

Vui lòng thực hiện tái cấu trúc và phát triển backend dựa trên các quy tắc nghiêm ngặt sau:

1. Nguồn dữ liệu (Database Source)
Sử dụng các bảng đã được định nghĩa trong file SQL tại đường dẫn: database/smartdronedelivery.sql.

2. Chuẩn mực Code & Định dạng (Code Style & Structure Rules)
Học mẫu (Pattern): Tham khảo kỹ cách bố trí, cách tổ chức thư mục, style code và pattern triển khai hiện có tại:

C:\bài tập\dự án học tập\dự án công nghệ phần mềm\backend\src\infrastructure\models\app

Quy tắc đặt tên File Models: Giữ nguyên cấu trúc thư mục hiện tại. Tất cả các file Model mới/sửa đổi phải thêm tiền tố app_ vào đầu tên file (Ví dụ: app_user, app_order).

Cấu hình Schema & Init: Cập nhật file khởi tạo (init / index của models). KHÔNG để các bảng/model ở schema public mặc định nữa. Phải phân loại và chỉ định rõ ràng vào các Schema tương ứng với chức năng (ví dụ: schema app, schema auth, ...).

3. Phát triển API Controllers & Schemas
Tạo mới / Ghi đè (Overwrite): Tiến hành thay thế hoàn toàn (không giữ lại code cũ) và phát triển mới các module tại 2 đường dẫn:

backend/src/api/controllers

C:\bài tập\dự án học tập\dự án công nghệ phần mềm\backend\src\infrastructure\schemas (hoặc backend/src/api/schemas)

Các Controller và Schema Validation phải tương ứng 1-1 với từng cụm chức năng/nghiệp vụ của ứng dụng được trích xuất từ database.

Yêu cầu đầu ra: Hãy liệt kê danh sách các file sẽ tạo/thay đổi, sau đó tiến hành sinh code chi tiết từng file theo đúng chuẩn mực trên.