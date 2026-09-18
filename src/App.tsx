import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { FolderCompareView } from './components/FolderCompareView';
import { MonacoDiffModal } from './components/MonacoDiffModal';
import { RemoteConnectionModal } from './components/RemoteConnectionModal';
import { TransferProgressModal } from './components/TransferProgressModal';
import { 
  pickDirectory, 
  compareDirectories, 
  copyVfsItem, 
  deleteVfsItem,
  syncVfsBatch 
} from './services/tauriBridge';
import type { 
  CompareResult, 
  ComparisonRow, 
  FilterMode, 
  VfsLocation,
  DiffStatus
} from './types';

export const App: React.FC = () => {
  // Locations State
  const [leftLocation, setLeftLocation] = useState<VfsLocation>({
    protocol: 'local',
    path: '',
  });

  const [rightLocation, setRightLocation] = useState<VfsLocation>({
    protocol: 'local',
    path: '',
  });

  // Compare & Diff State
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [computeHash, setComputeHash] = useState<boolean>(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Manual Alignments Map: { [leftRelativePath]: rightRelativePath }
  const [manualAlignments, setManualAlignments] = useState<Record<string, string>>({});

  // Modal States
  const [diffModalPath, setDiffModalPath] = useState<string | null>(null);
  const [remoteModalSide, setRemoteModalSide] = useState<'left' | 'right' | null>(null);
  
  // Transfer Progress State
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferResults, setTransferResults] = useState<[string, boolean, string | null][]>([]);
  const [transferTotal, setTransferTotal] = useState<number>(0);
  const [transferDirection, setTransferDirection] = useState<'left_to_right' | 'right_to_left'>('left_to_right');
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // Handle Pick Directory
  const handlePickDirectory = async (side: 'left' | 'right') => {
    const dir = await pickDirectory(`Chọn thư mục ${side === 'left' ? 'Nguồn (Trái)' : 'Đích (Phải)'}`);
    if (dir) {
      if (side === 'left') {
        setLeftLocation((prev) => ({ ...prev, path: dir, protocol: 'local' }));
      } else {
        setRightLocation((prev) => ({ ...prev, path: dir, protocol: 'local' }));
      }
    }
  };

  // Run Comparison
  const handleRunCompare = async () => {
    if (!leftLocation.path || !rightLocation.path) return;
    setIsComparing(true);
    setSelectedPaths(new Set());
    try {
      const res = await compareDirectories(leftLocation, rightLocation, computeHash);
      setCompareResult(res);
    } catch (err: any) {
      alert(`Lỗi khi so sánh thư mục: ${err?.message || err}`);
    } finally {
      setIsComparing(false);
    }
  };

  // Manual Alignment Handlers
  const handleManualAlign = (leftPath: string, rightPath: string) => {
    setManualAlignments((prev) => ({
      ...prev,
      [leftPath]: rightPath,
    }));
  };

  const handleClearManualAlign = () => {
    setManualAlignments({});
  };

  // Selection handlers
  const handleToggleSelect = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select && processedRows.length > 0) {
      setSelectedPaths(new Set(processedRows.map((r) => r.relative_path)));
    } else {
      setSelectedPaths(new Set());
    }
  };

  // Copy Single Item
  const handleCopySingle = async (
    relativePath: string,
    direction: 'left_to_right' | 'right_to_left'
  ) => {
    const src = direction === 'left_to_right' ? leftLocation : rightLocation;
    const dest = direction === 'left_to_right' ? rightLocation : leftLocation;
    try {
      await copyVfsItem(src, dest, relativePath);
      handleRunCompare();
    } catch (err) {
      alert(`Lỗi khi copy file: ${err}`);
    }
  };

  // Delete Item
  const handleDeleteItem = async (relativePath: string, side: 'left' | 'right') => {
    const loc = side === 'left' ? leftLocation : rightLocation;
    if (confirm(`Bạn có chắc chắn muốn xóa "${relativePath}" trên ${side.toUpperCase()}?`)) {
      try {
        await deleteVfsItem(loc, relativePath);
        handleRunCompare();
      } catch (err) {
        alert(`Lỗi xóa: ${err}`);
      }
    }
  };

  // Batch Sync Handlers
  const handleBatchSync = async (direction: 'left_to_right' | 'right_to_left') => {
    const items = Array.from(selectedPaths);
    if (items.length === 0) {
      alert('Vui lòng chọn ít nhất 1 file/thư mục để copy.');
      return;
    }

    setTransferDirection(direction);
    setTransferTotal(items.length);
    setTransferResults([]);
    setIsTransferring(true);
    setShowTransferModal(true);

    const src = direction === 'left_to_right' ? leftLocation : rightLocation;
    const dest = direction === 'left_to_right' ? rightLocation : leftLocation;

    try {
      const res = await syncVfsBatch(src, dest, items);
      setTransferResults(res);
      handleRunCompare();
    } catch (err: any) {
      alert(`Lỗi trong quá trình copy: ${err?.message || err}`);
    } finally {
      setIsTransferring(false);
    }
  };

  // Process rows with Manual Alignment and Filters
  const processedRows = useMemo(() => {
    if (!compareResult) return [];

    const baseRows = [...compareResult.rows];

    // If manual alignments exist, merge aligned rows
    let alignedRows: ComparisonRow[] = [];
    const usedRightPaths = new Set(Object.values(manualAlignments));
    const usedLeftPaths = new Set(Object.keys(manualAlignments));

    // Find custom paired rows
    const manualPairs: ComparisonRow[] = [];
    Object.entries(manualAlignments).forEach(([leftPath, rightPath]) => {
      const leftRow = baseRows.find((r) => r.left_item?.relative_path === leftPath);
      const rightRow = baseRows.find((r) => r.right_item?.relative_path === rightPath);

      if (leftRow?.left_item && rightRow?.right_item) {
        const leftItem = leftRow.left_item;
        const rightItem = rightRow.right_item;
        let status: DiffStatus = 'different';
        if (leftItem.size === rightItem.size && Math.abs(leftItem.mtime - rightItem.mtime) <= 2) {
          status = 'same';
        } else if (leftItem.mtime > rightItem.mtime) {
          status = 'left_newer';
        } else {
          status = 'right_newer';
        }

        manualPairs.push({
          relative_path: `${leftItem.relative_path} ⇋ ${rightItem.relative_path}`,
          name: leftItem.name,
          is_dir: leftItem.is_dir,
          left_item: leftItem,
          right_item: rightItem,
          status,
        });
      }
    });

    // Add remaining unmodified rows
    baseRows.forEach((row) => {
      const isLeftConsumed = row.left_item && usedLeftPaths.has(row.left_item.relative_path);
      const isRightConsumed = row.right_item && usedRightPaths.has(row.right_item.relative_path);

      if (!isLeftConsumed && !isRightConsumed) {
        alignedRows.push(row);
      } else if (isLeftConsumed && !isRightConsumed && row.right_item) {
        alignedRows.push({
          ...row,
          left_item: null,
          status: 'right_only',
        });
      } else if (!isLeftConsumed && isRightConsumed && row.left_item) {
        alignedRows.push({
          ...row,
          right_item: null,
          status: 'left_only',
        });
      }
    });

    // Combine manual pairs on top or sorted
    const combined = [...manualPairs, ...alignedRows];

    // Apply Filter & Search
    return combined.filter((row) => {
      if (filterMode === 'diff' && row.status === 'same') return false;
      if (filterMode === 'same' && row.status !== 'same') return false;
      if (filterMode === 'left_only' && row.status !== 'left_only') return false;
      if (filterMode === 'right_only' && row.status !== 'right_only') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return row.relative_path.toLowerCase().includes(q) || row.name.toLowerCase().includes(q);
      }

      return true;
    });
  }, [compareResult, manualAlignments, filterMode, searchQuery]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        leftLocation={leftLocation}
        rightLocation={rightLocation}
        onCompare={handleRunCompare}
        isComparing={isComparing}
        onOpenRemoteModal={(side) => setRemoteModalSide(side)}
      />

      {/* Toolbar */}
      <Toolbar
        filterMode={filterMode}
        onFilterChange={setFilterMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stats={compareResult}
        onSyncLeftToRight={() => handleBatchSync('left_to_right')}
        onSyncRightToLeft={() => handleBatchSync('right_to_left')}
        computeHash={computeHash}
        onToggleHash={() => setComputeHash((prev) => !prev)}
        selectedCount={selectedPaths.size}
      />

      {/* Main Dual-Pane Folder Compare */}
      <FolderCompareView
        leftLocation={leftLocation}
        rightLocation={rightLocation}
        onPickDirectory={handlePickDirectory}
        rows={processedRows}
        selectedPaths={selectedPaths}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onOpenFileDiff={(path) => setDiffModalPath(path)}
        onCopyItem={handleCopySingle}
        onDeleteItem={handleDeleteItem}
        onManualAlign={handleManualAlign}
        manualAlignCount={Object.keys(manualAlignments).length}
        onClearManualAlign={handleClearManualAlign}
      />

      {/* Monaco Diff Modal */}
      {diffModalPath && (
        <MonacoDiffModal
          isOpen={!!diffModalPath}
          onClose={() => setDiffModalPath(null)}
          relativePath={diffModalPath}
          leftLocation={leftLocation}
          rightLocation={rightLocation}
          onSaveSuccess={handleRunCompare}
        />
      )}

      {/* Remote Connection Config Modal */}
      {remoteModalSide && (
        <RemoteConnectionModal
          isOpen={!!remoteModalSide}
          onClose={() => setRemoteModalSide(null)}
          targetSide={remoteModalSide}
          currentLocation={remoteModalSide === 'left' ? leftLocation : rightLocation}
          onSaveLocation={(side, loc) => {
            if (side === 'left') setLeftLocation(loc);
            else setRightLocation(loc);
          }}
        />
      )}

      {/* Batch Transfer Progress Modal */}
      <TransferProgressModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        isRunning={isTransferring}
        totalItems={transferTotal}
        completedItems={transferResults.length}
        results={transferResults}
        direction={transferDirection}
      />
    </div>
  );
};
