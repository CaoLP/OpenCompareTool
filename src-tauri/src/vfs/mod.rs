pub mod local;
pub mod sftp;

use crate::models::{FileItem, VfsLocation, VfsProtocol};

pub fn list_directory(location: &VfsLocation, compute_hash: bool) -> Result<Vec<FileItem>, String> {
    match location.protocol {
        VfsProtocol::Local | VfsProtocol::Smb => local::scan_local_directory(&location.path, compute_hash),
        VfsProtocol::Sftp => sftp::scan_sftp_directory(location),
    }
}

pub fn read_file(location: &VfsLocation, relative_path: &str) -> Result<String, String> {
    match location.protocol {
        VfsProtocol::Local | VfsProtocol::Smb => local::read_local_file(&location.path, relative_path),
        VfsProtocol::Sftp => sftp::read_sftp_file(location, relative_path),
    }
}

pub fn write_file(location: &VfsLocation, relative_path: &str, content: &str) -> Result<(), String> {
    match location.protocol {
        VfsProtocol::Local | VfsProtocol::Smb => local::write_local_file(&location.path, relative_path, content),
        VfsProtocol::Sftp => sftp::write_sftp_file(location, relative_path, content),
    }
}

pub fn delete_item(location: &VfsLocation, relative_path: &str) -> Result<(), String> {
    match location.protocol {
        VfsProtocol::Local | VfsProtocol::Smb => local::delete_local_item(&location.path, relative_path),
        VfsProtocol::Sftp => sftp::delete_sftp_item(location, relative_path),
    }
}
