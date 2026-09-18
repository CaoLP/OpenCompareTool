import React from 'react';
import { Layers, RefreshCw, Server, FolderTree, FileCode, Play, Sparkles } from 'lucide-react';
import type { VfsLocation } from '../types';

interface NavbarProps {
  leftLocation: VfsLocation;
  rightLocation: VfsLocation;
  onCompare: () => void;
  isComparing: boolean;
  onOpenRemoteModal: (side: 'left' | 'right') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  leftLocation,
  rightLocation,
  onCompare,
  isComparing,
  onOpenRemoteModal,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-wide flex items-center gap-1.5">
              OpenCompare <span className="text-[10px] uppercase font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">v0.1.0</span>
            </h1>
            <p className="text-[11px] text-slate-400">Cross-Platform Diff & Sync Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-700 text-slate-100 rounded-md shadow-sm">
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            Folder Compare
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors">
            <FileCode className="w-3.5 h-3.5" />
            File Diff
          </button>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenRemoteModal('right')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all"
        >
          <Server className="w-3.5 h-3.5 text-blue-400" />
          Connect Server (SFTP/SMB)
        </button>

        <button
          onClick={onCompare}
          disabled={isComparing || !leftLocation.path || !rightLocation.path}
          className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-md transition-all ${
            isComparing || !leftLocation.path || !rightLocation.path
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-95'
          }`}
        >
          {isComparing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          {isComparing ? 'Comparing...' : 'Run Compare'}
        </button>
      </div>
    </header>
  );
};
