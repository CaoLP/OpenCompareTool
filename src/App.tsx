import React, { useState, useEffect, useMemo } from 'react';
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
  VfsLocation 
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
    if (select && filteredRows.length > 0) {
      setSelectedPaths(new Set(filteredRows.map((r) => r.relative_path)));
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
      // Re-compare
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

  // Filtered rows memo
  const filteredRows = useMemo(() => {
    if (!compareResult) return [];
    return compareResult.rows.filter((row) => {
      // Status filter
      if (filterMode === 'diff' && row.status === 'same') return false;
      if (filterMode === 'same' && row.status !== 'same') return false;
      if (filterMode === 'left_only' && row.status !== 'left_only') return false;
      if (filterMode === 'right_only' && row.status !== 'right_only') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return row.relative_path.toLowerCase().includes(q) || row.name.toLowerCase().includes(q);
      }

      return true;
    });
  }, [compareResult, filterMode, searchQuery]);

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
        rows={filteredRows}
        selectedPaths={selectedPaths}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onOpenFileDiff={(path) => setDiffModalPath(path)}
        onCopyItem={handleCopySingle}
        onDeleteItem={handleDeleteItem}
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
