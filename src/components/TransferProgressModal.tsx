import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface TransferProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  totalItems: number;
  completedItems: number;
  results: [string, boolean, string | null][];
  direction: 'left_to_right' | 'right_to_left';
}

export const TransferProgressModal: React.FC<TransferProgressModalProps> = ({
  isOpen,
  onClose,
  isRunning,
  totalItems,
  completedItems,
  results,
  direction,
}) => {
  if (!isOpen) return null;

  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const successCount = results.filter(([, ok]) => ok).length;
  const failCount = results.filter(([, ok]) => !ok).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 bg-slate-800 px-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <h2 className="text-sm font-semibold text-slate-100">
              {isRunning ? 'Đang truyền tải & đồng bộ file...' : 'Đã hoàn tất truyền tải'}
            </h2>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold mb-1.5">
              <span>Tiến trình: {completedItems} / {totalItems} file</span>
              <span className="text-cyan-400">{percent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
              <div className="text-xs font-semibold">Thành công</div>
              <div className="text-lg font-bold font-mono">{successCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300">
              <div className="text-xs font-semibold">Thất bại</div>
              <div className="text-lg font-bold font-mono">{failCount}</div>
            </div>
          </div>

          {/* Details List */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 bg-slate-950 rounded-lg p-2 border border-slate-800 font-mono text-[11px]">
            {results.length === 0 ? (
              <div className="text-slate-500 text-center py-4">Đang chuẩn bị danh sách...</div>
            ) : (
              results.map(([path, ok, err], idx) => (
                <div key={idx} className="py-1 flex items-center justify-between gap-2">
                  <span className="text-slate-300 truncate">{path}</span>
                  {ok ? (
                    <span className="text-emerald-400 flex items-center gap-1 shrink-0 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 shrink-0 font-sans" title={err || ''}>
                      <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-slate-800/80 px-5 flex items-center justify-end border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={isRunning}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isRunning
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
