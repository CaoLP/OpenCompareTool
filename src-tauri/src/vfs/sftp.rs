use std::net::TcpStream;
use std::path::Path;
use std::io::{Read, Write};
use ssh2::Session;

use crate::models::{FileItem, VfsLocation};

pub fn create_ssh_session(location: &VfsLocation) -> Result<Session, String> {
    let host = location.host.as_deref().ok_or("Chưa cung cấp Host của máy chủ")?;
    let port = location.port.unwrap_or(22);
    let auth = location.sftp_auth.as_ref().ok_or("Chưa cung cấp thông tin xác thực SSH")?;

    let tcp = TcpStream::connect(format!("{}:{}", host, port))
        .map_err(|e| format!("Không thể kết nối tới {}:{}: {}", host, port, e))?;

    let mut session = Session::new().map_err(|e| e.to_string())?;
    session.set_tcp_stream(tcp);
    session.handshake().map_err(|e| format!("SSH handshake thất bại: {}", e))?;

    if let Some(ref key_path) = auth.key_path {
        let pubkey_path = format!("{}.pub", key_path);
        let pubkey = if Path::new(&pubkey_path).exists() {
            Some(Path::new(&pubkey_path))
        } else {
            None
        };
        session.userauth_pubkey_file(
            &auth.username,
            pubkey,
            Path::new(key_path),
            auth.passphrase.as_deref(),
        ).map_err(|e| format!("Xác thực bằng SSH Key thất bại: {}", e))?;
    } else if let Some(ref password) = auth.password {
        session.userauth_password(&auth.username, password)
            .map_err(|e| format!("Xác thực Password thất bại: {}", e))?;
    } else {
        session.userauth_agent(&auth.username)
            .map_err(|e| format!("Xác thực SSH Agent thất bại: {}", e))?;
    }

    if !session.authenticated() {
        return Err("Xác thực SSH thất bại: Sai thông tin đăng nhập".to_string());
    }

    Ok(session)
}

pub fn scan_sftp_directory(location: &VfsLocation) -> Result<Vec<FileItem>, String> {
    let session = create_ssh_session(location)?;
    let sftp = session.sftp().map_err(|e| format!("Khởi tạo SFTP thất bại: {}", e))?;
    let root_path = &location.path;

    let mut items = Vec::new();
    let mut dir_queue = vec![root_path.clone()];

    while let Some(current_dir) = dir_queue.pop() {
        let path_obj = Path::new(&current_dir);
        let entries = match sftp.readdir(path_obj) {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        for (entry_path, stat) in entries {
            let filename = match entry_path.file_name() {
                Some(name) => name.to_string_lossy().to_string(),
                None => continue,
            };

            if filename == "." || filename == ".." {
                continue;
            }

            let full_str = entry_path.to_string_lossy().replace('\\', "/");
            let rel_path = if full_str.starts_with(root_path) {
                let trimmed = full_str[root_path.len()..].trim_start_matches('/');
                trimmed.to_string()
            } else {
                filename.clone()
            };

            let is_dir = stat.is_dir();
            let size = if is_dir { 0 } else { stat.size.unwrap_or(0) };
            let mtime = stat.mtime.unwrap_or(0) as i64;

            items.push(FileItem {
                name: filename,
                relative_path: rel_path,
                is_dir,
                size,
                mtime,
                hash: None,
            });

            if is_dir {
                dir_queue.push(full_str);
            }
        }
    }

    Ok(items)
}

pub fn read_sftp_file(location: &VfsLocation, relative_path: &str) -> Result<String, String> {
    let session = create_ssh_session(location)?;
    let sftp = session.sftp().map_err(|e| e.to_string())?;

    let full_path = format!("{}/{}", location.path.trim_end_matches('/'), relative_path.trim_start_matches('/'));
    let mut remote_file = sftp.open(Path::new(&full_path)).map_err(|e| format!("Không thể mở file {}: {}", full_path, e))?;

    let mut content = String::new();
    remote_file.read_to_string(&mut content).map_err(|e| format!("Không thể đọc nội dung file: {}", e))?;

    Ok(content)
}

pub fn write_sftp_file(location: &VfsLocation, relative_path: &str, content: &str) -> Result<(), String> {
    let session = create_ssh_session(location)?;
    let sftp = session.sftp().map_err(|e| e.to_string())?;

    let full_path = format!("{}/{}", location.path.trim_end_matches('/'), relative_path.trim_start_matches('/'));
    
    // Đảm bảo thư mục cha tồn tại
    if let Some(parent) = Path::new(&full_path).parent() {
        let parent_str = parent.to_string_lossy().replace('\\', "/");
        let _ = sftp.mkdir(Path::new(&parent_str), 0o755);
    }

    // Atomic write on SFTP: write to .tmp then rename
    let tmp_path = format!("{}.optmp_{}", full_path, chrono::Utc::now().timestamp_millis());
    let mut remote_file = sftp.create(Path::new(&tmp_path)).map_err(|e| format!("Không thể tạo file tạm trên server: {}", e))?;
    remote_file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
    drop(remote_file);

    // Rename to destination
    let _ = sftp.unlink(Path::new(&full_path)); // Xóa file cũ nếu có
    sftp.rename(Path::new(&tmp_path), Path::new(&full_path), None).map_err(|e| format!("Lỗi đổi tên file atomic trên server: {}", e))?;

    Ok(())
}

pub fn delete_sftp_item(location: &VfsLocation, relative_path: &str) -> Result<(), String> {
    let session = create_ssh_session(location)?;
    let sftp = session.sftp().map_err(|e| e.to_string())?;

    let full_path = format!("{}/{}", location.path.trim_end_matches('/'), relative_path.trim_start_matches('/'));
    let path_obj = Path::new(&full_path);

    if let Ok(stat) = sftp.stat(path_obj) {
        if stat.is_dir() {
            sftp.rmdir(path_obj).map_err(|e| e.to_string())?;
        } else {
            sftp.unlink(path_obj).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
