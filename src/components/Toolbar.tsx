import React from 'react';
import { 
  ArrowRightLeft, 
  ArrowRight, 
  ArrowLeft, 
  Filter, 
  Search, 
  FolderPlus,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { CompareResult, FilterMode } from '../types';

interface ToolbarProps {
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stats?: CompareResult | null;
  onSyncLeftToRight: () => void;
  onSyncRightToLeft: () => void;
  computeHash: boolean;
  onToggleHash: () => void;
  selectedCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  filterMode,
  onFilterChange,
  searchQuery,
  onSearchChange,
  stats,
  onSyncLeftToRight,
  onSyncRightToLeft,
  computeHash,
  onToggleHash,
  selectedCount,
}) => {
  return (
    <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between gap-4 select-none">
      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Show:
        </span>
        
        <button
          onClick={() => onFilterChange('all')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
            filterMode === 'all'
              ? 'bg-slate-700 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All {stats ? `(${stats.rows.length})` : ''}
        </button>

        <button
          onClick={() => onFilterChange('diff')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'diff'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Diff Only {stats ? `(${stats.diff_count})` : ''}
        </button>

        <button
          onClick={() => onFilterChange('same')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'same'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Same {stats ? `(${stats.same_count})` : ''}
        </button>

        <button
          onClick={() => onFilterChange('left_only')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'left_only'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Left Orphans {stats ? `(${stats.left_only_count})` : ''}
        </button>

        <button
          onClick={() => onFilterChange('right_only')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'right_only'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Right Orphans {stats ? `(${stats.right_only_count})` : ''}
        </button>
      </div>

      {/* Sync Actions & Search */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by file name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-48 bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        {/* Deep Hash Toggle */}
        <button
          onClick={onToggleHash}
          title="Bật so sánh mã băm SHA-256 (chính xác tuyệt đối)"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
            computeHash
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          SHA-256 Check: {computeHash ? 'ON' : 'OFF'}
        </button>

        {/* Sync Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={onSyncLeftToRight}
            title="Copy các file đã chọn từ Trái sang Phải"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded shadow-sm transition-all"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Copy $\rightarrow$
          </button>
          <button
            onClick={onSyncRightToLeft}
            title="Copy các file đã chọn từ Phải sang Trái"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            $\leftarrow$ Copy
          </button>
        </div>
      </div>
    </div>
  );
};
