# TÀI LIỆU PHÂN TÍCH YÊU CẦU NGHIỆP VỤ (BA SPECIFICATION)
## DỰ ÁN: OPENCOMPARE TOOL (CROSS-PLATFORM DIFF & SYNC TOOL)

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1. Bối cảnh & Mục tiêu (Business Context & Objectives)
Trong quá trình phát triển phần mềm, quản trị hệ thống và vận hành triển khai (DevOps/SysAdmin), nhu cầu so sánh cấu trúc thư mục, nội dung mã nguồn và dữ liệu cấu hình giữa môi trường cục bộ (**Local**) và các máy chủ từ xa (**Linux Server / Windows Server**) là cực kỳ lớn.

**OpenCompareTool** được xây dựng nhằm cung cấp giải pháp so sánh (diff) và đồng bộ (sync) tập tin/thư mục đa nền tảng (**Windows & macOS**), tối ưu hóa hiệu năng, dung lượng cài đặt siêu nhẹ (< 20MB), tốc độ khởi động nhanh và hỗ trợ trực tiếp các giao thức truyền file qua mạng (**SFTP, SMB**).

### 1.2. Đối tượng Người dùng Mục tiêu (User Personas)
* **Software Developers:** So sánh mã nguồn, kiểm tra thay đổi giữa các branch hoặc so sánh code local với code đang chạy trên dev server.
* **DevOps / SysAdmin:** So sánh các file cấu hình (`nginx.conf`, Docker compose, scripts, logs) giữa local và production/staging servers (Linux/Windows Server), đồng bộ hotfix an toàn.
* **Data Engineers / QA:** So sánh dữ liệu dạng text, JSON, CSV, logs giữa các môi trường để kiểm tra tính toàn vẹn.

---

## 2. PHẠM VI NGHIỆP VỤ (SCOPE OF WORK)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OPENCOMPARE TOOL SCOPE                          │
├──────────────────────────┬──────────────────────┬──────────────────────┤
│    Folder Comparison     │      File Diff       │  Remote Sync & VFS   │
│ ──────────────────────── │ ──────────────────── │ ──────────────────── │
│ • Dual-pane Tree View    │ • Side-by-side View  │ • Local File System  │
│ • 3-Tier Diff Match      │ • Intra-line Diff    │ • SFTP (Linux/SSH)   │
│ • Filter by Diff Status  │ • Syntax Highlight   │ • SMB (Win Server)   │
│ • Orphan/Modified Flags  │ • In-app Editing     │ • Atomic Copy/Sync   │
└──────────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 3.1. Phân hệ Quản lý Kết nối & VFS (Virtual File System)
* **FR-VFS-01 (Hỗ trợ Local File System):** Cho phép duyệt và chọn bất kỳ thư mục nào trên ổ đĩa máy tính (hỗ trợ đường dẫn Windows `C:\...` và macOS `/Users/...`).
* **FR-VFS-02 (Hỗ trợ SFTP - Linux Server):**
  * Kết nối máy chủ từ xa qua giao thức SFTP/SSH (cổng mặc định 22).
  * Hỗ trợ xác thực: Tên người dùng / Mật khẩu (Username/Password) và Khóa riêng tư (SSH Private Key: RSA, Ed25519).
* **FR-VFS-03 (Hỗ trợ Windows Server - SMB / OpenSSH):**
  * Hỗ trợ đường dẫn chia sẻ mạng SMB/UNC (`\\server\share`) hoặc kết nối qua OpenSSH Server trên Windows.
* **FR-VFS-04 (Session & Connection Profiles):**
  * Cho phép lưu thông tin kết nối thành các Profile/Session để mở lại nhanh mà không cần nhập lại mật khẩu/host.
  * Mật khẩu/Passphrase được mã hóa an toàn ở local.

---

### 3.2. Phân hệ So sánh Thư mục (Folder Compare Module)
* **FR-FC-01 (Dual-Pane Layout):** Hiển thị hai bảng điều khiển đặt cạnh nhau (Left Pane vs Right Pane) với các file/thư mục tương ứng được căn thẳng hàng theo chiều ngang.
* **FR-FC-02 (Thuật toán so sánh 3 tầng tối ưu mạng):**
  1. *Tầng 1 (Metadata):* So sánh kích thước (Size) và thời gian sửa đổi (Modified Time - UTC).
  2. *Tầng 2 (Remote Hash):* Tính toán SHA-256 trực tiếp trên server/local khi kích thước bằng nhau nhưng ngày sửa đổi khác nhau (không tải toàn bộ file về).
  3. *Tầng 3 (Content Diff):* Tải nội dung theo luồng (Stream) khi người dùng mở chi tiết file.
* **FR-FC-03 (Trạng thái khác biệt & Màu sắc nhận diện):**
  * **Different (Khác nhau):** File tồn tại ở cả 2 bên nhưng nội dung/hash khác nhau (Màu đỏ/cam).
  * **Left Newer / Right Newer:** Đánh dấu rõ bên nào có phiên bản mới hơn dựa trên timestamp.
  * **Left Only (Chỉ có bên trái):** File/thư mục chỉ tồn tại ở nguồn bên trái (Màu xanh/tím).
  * **Right Only (Chỉ có bên phải):** File/thư mục chỉ tồn tại ở nguồn bên phải.
  * **Same (Giống nhau):** Kích thước, timestamp và hash hoàn toàn trùng khớp (Màu xám/đen).
* **FR-FC-04 (Bộ lọc hiển thị - Display Filters):**
  * Nút lọc hiển thị: *Tất cả (Show All)*, *Chỉ hiện file khác nhau (Show Differences Only)*, *Chỉ hiện file đơn độc (Show Orphans)*, *Chỉ hiện file giống nhau (Show Same)*.
* **FR-FC-05 (Context Menu & Thao tác nhanh):**
  * Double-click: Mở chế độ so sánh nội dung file (File Diff).
  * Click chuột phải: Copy sang bên phải, Copy sang bên trái, Xóa file, Đổi tên, Mở trong Explorer/Finder.

---

### 3.3. Phân hệ So sánh Nội dung File (File Diff Module)
* **FR-FD-01 (Side-by-Side Diff View):**
  * Hiển thị 2 khung so sánh code/text cạnh nhau.
  * Đánh dấu màu từng dòng: Dòng thêm mới (Xanh lá), Dòng xóa (Đỏ), Dòng thay đổi (Vàng/Cam).
* **FR-FD-02 (Intra-line / Character Diff):**
  * Đánh dấu chi tiết từng ký tự/từ bị thay đổi trong cùng một dòng.
* **FR-FD-03 (Đồng bộ cuộn - Synchronized Scrolling):**
  * Khi cuộn khung bên trái, khung bên phải tự động cuộn theo tương ứng với vị trí dòng diff.
* **FR-FD-04 (Chỉnh sửa & Lưu trực tiếp - In-place Editing):**
  * Cho phép người dùng chỉnh sửa trực tiếp trên khung soạn thảo.
  * Hỗ trợ nút *Save & Upload* để ghi ngược lại file vào Local hoặc Server từ xa.
* **FR-FD-05 (Syntax Highlighting):** Tự động nhận diện ngôn ngữ lập trình (JavaScript, TypeScript, Python, Rust, JSON, YAML, HTML, CSS, SQL, Shell script, v.v.).

---

### 3.4. Phân hệ Sao chép & Đồng bộ (Copy & Sync Module)
* **FR-CS-01 (Thao tác sao chép đơn lẻ / nhiều file):**
  * Chọn một hoặc nhiều file/thư mục $\rightarrow$ Nhấn *Copy to Right* hoặc *Copy to Left*.
* **FR-CS-02 (Đồng bộ thư mục tự động - Synchronization Modes):**
  * **Mirror (Left to Right):** Cập nhật mọi thay đổi từ trái sang phải; xóa các file ở bên phải mà bên trái không có.
  * **Update (Left to Right):** Chỉ copy các file mới hơn hoặc chưa có từ trái sang phải, không xóa file thừa.
  * **Two-Way Sync (Đồng bộ 2 chiều):** Cập nhật file mới nhất ở cả 2 bên cho nhau.
* **FR-CS-03 (Atomic Transfer - Ghi an toàn chống đứt mạng):**
  * Khi copy lên server, ứng dụng ghi ra file tạm (`.uploading.tmp`), sau khi hoàn thành 100% mới thực hiện lệnh `rename` nguyên tử (atomic rename).
* **FR-CS-04 (Bảo toàn Metadata):**
  * Cập nhật lại thời gian sửa đổi (`mtime`) của file đích trùng khớp với file nguồn sau khi truyền tải thành công.
* **FR-CS-05 (Hàng đợi truyền tải - Transfer Queue Panel):**
  * Hiển thị danh sách các file đang chờ truyền, tiến trình phần trăm (%), tốc độ truyền (MB/s) và trạng thái thành công/thất bại.

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

| Mã NFR | Tiêu chí | Yêu cầu kỹ thuật |
| :--- | :--- | :--- |
| **NFR-01** | **Hiệu năng (Performance)** | Xử lý mượt mà cây thư mục chứa tới 50,000+ files nhờ cơ chế Virtual Scrolling & Đa luồng Rust. |
| **NFR-02** | **Dung lượng App (Lightweight)** | Bộ cài đặt Windows (`.exe`) và macOS (`.dmg`) có dung lượng < 20 MB. |
| **NFR-03** | **Thời gian khởi động (Startup Time)** | Thời gian mở ứng dụng lần đầu < 1.0 giây, mở các lần sau < 0.5 giây. |
| **NFR-04** | **Tài nguyên tiêu thụ (Resource Usage)** | Tiêu thụ RAM khi chạy chế độ nền < 80 MB (tối ưu gấp nhiều lần so với các app chạy Electron). |
| **NFR-05** | **Bảo mật (Security)** | Hỗ trợ chuẩn mã hóa SSH hiện đại (AES-256-GCM, Ed25519). Không lưu plain-text password vào file cấu hình. |
| **NFR-06** | **Tương thích (Compatibility)** | Chạy mượt trên Windows 10/11 (x64, ARM64) và macOS 11+ (cả Intel và Apple Silicon M1/M2/M3/M4). |

---

## 5. CÁC LUỒNG SỬ DỤNG ĐIỂN HÌNH (USE CASES & USER JOURNEYS)

### UC-01: So sánh Local Folder với Linux Server qua SFTP
1. Người dùng mở ứng dụng OpenCompareTool.
2. Tại khung bên trái (Left), chọn thư mục nguồn cục bộ: `D:\Projects\MyApp`.
3. Tại khung bên phải (Right), nhấn nút **Connect Remote**, chọn giao thức **SFTP**:
   - Nhập Host: `192.168.1.100`, Port: `22`, User: `root`, Authentication: `Private Key` (hoặc Password).
   - Chọn đường dẫn thư mục đích: `/var/www/myapp`.
4. Nhấn **Compare**:
   - Ứng dụng quét cấu trúc 2 bên trong nền (Background Thread).
   - Hiển thị danh sách file với các trạng thái màu sắc rõ ràng.
5. Người dùng click vào nút lọc **Diff Only** để xem nhanh các file bị thay đổi.
6. Double-click vào file `config.json` để mở giao diện Diff chi tiết so sánh từng dòng.
7. Nhấn nút **Copy to Server** để đẩy các file đã cập nhật từ local lên server an toàn.

---

## 6. TIÊU CHÍ CHẤP NHẬN DỰ ÁN (DEFINITION OF DONE - DOD)
- [x] Đầy đủ tài liệu BA & Kiến trúc hệ thống trong thư mục `docs/`.
- [ ] Backend Rust VFS hỗ trợ đầy đủ Local File System và SFTP.
- [ ] Giao diện Dual-pane Tree Table hiển thị chuẩn xác trạng thái khác biệt.
- [ ] Tích hợp Monaco Side-by-Side Diff Editor có chỉnh sửa & lưu trực tiếp.
- [ ] Tính năng Copy/Sync hoạt động tin cậy với cơ chế Atomic write và bảo toàn timestamp.
- [ ] Ứng dụng build thành công cho Windows và macOS qua GitHub Actions.
