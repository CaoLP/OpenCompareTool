use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VfsProtocol {
    Local,
    Sftp,
    Smb,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SftpAuth {
    pub username: String,
    pub password: Option<String>,
    pub key_path: Option<String>,
    pub passphrase: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VfsLocation {
    pub protocol: VfsProtocol,
    pub path: String,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub sftp_auth: Option<SftpAuth>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub name: String,
    pub relative_path: String,
    pub is_dir: bool,
    pub size: u64,
    pub mtime: i64, // Unix timestamp (seconds)
    pub hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DiffStatus {
    Same,
    Different,
    LeftOnly,
    RightOnly,
    LeftNewer,
    RightNewer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparisonRow {
    pub relative_path: String,
    pub name: String,
    pub is_dir: bool,
    pub left_item: Option<FileItem>,
    pub right_item: Option<FileItem>,
    pub status: DiffStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompareResult {
    pub rows: Vec<ComparisonRow>,
    pub total_left: usize,
    pub total_right: usize,
    pub diff_count: usize,
    pub same_count: usize,
    pub left_only_count: usize,
    pub right_only_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextDiffHunk {
    pub change_type: String, // "equal", "delete", "insert", "replace"
    pub left_lines: Vec<String>,
    pub right_lines: Vec<String>,
    pub left_start: usize,
    pub right_start: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContentDiff {
    pub left_path: String,
    pub right_path: String,
    pub left_content: String,
    pub right_content: String,
    pub hunks: Vec<TextDiffHunk>,
    pub is_binary: bool,
}
