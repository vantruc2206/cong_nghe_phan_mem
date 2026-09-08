# Hướng Dẫn Chạy Dự Án (SmartDroneDelivery)

Tài liệu này hướng dẫn cách chạy và vận hành cả hai phần **Backend** và **Frontend** trên hệ điều hành Windows (Sử dụng PowerShell).

---

## 1. Chạy Backend (Flask API)

Thư mục API của dự án nằm tại `backend/`.

### Bước 1: Di chuyển vào thư mục backend
Mở cửa sổ PowerShell mới và di chuyển chuột hoặc gõ lệnh:
```powershell
cd "c:\bài tập\dự án học tập\dự án công nghệ phần mềm\backend"
```

### Bước 2: Chạy Server API với môi trường ảo (Virtual Environment)
Dự án sử dụng môi trường ảo đặt tại thư mục cha (`.venv`). Bạn chạy câu lệnh sau để khởi động Backend tại cổng `9999`:
```powershell
..\.venv\Scripts\python src/app.py
```
*Lưu ý: Nếu server chạy thành công, màn hình sẽ hiển thị thông báo `Running on http://127.0.0.1:9999`.*

### Bước 3 (Tùy chọn): Nạp lại tài khoản Admin mẫu
Nếu cơ sở dữ liệu trống hoặc bạn chưa tạo tài khoản Admin, chạy lệnh dưới đây để tạo sẵn tài khoản nhập hệ thống:
```powershell
..\.venv\Scripts\python seed_admin.py
```
*   **Email tài khoản:** `admin@smartdrone.vn`
*   **Mật khẩu:** `123456`

---

## 2. Chạy Frontend (Giao Diện React Quản Lý)

Thư mục giao diện nằm tại `Giao diện web quản lý/`.

### Bước 1: Di chuyển vào thư mục Frontend
Mở một cửa sổ PowerShell mới khác (song song với cửa sổ Backend) và chạy:
```powershell
cd "c:\bài tập\dự án học tập\dự án công nghệ phần mềm\Giao diện web quản lý"
```

### Bước 2: Khởi chạy Client bằng NPM
Chạy lệnh bên dưới để mở server phát triển của Vite:
```powershell
npm run dev
```
*   Hệ thống sẽ build và chạy tại địa chỉ mặc định là: **`http://localhost:8443`**
*   Mở trình duyệt Google Chrome/Microsoft Edge và truy cập link trên để kiểm tra giao diện và đăng nhập.

---

## 3. Một Số Lỗi Thường Gặp
*   **Lỗi không nhận diện lệnh `cb`:** Lệnh di chuyển thư mục chuẩn là `cd` (Change Directory), không phải `cb`. Vui lòng gõ đúng: `cd "đường_dẫn"`.
*   **Lỗi CORS trên Trình duyệt:** Đã được cấu hình tự động cho phép mọi kết nối từ Giao diện tại cổng `8443` xuống API tại cổng `9999`. Hãy đảm bảo chạy cả 2 server đồng thời để các tính năng đồng bộ đúng.
