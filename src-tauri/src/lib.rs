pub mod models;
pub mod vfs;
pub mod diff;
pub mod transfer;
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::pick_directory,
            commands::test_sftp_connection,
            commands::list_vfs_directory,
            commands::compare_vfs_directories,
            commands::read_vfs_file_content,
            commands::write_vfs_file_content,
            commands::copy_vfs_item,
            commands::delete_vfs_item,
            commands::get_text_diff,
            commands::sync_vfs_batch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
