export type VfsProtocol = 'local' | 'sftp' | 'smb';

export interface SftpAuth {
  username: string;
  password?: string;
  key_path?: string;
  passphrase?: string;
}

export interface VfsLocation {
  protocol: VfsProtocol;
  path: string;
  host?: string;
  port?: number;
  sftp_auth?: SftpAuth;
}

export interface FileItem {
  name: string;
  relative_path: string;
  is_dir: boolean;
  size: number;
  mtime: number;
  hash?: string;
}

export type DiffStatus = 
  | 'same'
  | 'different'
  | 'left_only'
  | 'right_only'
  | 'left_newer'
  | 'right_newer';

export interface ComparisonRow {
  relative_path: string;
  name: string;
  is_dir: boolean;
  left_item?: FileItem | null;
  right_item?: FileItem | null;
  status: DiffStatus;
}

export interface CompareResult {
  rows: ComparisonRow[];
  total_left: number;
  total_right: number;
  diff_count: number;
  same_count: number;
  left_only_count: number;
  right_only_count: number;
}

export interface TextDiffHunk {
  change_type: 'equal' | 'delete' | 'insert' | 'replace';
  left_lines: string[];
  right_lines: string[];
  left_start: number;
  right_start: number;
}

export interface FileContentDiff {
  left_path: string;
  right_path: string;
  left_content: string;
  right_content: string;
  hunks: TextDiffHunk[];
  is_binary: boolean;
}

export type FilterMode = 'all' | 'diff' | 'same' | 'left_only' | 'right_only';
