use crate::models::{CompareResult, FileContentDiff, FileItem, VfsLocation};
use crate::vfs;
use crate::diff;
use crate::transfer;

#[tauri::command]
pub async fn pick_directory(title: Option<String>) -> Result<Option<String>, String> {
    let mut dialog = rfd::AsyncFileDialog::new();
    if let Some(t) = title {
        dialog = dialog.set_title(t);
    }
    let folder = dialog.pick_folder().await;
    Ok(folder.map(|f| f.path().to_string_lossy().to_string()))
}

#[tauri::command]
pub fn test_sftp_connection(location: VfsLocation) -> Result<bool, String> {
    let session = vfs::sftp::create_ssh_session(&location)?;
    Ok(session.authenticated())
}

#[tauri::command]
pub async fn list_vfs_directory(location: VfsLocation, compute_hash: bool) -> Result<Vec<FileItem>, String> {
    tokio::task::spawn_blocking(move || {
        vfs::list_directory(&location, compute_hash)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn compare_vfs_directories(
    left: VfsLocation,
    right: VfsLocation,
    compute_hash: bool,
) -> Result<CompareResult, String> {
    tokio::task::spawn_blocking(move || {
        let (left_res, right_res) = rayon::join(
            || vfs::list_directory(&left, compute_hash),
            || vfs::list_directory(&right, compute_hash),
        );
        let left_items = left_res?;
        let right_items = right_res?;
        Ok(diff::compare_file_lists(left_items, right_items))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn read_vfs_file_content(
    location: VfsLocation,
    relative_path: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        vfs::read_file(&location, &relative_path)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn write_vfs_file_content(
    location: VfsLocation,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        vfs::write_file(&location, &relative_path, &content)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn copy_vfs_item(
    src: VfsLocation,
    dest: VfsLocation,
    relative_path: String,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        transfer::copy_item(&src, &dest, &relative_path)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_vfs_item(
    location: VfsLocation,
    relative_path: String,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        vfs::delete_item(&location, &relative_path)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_text_diff(
    left_location: VfsLocation,
    right_location: VfsLocation,
    relative_path: String,
) -> Result<FileContentDiff, String> {
    tokio::task::spawn_blocking(move || {
        let left_content = vfs::read_file(&left_location, &relative_path).unwrap_or_default();
        let right_content = vfs::read_file(&right_location, &relative_path).unwrap_or_default();
        let left_path_display = format!("{}/{}", left_location.path, relative_path);
        let right_path_display = format!("{}/{}", right_location.path, relative_path);

        Ok(diff::compute_file_diff(
            &left_path_display,
            &right_path_display,
            &left_content,
            &right_content,
        ))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_vfs_batch(
    src: VfsLocation,
    dest: VfsLocation,
    items: Vec<String>,
) -> Result<Vec<(String, bool, Option<String>)>, String> {
    tokio::task::spawn_blocking(move || {
        transfer::sync_items_batch(&src, &dest, items)
    }).await.map_err(|e| e.to_string())?
}
