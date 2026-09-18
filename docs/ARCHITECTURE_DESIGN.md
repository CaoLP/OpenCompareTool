# TÀI LIỆU THIẾT KẾ KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE)
## DỰ ÁN: OPENCOMPARE TOOL

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

OpenCompareTool được xây dựng theo mô hình **Hybrid Architecture**:
* **Frontend:** Single Page Application (SPA) chạy trên Webview Native với React 18/19, TypeScript, Tailwind CSS, Lucide Icons và Monaco Editor.
* **Backend:** Native High-Performance Rust Core chịu trách nhiệm xử lý Virtual File System (VFS), Streaming I/O, Myers Diff Engine và Network Protocols (SFTP / SMB).
* **Giao tiếp IPC:** Tauri v2 Type-Safe Command / Event System.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  React 18/19 (TypeScript) + Tailwind CSS + Lucide Icons + Monaco Diff  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC (Tauri v2 Invoke & Events)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        TAURI BRIDGE & APP STATE                        │
│          Command Handlers • Connection Pool • Background Tasks         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  VFS Module  │             │ Diff Engine  │             │ Transfer Mgr │
│ (Local/SFTP) │             │ (Myers/Hash) │             │(Atomic/Sync) │
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 2. MODULE VIRTUAL FILE SYSTEM (VFS)

### 2.1. Thiết kế Trait `VfsProvider`
Mọi nguồn lưu trữ (Local, SFTP, SMB) đều cài đặt chung một giao diện (Trait) để tái sử dụng toàn bộ logic so sánh và đồng bộ:

```rust
#[async_trait]
pub trait VfsProvider: Send + Sync {
    async fn list_dir(&self, path: &str) -> Result<Vec<FileEntry>, VfsError>;
    async fn get_metadata(&self, path: &str) -> Result<FileMetadata, VfsError>;
    async fn read_file(&self, path: &str) -> Result<Vec<u8>, VfsError>;
    async fn write_file(&self, path: &str, data: &[u8]) -> Result<(), VfsError>;
    async fn atomic_write(&self, path: &str, data: &[u8]) -> Result<(), VfsError>;
    async fn set_mtime(&self, path: &str, mtime_utc: i64) -> Result<(), VfsError>;
    async fn delete_file(&self, path: &str) -> Result<(), VfsError>;
    async fn compute_hash(&self, path: &str) -> Result<String, VfsError>;
}
```

### 2.2. Chi tiết các Driver
1. **LocalDriver (`local.rs`):**
   * Sử dụng `tokio::fs` cho các thao tác bất đồng bộ non-blocking.
   * `walkdir` để quét nhanh cây thư mục local đa luồng.
2. **SftpDriver (`sftp.rs`):**
   * Sử dụng `ssh2` / `russh` để mở phiên SFTP subsystem.
   * Hỗ trợ xác thực: Password hoặc Private Key (RSA, ECDSA, Ed25519) kèm passphrase.
   * Gửi lệnh `sha256sum` hoặc `md5sum` qua SSH Exec channel để lấy hash từ xa nhanh chóng mà không cần tải file về.

---

## 3. THUẬT TOÁN SO SÁNH (DIFF ENGINE)

### 3.1. Thuật toán so sánh thư mục (Folder Alignment & Diff)
1. Lấy danh sách `FileEntry` từ cả 2 phía (Left & Right).
2. Chuẩn hóa đường dẫn tương đối (Relative Path) theo chuẩn POSIX `/` để tương thích giữa Windows (`\`) và Linux (`/`).
3. Thực hiện thuật toán hợp nhất 2 danh sách (Merge / Full Outer Join):
   * Nếu chỉ có ở Left $\rightarrow$ Trạng thái `LeftOnly`.
   * Nếu chỉ có ở Right $\rightarrow$ Trạng thái `RightOnly`.
   * Nếu có ở cả 2 bên:
     - So sánh `Size` và `Modified Time`:
       - Nếu trùng khớp $\rightarrow$ Trạng thái `Same`.
       - Nếu lệch nhau $\rightarrow$ Thực hiện so sánh `Hash` hoặc đánh dấu `Different` (kèm cờ `LeftNewer` hoặc `RightNewer`).

### 3.2. Thuật toán so sánh nội dung file (Text Diff)
* Sử dụng thư viện `similar` (Rust implementation của Myers Diff) để phân tích các khối:
  * `Equal` (giữ nguyên).
  * `Delete` (chỉ có bên trái / bị xóa).
  * `Insert` (chỉ có bên phải / thêm mới).
  * `Replace` (sửa đổi nội dung).

---

## 4. CHIẾN LƯỢC TRUYỀN TẢI FILE AN TOÀN (ATOMIC FILE TRANSFER)

Khi thực hiện Copy từ Local sang Server hoặc ngược lại:
1. Tạo tên file tạm: `{destination_path}.optmp_{timestamp}`.
2. Truyền luồng dữ liệu (Stream transfer) vào file tạm.
3. Sau khi ghi thành công 100%, gọi thao tác `rename` từ file tạm sang `{destination_path}`.
4. Gọi hàm `set_mtime` để đồng bộ thời gian sửa đổi của file đích trùng với file nguồn.
5. Gửi sự kiện cập nhật tiến trình `transfer_progress` về cho UI.

---

## 5. CẤU TRÚC THƯ MỤC SOURCE CODE

```text
OpenCompareTool/
├── docs/                                 # Toàn bộ tài liệu BA & Kiến trúc
│   ├── BA_REQUIREMENTS_SPECIFICATION.md
│   └── ARCHITECTURE_DESIGN.md
├── src/                                  # Mã nguồn Giao diện (React + TS)
│   ├── assets/
│   ├── components/
│   │   ├── DualPaneFolderCompare.tsx     # Bảng so sánh thư mục 2 bên
│   │   ├── MonacoDiffViewer.tsx          # Trình xem & sửa diff side-by-side
│   │   ├── RemoteConnectionModal.tsx     # Hộp thoại kết nối SFTP / SMB
│   │   ├── TransferQueuePanel.tsx        # Bảng quản lý tiến trình copy/sync
│   │   └── Toolbar.tsx                   # Thanh công cụ chính & bộ lọc
│   ├── types/
│   │   └── index.ts                      # Interface dữ liệu VFS & Diff
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                            # Mã nguồn Backend (Rust Core)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── commands.rs                   # Tauri IPC commands
│       ├── vfs/                          # Lớp trừu tượng VFS & Drivers
│       │   ├── mod.rs
│       │   ├── local.rs
│       │   └── sftp.rs
│       ├── diff/                         # Engine so sánh
│       │   ├── mod.rs
│       │   └── folder_matcher.rs
│       └── transfer/                     # Xử lý copy an toàn
│           └── copy_manager.rs
└── .github/
    └── workflows/
        └── release.yml                   # CI/CD tự động build Windows & macOS
```
