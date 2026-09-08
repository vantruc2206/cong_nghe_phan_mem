# HƯỚNG DẪN COMMIT TASK VÀ ĐỒNG BỘ NỘI DUNG NHÓM SMART DRONE DELIVERY

Tài liệu này hướng dẫn chi tiết cách **5 thành viên nhóm** thực hiện **commit các task thực tế trên Git** về nhánh `dev`.

---

## 📌 QUY TRÌNH THỰC HIỆN DÀNH CHO CÁC THÀNH VIÊN (ĐỌC KỸ TRƯỚC KHI CHẠY)

1. **Tải bộ code mới nhất:** Nhận file nén code, giải nén và chép đè toàn bộ vào thư mục dự án trên máy của bạn.
2. **Thực hiện linh hoạt (Không bắt buộc theo thứ tự):** 
   - Lệnh dưới đây đã có sẵn `git pull origin dev` ở đầu. Ai rảnh lúc nào chỉ cần mở Terminal chạy lúc đó.
   - Nếu khi bấm `git push` bị bận/xung đột nhẹ, bạn chỉ cần chạy lại lệnh lần nữa là xong.
3. **Cách chạy lệnh:** Mở thư mục dự án trên **VS Code** ➔ Mở **Terminal** (bấm `Ctrl + ~`) ➔ Copy nguyên văn lệnh tương ứng với tên mình ➔ Paste vào Terminal ➔ Bấm **Enter**.

---

## 👨‍💻 1. NGUYỄN MINH ĐĂNG (MINH)
*   **Tên Task:** `CNPM-32 [FE-BE] Kết nối quản lý Drone thực tế và cập nhật báo cáo SRS`
*   **Lệnh chạy Terminal:**

```bash
git checkout dev && git pull origin dev && git add "Giao diện web quản lý/src/pages/DronesScreen.tsx" "Giao diện web quản lý/src/components/AdminTrackingMap.tsx" backend/src/services/drone_simulator_service.py backend/src/services/drone_service.py srs/baocao_duan.pdf srs/chapters/phan5.tex srs/chapters/phan6.tex srs/so-do/sodo-tuantu/seq_update_cancel_order.pdf && git commit -m "CNPM-32 [FE-BE] Kết nối quản lý Drone thực tế và cập nhật báo cáo SRS" && git push origin dev
```

---

## 👨‍💻 2. ĐAN NGỌC SƠN (SƠN)
*   **Tên Task:** `CNPM-33 [FE-BE] Phát triển luồng duyệt đơn, lập lịch cất cánh và xử lý sự cố`
*   **Lệnh chạy Terminal:**

```bash
git checkout dev && git pull origin dev && git add "Giao diện web quản lý/src/pages/OrdersScreen.tsx" "Giao diện web quản lý/src/pages/OrderDetailScreen.tsx" "Giao diện web quản lý/src/pages/SchedulingScreen.tsx" "Giao diện web quản lý/src/pages/FailedScreen.tsx" "Giao diện web quản lý/src/pages/ActivityLogScreen.tsx" backend/src/api/schemas/order.py backend/src/services/order_service.py backend/src/infrastructure/repositories/order_repository.py && git commit -m "CNPM-33 [FE-BE] Phát triển luồng duyệt đơn, lập lịch cất cánh và xử lý sự cố" && git push origin dev
```

---

## 👩‍💻 3. ĐẶNG THỊ MỸ NHÂN (NHÂN)
*   **Tên Task:** `CNPM-34 [FE] Cải thiện giao diện Admin Portal, Modal cài đặt và quản lý trạm`
*   **Lệnh chạy Terminal:**

```bash
git checkout dev && git pull origin dev && git add "Giao diện web quản lý/package.json" "Giao diện web quản lý/package-lock.json" "Giao diện web quản lý/src/App.tsx" "Giao diện web quản lý/src/api.ts" "Giao diện web quản lý/src/types.ts" "Giao diện web quản lý/src/components/Header.tsx" "Giao diện web quản lý/src/components/Sidebar.tsx" "Giao diện web quản lý/src/components/AdminProfileModal.tsx" "Giao diện web quản lý/src/components/SystemSettingsModal.tsx" "Giao diện web quản lý/src/pages/DashboardScreen.tsx" "Giao diện web quản lý/src/pages/StationsScreen.tsx" "Giao diện web quản lý/src/pages/AIEtaScreen.tsx" "Giao diện web quản lý/src/pages/ReportsScreen.tsx" "Giao diện web quản lý/src/pages/TrackingScreen.tsx" "Giao diện web quản lý/src/pages/UsersScreen.tsx" && git commit -m "CNPM-34 [FE] Cải thiện giao diện Admin Portal, Modal cài đặt và quản lý trạm" && git push origin dev
```

---

## 👩‍💻 4. NGUYỄN THÙY TRANG (TRANG)
*   **Tên Task:** `CNPM-35 [FE-BE] Đồng bộ toàn diện Giao diện Web Khách hàng và API thông tin cá nhân`
*   **Lệnh chạy Terminal:**

```bash
git checkout dev && git pull origin dev && git add "giao diện web khách hàng/" backend/src/api/controllers/customer_controller.py backend/src/services/customer_service.py && git commit -m "CNPM-35 [FE-BE] Đồng bộ toàn diện Giao diện Web Khách hàng và API thông tin cá nhân" && git push origin dev
```

---

## 👨‍💻 5. HUỲNH VĂN TRỰC (LEAD)
*   **Tên Task:** `CNPM-36 [FE-BE] Tích hợp AI Chatbot SmartDrone (Groq LLM + RAG) và Tối ưu kết nối CSDL PostgreSQL`
*   **Lệnh chạy Terminal:**

```bash
git checkout dev && git pull origin dev && git add backend/src/services/chatbot_service.py backend/src/api/controllers/chatbot_controller.py backend/src/infrastructure/repositories/chatbot_repository.py backend/src/infrastructure/databases/database_postgres.py backend/src/infrastructure/databases/postgres.py backend/src/app.py backend/src/config.py && git commit -m "CNPM-36 [FE-BE] Tích hợp AI Chatbot SmartDrone (Groq LLM + RAG) và Tối ưu kết nối CSDL PostgreSQL" && git push origin dev
```

---

## 🏁 BƯỚC HOÀN TẤT
Sau khi cả 5 thành viên chạy xong lệnh Terminal tương ứng với mình:
```bash
git pull origin dev
```
Toàn bộ commit của 5 thành viên sẽ được cập nhật đồng bộ hoàn hảo trên nhánh `dev` của repository dự án!
