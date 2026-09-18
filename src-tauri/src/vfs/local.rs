use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;
use jwalk::WalkDir;
use sha2::{Sha256, Digest};
use std::io::Read;

use crate::models::FileItem;

pub fn scan_local_directory(base_path: &str, compute_hash_for_files: bool) -> Result<Vec<FileItem>, String> {
    let root = Path::new(base_path);
    if !root.exists() {
        return Err(format!("Đường dẫn không tồn tại: {}", base_path));
    }

    let mut items = Vec::new();

    // jwalk scans directory entries concurrently across all CPU cores
    for entry_result in WalkDir::new(root).skip_hidden(false).follow_links(false) {
        let entry = match entry_result {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if path == root {
            continue;
        }

        let rel_path = match path.strip_prefix(root) {
            Ok(p) => p.to_string_lossy().replace('\\', "/"),
            Err(_) => continue,
        };

        let file_name = entry.file_name.to_string_lossy().to_string();
        let is_dir = entry.file_type.is_dir();

        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let size = if is_dir { 0 } else { metadata.len() };
        let mtime = metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        let hash = if !is_dir && compute_hash_for_files && size < 50 * 1024 * 1024 {
            calculate_local_hash(&path).ok()
        } else {
            None
        };

        items.push(FileItem {
            name: file_name,
            relative_path: rel_path,
            is_dir,
            size,
            mtime,
            hash,
        });
    }

    Ok(items)
}

pub fn calculate_local_hash(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];

    loop {
        let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }

    Ok(hex::encode(hasher.finalize()))
}

pub fn read_local_file(base_path: &str, relative_path: &str) -> Result<String, String> {
    let full_path = Path::new(base_path).join(relative_path);
    fs::read_to_string(&full_path).map_err(|e| format!("Không thể đọc file {}: {}", full_path.display(), e))
}

pub fn write_local_file(base_path: &str, relative_path: &str, content: &str) -> Result<(), String> {
    let full_path = Path::new(base_path).join(relative_path);
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Atomic write: write to temp file then rename
    let tmp_path = full_path.with_extension(format!("optmp_{}", chrono::Utc::now().timestamp_millis()));
    fs::write(&tmp_path, content).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, &full_path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_local_item(base_path: &str, relative_path: &str) -> Result<(), String> {
    let full_path = Path::new(base_path).join(relative_path);
    if full_path.is_dir() {
        fs::remove_dir_all(&full_path).map_err(|e| e.to_string())?;
    } else if full_path.is_file() {
        fs::remove_file(&full_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
