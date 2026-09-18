import React from 'react';
import { 
  Folder, 
  FileText, 
  Server, 
  HardDrive, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Check,
  ArrowRight,
  ArrowLeft,
  Trash2,
  ExternalLink,
  Clock,
  HardDriveDownload
} from 'lucide-react';
import type { ComparisonRow, DiffStatus, VfsLocation } from '../types';

interface FolderCompareViewProps {
  leftLocation: VfsLocation;
  rightLocation: VfsLocation;
  onPickDirectory: (side: 'left' | 'right') => void;
  rows: ComparisonRow[];
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onSelectAll: (select: boolean) => void;
  onOpenFileDiff: (relativePath: string) => void;
  onCopyItem: (relativePath: string, direction: 'left_to_right' | 'right_to_left') => void;
  onDeleteItem: (relativePath: string, side: 'left' | 'right') => void;
}

const formatSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTime = (timestamp?: number): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('vi-VN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getStatusBadge = (status: DiffStatus) => {
  switch (status) {
    case 'same':
      return <span className="text-[10px] font-semibold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">Same</span>;
    case 'different':
      return <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">Different</span>;
    case 'left_newer':
      return <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">$\leftarrow$ Left Newer</span>;
    case 'right_newer':
      return <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">Right Newer $\rightarrow$</span>;
    case 'left_only':
      return <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">Left Only</span>;
    case 'right_only':
      return <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">Right Only</span>;
  }
};

const getRowBgColor = (status: DiffStatus, isSelected: boolean) => {
  if (isSelected) return 'bg-cyan-950/30 border-cyan-500/40';
  switch (status) {
    case 'different':
    case 'left_newer':
    case 'right_newer':
      return 'hover:bg-amber-950/20';
    case 'left_only':
      return 'hover:bg-cyan-950/20';
    case 'right_only':
      return 'hover:bg-purple-950/20';
    default:
      return 'hover:bg-slate-800/40';
  }
};

export const FolderCompareView: React.FC<FolderCompareViewProps> = ({
  leftLocation,
  rightLocation,
  onPickDirectory,
  rows,
  selectedPaths,
  onToggleSelect,
  onSelectAll,
  onOpenFileDiff,
  onCopyItem,
  onDeleteItem,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Location Bars */}
      <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
        {/* Left Location */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded bg-slate-800 text-cyan-400">
              {leftLocation.protocol === 'local' ? <HardDrive className="w-4 h-4" /> : <Server className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Left Source ({leftLocation.protocol.toUpperCase()})
              </div>
              <div className="text-xs font-medium text-slate-200 truncate" title={leftLocation.path || 'Select folder...'}>
                {leftLocation.path || '<Click to choose folder>'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onPickDirectory('left')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-all shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Browse
          </button>
        </div>

        {/* Right Location */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded bg-slate-800 text-purple-400">
              {rightLocation.protocol === 'local' ? <HardDrive className="w-4 h-4" /> : <Server className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Right Target ({rightLocation.protocol.toUpperCase()})
              </div>
              <div className="text-xs font-medium text-slate-200 truncate" title={rightLocation.path || 'Select folder...'}>
                {rightLocation.path || '<Click to choose folder>'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onPickDirectory('right')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-all shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Browse
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="h-8 bg-slate-900/70 border-b border-slate-800/80 px-4 grid grid-cols-[30px_1fr_100px_1fr] items-center text-[11px] font-semibold text-slate-400">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={rows.length > 0 && selectedPaths.size === rows.length}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
          />
        </div>
        <div className="grid grid-cols-[1fr_80px_130px] gap-2 px-2">
          <span>Left File / Path</span>
          <span className="text-right">Size</span>
          <span className="text-right">Modified Date</span>
        </div>
        <div className="text-center font-bold text-slate-500">Status</div>
        <div className="grid grid-cols-[1fr_80px_130px] gap-2 px-2">
          <span>Right File / Path</span>
          <span className="text-right">Size</span>
          <span className="text-right">Modified Date</span>
        </div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs">
        {rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <HardDriveDownload className="w-12 h-12 text-slate-700" />
            <p className="text-sm font-sans font-medium">Chưa có dữ liệu so sánh</p>
            <p className="text-xs font-sans text-slate-600">Chọn 2 thư mục và nhấn &ldquo;Run Compare&rdquo; để bắt đầu</p>
          </div>
        ) : (
          rows.map((row) => {
            const isSelected = selectedPaths.has(row.relative_path);
            return (
              <div
                key={row.relative_path}
                onDoubleClick={() => !row.is_dir && onOpenFileDiff(row.relative_path)}
                className={`grid grid-cols-[30px_1fr_100px_1fr] items-center h-8 px-4 transition-colors cursor-pointer ${getRowBgColor(
                  row.status,
                  isSelected
                )}`}
              >
                {/* Select Box */}
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(row.relative_path)}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Left Item */}
                <div className="grid grid-cols-[1fr_80px_130px] gap-2 items-center px-2 truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    {row.is_dir ? (
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={`truncate ${row.left_item ? 'text-slate-200' : 'text-slate-600 line-through'}`}>
                      {row.left_item ? row.relative_path : '-'}
                    </span>
                  </div>
                  <span className="text-right text-[11px] text-slate-400">
                    {formatSize(row.left_item?.size)}
                  </span>
                  <span className="text-right text-[11px] text-slate-400 truncate">
                    {formatTime(row.left_item?.mtime)}
                  </span>
                </div>

                {/* Diff Status Center */}
                <div className="flex items-center justify-center">
                  {getStatusBadge(row.status)}
                </div>

                {/* Right Item */}
                <div className="grid grid-cols-[1fr_80px_130px] gap-2 items-center px-2 truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    {row.is_dir ? (
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={`truncate ${row.right_item ? 'text-slate-200' : 'text-slate-600 line-through'}`}>
                      {row.right_item ? row.relative_path : '-'}
                    </span>
                  </div>
                  <span className="text-right text-[11px] text-slate-400">
                    {formatSize(row.right_item?.size)}
                  </span>
                  <span className="text-right text-[11px] text-slate-400 truncate">
                    {formatTime(row.right_item?.mtime)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="h-7 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-sans">
        <div className="flex items-center gap-4">
          <span>Đã chọn: <strong className="text-slate-200">{selectedPaths.size}</strong> mục</span>
          <span>Tổng số file: <strong className="text-slate-200">{rows.length}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Tip: Double-click vào file để mở Diff side-by-side</span>
        </div>
      </div>
    </div>
  );
};
