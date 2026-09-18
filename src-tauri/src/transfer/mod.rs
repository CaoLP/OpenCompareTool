use crate::models::VfsLocation;
use crate::vfs;

pub fn copy_item(
    src_location: &VfsLocation,
    dest_location: &VfsLocation,
    relative_path: &str,
) -> Result<(), String> {
    // Đọc từ nguồn
    let content = vfs::read_file(src_location, relative_path)?;
    // Ghi sang đích (đã hỗ trợ atomic write)
    vfs::write_file(dest_location, relative_path, &content)?;
    Ok(())
}

pub fn sync_items_batch(
    src_location: &VfsLocation,
    dest_location: &VfsLocation,
    items: Vec<String>,
) -> Result<Vec<(String, bool, Option<String>)>, String> {
    let mut results = Vec::new();

    for rel_path in items {
        match copy_item(src_location, dest_location, &rel_path) {
            Ok(_) => results.push((rel_path, true, None)),
            Err(e) => results.push((rel_path, false, Some(e))),
        }
    }

    Ok(results)
}
