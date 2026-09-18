import React, { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Folder, 
  FileText, 
  Server, 
  HardDrive, 
  FolderOpen, 
  ArrowRight,
  ArrowLeft,
  Trash2,
  HardDriveDownload,
  Crosshair,
  FileCode,
  RotateCcw,
  X,
  Sparkles
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
  onManualAlign: (leftPath: string, rightPath: string) => void;
  manualAlignCount: number;
  onClearManualAlign: () => void;
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
      return <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">&larr; Left Newer</span>;
    case 'right_newer':
      return <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">Right Newer &rarr;</span>;
    case 'left_only':
      return <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">Left Only</span>;
    case 'right_only':
      return <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">Right Only</span>;
  }
};

const getRowBgColor = (status: DiffStatus, isSelected: boolean, isAlignSource: boolean) => {
  if (isAlignSource) return 'bg-cyan-900/40 ring-1 ring-cyan-400';
  if (isSelected) return 'bg-cyan-950/40 border-cyan-500/40';
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
  onManualAlign,
  manualAlignCount,
  onClearManualAlign,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer for smooth 60fps scrolling over 50,000+ files
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 25,
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: ComparisonRow;
    side: 'left' | 'right';
  } | null>(null);

  // Manual Alignment State
  const [aligningSource, setAligningSource] = useState<{
    side: 'left' | 'right';
    path: string;
  } | null>(null);

  // Close context menu on click outside or ESC
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setAligningSource(null);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    row: ComparisonRow,
    side: 'left' | 'right'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      row,
      side,
    });
  };

  const handleRowClick = (row: ComparisonRow, clickedSide: 'left' | 'right') => {
    if (aligningSource) {
      if (aligningSource.side === 'left' && clickedSide === 'right' && row.right_item) {
        onManualAlign(aligningSource.path, row.right_item.relative_path);
        setAligningSource(null);
      } else if (aligningSource.side === 'right' && clickedSide === 'left' && row.left_item) {
        onManualAlign(row.left_item.relative_path, aligningSource.path);
        setAligningSource(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none relative">
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
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-all shrink-0 cursor-pointer"
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
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-all shrink-0 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Browse
          </button>
        </div>
      </div>

      {/* Manual Alignment Active Prompt Banner */}
      {aligningSource && (
        <div className="bg-cyan-950/90 border-b border-cyan-500/50 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>
              <strong>Chế độ căn dòng thủ công (Manual Alignment):</strong> Click vào dòng bên{' '}
              <span className="font-bold underline uppercase">{aligningSource.side === 'left' ? 'Phải' : 'Trái'}</span> để khớp với &ldquo;{aligningSource.path}&rdquo;
            </span>
          </div>
          <button
            onClick={() => setAligningSource(null)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
          >
            <X className="w-3 h-3" /> Hủy (ESC)
          </button>
        </div>
      )}

      {/* Table Header */}
      <div className="h-8 bg-slate-900/90 border-b border-slate-800 px-4 grid grid-cols-[30px_1fr_100px_1fr] items-center text-[11px] font-semibold text-slate-400 shrink-0">
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

      {/* Virtualized Rows Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto font-mono text-xs relative"
        style={{ contain: 'strict' }}
      >
        {rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <HardDriveDownload className="w-12 h-12 text-slate-700" />
            <p className="text-sm font-sans font-medium">Chưa có dữ liệu so sánh</p>
            <p className="text-xs font-sans text-slate-600">Chọn 2 thư mục và nhấn &ldquo;Run Compare&rdquo; để bắt đầu</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = selectedPaths.has(row.relative_path);
              const isAlignSource = aligningSource?.path === row.relative_path;

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`grid grid-cols-[30px_1fr_100px_1fr] items-center h-8 px-4 border-b border-slate-800/30 transition-colors cursor-pointer ${getRowBgColor(
                    row.status,
                    isSelected,
                    isAlignSource
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
                  <div
                    onClick={() => handleRowClick(row, 'left')}
                    onDoubleClick={() => !row.is_dir && onOpenFileDiff(row.relative_path)}
                    onContextMenu={(e) => handleContextMenu(e, row, 'left')}
                    className="grid grid-cols-[1fr_80px_130px] gap-2 items-center px-2 truncate h-full"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {row.is_dir ? (
                        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className={`truncate ${row.left_item ? 'text-slate-200' : 'text-slate-600 line-through'}`}>
                        {row.left_item ? row.left_item.relative_path : '-'}
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
                  <div
                    onClick={() => handleRowClick(row, 'right')}
                    onDoubleClick={() => !row.is_dir && onOpenFileDiff(row.relative_path)}
                    onContextMenu={(e) => handleContextMenu(e, row, 'right')}
                    className="grid grid-cols-[1fr_80px_130px] gap-2 items-center px-2 truncate h-full"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {row.is_dir ? (
                        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className={`truncate ${row.right_item ? 'text-slate-200' : 'text-slate-600 line-through'}`}>
                        {row.right_item ? row.right_item.relative_path : '-'}
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
            })}
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 250)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`,
          }}
          className="fixed z-50 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 text-xs text-slate-200 divide-y divide-slate-800 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Section 1: Align & Compare */}
          <div className="py-1">
            <button
              onClick={() => {
                const targetPath = contextMenu.side === 'left' ? contextMenu.row.left_item?.relative_path : contextMenu.row.right_item?.relative_path;
                if (targetPath) {
                  setAligningSource({ side: contextMenu.side, path: targetPath });
                }
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-cyan-600/30 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <strong>Align with... (Căn khớp dòng)</strong>
            </button>

            {!contextMenu.row.is_dir && (
              <button
                onClick={() => {
                  onOpenFileDiff(contextMenu.row.relative_path);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                Mở so sánh chi tiết (Diff)
              </button>
            )}
          </div>

          {/* Section 2: Copy Actions */}
          <div className="py-1">
            <button
              onClick={() => {
                onCopyItem(contextMenu.row.relative_path, 'left_to_right');
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-cyan-300 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              Copy sang Phải &rarr;
            </button>

            <button
              onClick={() => {
                onCopyItem(contextMenu.row.relative_path, 'right_to_left');
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-purple-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
              &larr; Copy sang Trái
            </button>
          </div>

          {/* Section 3: Delete & Reset */}
          <div className="py-1">
            <button
              onClick={() => {
                onDeleteItem(contextMenu.row.relative_path, contextMenu.side);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Xóa file này ({contextMenu.side.toUpperCase()})
            </button>

            {manualAlignCount > 0 && (
              <button
                onClick={() => {
                  onClearManualAlign();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-amber-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Hủy tất cả căn dòng thủ công ({manualAlignCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="h-7 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-sans shrink-0">
        <div className="flex items-center gap-4">
          <span>Đã chọn: <strong className="text-slate-200">{selectedPaths.size}</strong> mục</span>
          <span>Tổng số file: <strong className="text-slate-200">{rows.length}</strong></span>
          {manualAlignCount > 0 && (
            <span className="text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> Căn thủ công: {manualAlignCount} cặp
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>💡 Chuột phải vào bất kỳ dòng nào để chọn <strong>&ldquo;Align with...&rdquo;</strong></span>
        </div>
      </div>
    </div>
  );
};
