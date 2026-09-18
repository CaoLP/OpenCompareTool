import { invoke } from '@tauri-apps/api/core';
import type { CompareResult, FileContentDiff, VfsLocation } from '../types';

export const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const pickDirectory = async (title?: string): Promise<string | null> => {
  if (isTauriEnvironment()) {
    try {
      return await invoke<string | null>('pick_directory', { title });
    } catch (e) {
      console.error('Lỗi khi mở hộp thoại chọn thư mục:', e);
      return null;
    }
  }
  return prompt('Nhập đường dẫn thư mục:') || null;
};

export const testSftpConnection = async (location: VfsLocation): Promise<boolean> => {
  if (isTauriEnvironment()) {
    return await invoke<boolean>('test_sftp_connection', { location });
  }
  return true;
};

export const compareDirectories = async (
  left: VfsLocation,
  right: VfsLocation,
  computeHash: boolean = false
): Promise<CompareResult> => {
  if (isTauriEnvironment()) {
    return await invoke<CompareResult>('compare_vfs_directories', {
      left,
      right,
      computeHash,
    });
  }

  // Mock data cho trình duyệt khi test UI
  return {
    rows: [
      {
        relative_path: 'src/components/Toolbar.tsx',
        name: 'Toolbar.tsx',
        is_dir: false,
        status: 'different',
        left_item: { name: 'Toolbar.tsx', relative_path: 'src/components/Toolbar.tsx', is_dir: false, size: 2450, mtime: Date.now() / 1000 },
        right_item: { name: 'Toolbar.tsx', relative_path: 'src/components/Toolbar.tsx', is_dir: false, size: 2120, mtime: (Date.now() - 3600000) / 1000 },
      },
      {
        relative_path: 'src/vfs/sftp.rs',
        name: 'sftp.rs',
        is_dir: false,
        status: 'left_newer',
        left_item: { name: 'sftp.rs', relative_path: 'src/vfs/sftp.rs', is_dir: false, size: 4890, mtime: Date.now() / 1000 },
        right_item: { name: 'sftp.rs', relative_path: 'src/vfs/sftp.rs', is_dir: false, size: 4800, mtime: (Date.now() - 7200000) / 1000 },
      },
      {
        relative_path: 'package.json',
        name: 'package.json',
        is_dir: false,
        status: 'same',
        left_item: { name: 'package.json', relative_path: 'package.json', is_dir: false, size: 570, mtime: Date.now() / 1000 },
        right_item: { name: 'package.json', relative_path: 'package.json', is_dir: false, size: 570, mtime: Date.now() / 1000 },
      },
      {
        relative_path: 'docs/BA_REQUIREMENTS_SPECIFICATION.md',
        name: 'BA_REQUIREMENTS_SPECIFICATION.md',
        is_dir: false,
        status: 'left_only',
        left_item: { name: 'BA_REQUIREMENTS_SPECIFICATION.md', relative_path: 'docs/BA_REQUIREMENTS_SPECIFICATION.md', is_dir: false, size: 6800, mtime: Date.now() / 1000 },
        right_item: null,
      },
      {
        relative_path: 'server/nginx.conf',
        name: 'nginx.conf',
        is_dir: false,
        status: 'right_only',
        left_item: null,
        right_item: { name: 'nginx.conf', relative_path: 'server/nginx.conf', is_dir: false, size: 1450, mtime: Date.now() / 1000 },
      }
    ],
    total_left: 4,
    total_right: 4,
    diff_count: 2,
    same_count: 1,
    left_only_count: 1,
    right_only_count: 1,
  };
};

export const readVfsFileContent = async (
  location: VfsLocation,
  relativePath: string
): Promise<string> => {
  if (isTauriEnvironment()) {
    return await invoke<string>('read_vfs_file_content', {
      location,
      relativePath,
    });
  }
  return `// Mock content of ${relativePath}\nconsole.log("Hello from compare tool");\n`;
};

export const writeVfsFileContent = async (
  location: VfsLocation,
  relativePath: string,
  content: string
): Promise<void> => {
  if (isTauriEnvironment()) {
    return await invoke<void>('write_vfs_file_content', {
      location,
      relativePath,
      content,
    });
  }
};

export const copyVfsItem = async (
  src: VfsLocation,
  dest: VfsLocation,
  relativePath: string
): Promise<void> => {
  if (isTauriEnvironment()) {
    return await invoke<void>('copy_vfs_item', {
      src,
      dest,
      relativePath,
    });
  }
};

export const deleteVfsItem = async (
  location: VfsLocation,
  relativePath: string
): Promise<void> => {
  if (isTauriEnvironment()) {
    return await invoke<void>('delete_vfs_item', {
      location,
      relativePath,
    });
  }
};

export const getTextDiff = async (
  leftLocation: VfsLocation,
  rightLocation: VfsLocation,
  relativePath: string
): Promise<FileContentDiff> => {
  if (isTauriEnvironment()) {
    return await invoke<FileContentDiff>('get_text_diff', {
      leftLocation,
      rightLocation,
      relativePath,
    });
  }

  return {
    left_path: `${leftLocation.path}/${relativePath}`,
    right_path: `${rightLocation.path}/${relativePath}`,
    left_content: `import React from 'react';\n\nexport const Test = () => {\n  return <div>Local Updated Version</div>;\n};\n`,
    right_content: `import React from 'react';\n\nexport const Test = () => {\n  return <div>Server Old Version</div>;\n};\n`,
    hunks: [],
    is_binary: false,
  };
};

export const syncVfsBatch = async (
  src: VfsLocation,
  dest: VfsLocation,
  items: string[]
): Promise<[string, boolean, string | null][]> => {
  if (isTauriEnvironment()) {
    return await invoke<[string, boolean, string | null][]>('sync_vfs_batch', {
      src,
      dest,
      items,
    });
  }
  return items.map((it) => [it, true, null]);
};
