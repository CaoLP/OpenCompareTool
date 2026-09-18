import React, { useState } from 'react';
import { X, Server, Key, Lock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { testSftpConnection } from '../services/tauriBridge';
import type { VfsLocation, VfsProtocol } from '../types';

interface RemoteConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSide: 'left' | 'right';
  currentLocation: VfsLocation;
  onSaveLocation: (side: 'left' | 'right', location: VfsLocation) => void;
}

export const RemoteConnectionModal: React.FC<RemoteConnectionModalProps> = ({
  isOpen,
  onClose,
  targetSide,
  currentLocation,
  onSaveLocation,
}) => {
  const [protocol, setProtocol] = useState<VfsProtocol>(currentLocation.protocol || 'sftp');
  const [host, setHost] = useState<string>(currentLocation.host || '');
  const [port, setPort] = useState<number>(currentLocation.port || 22);
  const [path, setPath] = useState<string>(currentLocation.path || '/var/www');
  const [username, setUsername] = useState<string>(currentLocation.sftp_auth?.username || 'root');
  const [password, setPassword] = useState<string>(currentLocation.sftp_auth?.password || '');
  const [keyPath, setKeyPath] = useState<string>(currentLocation.sftp_auth?.key_path || '');
  const [authType, setAuthType] = useState<'password' | 'key'>('password');
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testLoc: VfsLocation = {
      protocol,
      host,
      port,
      path,
      sftp_auth: {
        username,
        password: authType === 'password' ? password : undefined,
        key_path: authType === 'key' ? keyPath : undefined,
      },
    };

    try {
      const ok = await testSftpConnection(testLoc);
      if (ok) {
        setTestResult({ success: true, message: 'Kết nối SFTP thành công!' });
      } else {
        setTestResult({ success: false, message: 'Không thể xác thực thông tin đăng nhập' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Lỗi kết nối: ${err?.message || err}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApply = () => {
    const newLoc: VfsLocation = {
      protocol,
      host: protocol !== 'local' ? host : undefined,
      port: protocol !== 'local' ? port : undefined,
      path,
      sftp_auth: protocol !== 'local' ? {
        username,
        password: authType === 'password' ? password : undefined,
        key_path: authType === 'key' ? keyPath : undefined,
      } : undefined,
    };
    onSaveLocation(targetSide, newLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 bg-slate-800 px-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Kết nối Máy chủ Từ xa ({targetSide.toUpperCase()} Side)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* Protocol selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              Giao thức kết nối
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setProtocol('sftp'); setPort(22); }}
                className={`py-2 px-3 rounded-lg border font-medium text-center transition-all ${
                  protocol === 'sftp'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                }`}
              >
                SFTP (Linux / SSH)
              </button>
              <button
                type="button"
                onClick={() => { setProtocol('smb'); setPort(445); }}
                className={`py-2 px-3 rounded-lg border font-medium text-center transition-all ${
                  protocol === 'smb'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                }`}
              >
                SMB (Windows Server)
              </button>
              <button
                type="button"
                onClick={() => setProtocol('local')}
                className={`py-2 px-3 rounded-lg border font-medium text-center transition-all ${
                  protocol === 'local'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                }`}
              >
                Local Folder
              </button>
            </div>
          </div>

          {protocol !== 'local' && (
            <>
              {/* Host & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Host / IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100 hoặc myserver.com"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. root hoặc ubuntu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Auth Method */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Phương thức xác thực
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="authType"
                      checked={authType === 'password'}
                      onChange={() => setAuthType('password')}
                      className="text-cyan-500"
                    />
                    Password
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="authType"
                      checked={authType === 'key'}
                      onChange={() => setAuthType('key')}
                      className="text-cyan-500"
                    />
                    SSH Private Key
                  </label>
                </div>

                {authType === 'password' ? (
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu SSH..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Đường dẫn Private Key (ví dụ: ~/.ssh/id_rsa)"
                    value={keyPath}
                    onChange={(e) => setKeyPath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>
            </>
          )}

          {/* Remote / Target Path */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Đường dẫn thư mục (Remote Path)
            </label>
            <input
              type="text"
              placeholder={protocol === 'sftp' ? '/var/www/myproject' : 'C:\\Projects\\myproject'}
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/50 text-rose-300 border border-rose-800/60'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-slate-800/80 px-5 flex items-center justify-between border-t border-slate-700">
          {protocol !== 'local' ? (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !host}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all"
            >
              {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {isTesting ? 'Đang kiểm tra...' : 'Test Connection'}
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-md transition-all"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
