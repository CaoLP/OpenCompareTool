import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { readVfsFileContent, writeVfsFileContent } from '../services/tauriBridge';
import type { VfsLocation } from '../types';

interface MonacoDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  relativePath: string;
  leftRelativePath?: string;
  rightRelativePath?: string;
  leftLocation: VfsLocation;
  rightLocation: VfsLocation;
  onSaveSuccess?: () => void;
}

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'c':
    case 'h':
    case 'hpp':
    case 'hxx':
    case 'inl':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'py':
      return 'python';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'json':
      return 'json';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'md':
      return 'markdown';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'bat':
    case 'cmd':
      return 'bat';
    case 'ps1':
      return 'powershell';
    case 'sql':
      return 'sql';
    case 'xml':
    case 'svg':
    case 'xaml':
      return 'xml';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'ini':
    case 'cfg':
    case 'conf':
      return 'ini';
    default:
      return 'plaintext';
  }
};

export const MonacoDiffModal: React.FC<MonacoDiffModalProps> = ({
  isOpen,
  onClose,
  relativePath,
  leftRelativePath,
  rightRelativePath,
  leftLocation,
  rightLocation,
  onSaveSuccess,
}) => {
  const leftRel = leftRelativePath || relativePath;
  const rightRel = rightRelativePath || relativePath;

  const [leftContent, setLeftContent] = useState<string>('');
  const [rightContent, setRightContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || (!leftRel && !rightRel)) return;

    const loadContent = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [leftRes, rightRes] = await Promise.allSettled([
          leftRel ? readVfsFileContent(leftLocation, leftRel) : Promise.resolve(''),
          rightRel ? readVfsFileContent(rightLocation, rightRel) : Promise.resolve(''),
        ]);

        let lContent = '';
        let rContent = '';
        let errors: string[] = [];

        if (leftRes.status === 'fulfilled') {
          lContent = leftRes.value;
        } else if (leftRel) {
          errors.push(`Trái: ${leftRes.reason}`);
        }

        if (rightRes.status === 'fulfilled') {
          rContent = rightRes.value;
        } else if (rightRel) {
          errors.push(`Phải: ${rightRes.reason}`);
        }

        setLeftContent(lContent);
        setRightContent(rContent);

        if (errors.length > 0) {
          setErrorMessage(errors.join(' | '));
        }
      } catch (err: any) {
        console.error('Lỗi khi tải nội dung file:', err);
        setErrorMessage(err?.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [isOpen, leftRel, rightRel, leftLocation, rightLocation]);

  if (!isOpen) return null;

  const handleSaveLeft = async () => {
    if (!leftRel) return;
    setIsSaving(true);
    try {
      await writeVfsFileContent(leftLocation, leftRel, leftContent);
      setSaveSuccess('Đã lưu file bên trái thành công!');
      setTimeout(() => setSaveSuccess(null), 3000);
      onSaveSuccess?.();
    } catch (err) {
      alert(`Lỗi lưu file bên trái: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRight = async () => {
    if (!rightRel) return;
    setIsSaving(true);
    try {
      await writeVfsFileContent(rightLocation, rightRel, rightContent);
      setSaveSuccess('Đã lưu file bên phải thành công!');
      setTimeout(() => setSaveSuccess(null), 3000);
      onSaveSuccess?.();
    } catch (err) {
      alert(`Lỗi lưu file bên phải: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const language = getLanguageFromPath(leftRel || rightRel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full h-full max-w-7xl max-h-[94vh] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 bg-slate-800/95 border-b border-slate-700/70 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              Diff Viewer
            </span>
            <span className="text-sm font-semibold text-slate-100 font-mono truncate max-w-md" title={leftRel || rightRel}>
              {leftRel || rightRel}
            </span>
            <span className="text-xs text-slate-400 font-medium">({language})</span>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccess}
              </span>
            )}

            <button
              onClick={handleSaveLeft}
              disabled={isSaving || !leftRel}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save Left
            </button>

            <button
              onClick={handleSaveRight}
              disabled={isSaving || !rightRel}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save Right
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header with side locations */}
        <div className="grid grid-cols-2 bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono px-4 py-1.5 text-slate-400">
          <div className="truncate text-cyan-400/90 font-medium">
            Left: {leftLocation.path}/{leftRel}
          </div>
          <div className="truncate text-purple-400/90 font-medium px-4">
            Right: {rightLocation.path}/{rightRel}
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-1.5 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Monaco Diff Editor Body */}
        <div className="flex-1 w-full h-full bg-[#1e1e1e] overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-2 font-medium text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              Đang tải nội dung file...
            </div>
          ) : (
            <DiffEditor
              height="100%"
              language={language}
              original={leftContent}
              modified={rightContent}
              theme="vs-dark"
              options={{
                renderSideBySide: true,
                readOnly: false,
                originalEditable: true,
                automaticLayout: true,
                fontSize: 13,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                diffCodeLens: true,
                renderIndicators: true,
                glyphMargin: true,
              }}
              onMount={(editor) => {
                const origModel = editor.getOriginalEditor().getModel();
                const modModel = editor.getModifiedEditor().getModel();
                origModel?.onDidChangeContent(() => {
                  setLeftContent(origModel.getValue());
                });
                modModel?.onDidChangeContent(() => {
                  setRightContent(modModel.getValue());
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
