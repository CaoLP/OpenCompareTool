# OpenCompare Tool

> **Professional Cross-Platform Diff & Sync Tool**  
> Hỗ trợ so sánh tập tin & thư mục đa nền tảng (**Windows & macOS**), kết nối trực tiếp giữa môi trường **Local $\leftrightarrow$ Server (Linux qua SFTP / SSH, Windows Server qua SMB/SFTP)** với cơ chế Atomic Sync an toàn.

---

## ✨ Tính năng nổi bật (Key Features)

- ⚡ **Siêu nhẹ & Hiệu năng cao:** Được xây dựng bằng **Rust + Tauri v2 + React/TypeScript**, dung lượng cài đặt < 20MB, khởi động dưới 1 giây, tiêu thụ cực ít RAM.
- 🌲 **Folder Compare (So sánh Thư mục thông minh):**
  - Giao diện Dual-Pane Tree Table cân chỉnh hàng tự động.
  - Thuật toán so sánh 3 tầng: Metadata $\rightarrow$ Remote Hash $\rightarrow$ On-demand Content.
  - Bộ lọc trạng thái: Khác nhau (Diff), Chỉ bên trái (Left only), Chỉ bên phải (Right only), Giống nhau (Same).
- 📝 **Side-by-Side File Diff Editor:**
  - Tích hợp **Monaco Diff Editor** (VS Code engine).
  - So sánh trực quan theo từng dòng và từng ký tự thay đổi (Intra-line diff).
  - Cho phép chỉnh sửa trực tiếp và nhấn **Save & Upload** để ghi ngược lại Server/Local an toàn.
- 🌐 **Virtual File System (VFS) & Remote Server Support:**
  - Kết nối máy chủ **Linux qua SFTP (SSH)** hỗ trợ cả Password và SSH Private Key (RSA, Ed25519).
  - Hỗ trợ máy chủ **Windows Server qua SMB / OpenSSH**.
  - Kiểm tra kết nối nhanh (Test Connection).
- 🚀 **Atomic Copy & Sync Engine:**
  - Cơ chế ghi file tạm (`.tmp`) rồi thực hiện Atomic Rename giúp chống hỏng dữ liệu khi mất mạng đột ngột.
  - Tự động bảo toàn thời gian sửa đổi (`mtime`) sau khi copy.
  - Hàng đợi truyền tải (Transfer Progress Queue) hiển thị chi tiết tiến trình.

---

## 🛠️ Cài đặt & Phát triển (Development)

### Yêu cầu hệ thống:
- **Node.js:** v18 trở lên
- **Rust & Cargo:** v1.77 trở lên
- **Hệ điều hành:** Windows 10/11 hoặc macOS 11+

### Khởi chạy chế độ phát triển:
```bash
# Cài đặt dependencies
npm install

# Chạy ứng dụng chế độ dev (Tauri App + Hot Reload)
npm run tauri dev
```

### Đóng gói ứng dụng (Build Release):
```bash
# Đóng gói ra file .exe/.msi (Windows) hoặc .dmg (macOS)
npm run tauri build
```

---

## 📂 Cấu trúc thư mục

- `docs/`: Tài liệu phân tích nghiệp vụ (**BA Requirements**) & Kiến trúc kỹ thuật (**Architecture Design**).
- `src/`: Giao diện người dùng (React, TypeScript, Tailwind CSS, Monaco Editor).
- `src-tauri/`: Nhân xử lý Backend (Rust, Tokio, SFTP/SSH2, Myers Diff Engine, VFS).
- `.github/workflows/`: CI/CD tự động build release đa nền tảng cho Windows & macOS.

---

## 📄 Bản quyền (License)
Phát triển bởi CaoLP. Giấy phép MIT.
