/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: ToastNotificationStack.tsx (Real-Time Toast Alert Overlay)
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ToastNotification } from '../types';
import {
  Siren,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Clock,
  ArrowRight,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundManager } from '../utils/audioAlert';

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.type === 'emergency' ? 8000 : 5500;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const isEmergency = toast.type === 'emergency';
  const isStatus = toast.type === 'status';

  return (
    <div
      role="alert"
      className={`relative overflow-hidden rounded-2xl shadow-2xl border transition-all duration-300 pointer-events-auto backdrop-blur-md ${
        isEmergency
          ? 'bg-[#0B1E36] text-white border-rose-500 ring-2 ring-rose-500/40 animate-bounce'
          : isStatus
          ? 'bg-[#0F172A] text-white border-blue-500/80 shadow-blue-900/30'
          : toast.type === 'success'
          ? 'bg-slate-900 text-white border-emerald-500/80'
          : toast.type === 'warning'
          ? 'bg-slate-900 text-white border-amber-500/80'
          : 'bg-slate-900 text-white border-slate-700'
      }`}
      style={{
        animation: 'splashFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Top Accent / Category Banner */}
      <div
        className={`px-3.5 py-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase border-b ${
          isEmergency
            ? 'bg-rose-600/30 text-rose-300 border-rose-500/30'
            : isStatus
            ? 'bg-blue-600/20 text-sky-300 border-blue-500/20'
            : 'bg-white/5 text-slate-400 border-white/10'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {isEmergency ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <Siren className="w-3.5 h-3.5 text-rose-400" />
              <span>Priority Dispatch Alert</span>
            </>
          ) : isStatus ? (
            <>
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Fleet Status Update</span>
            </>
          ) : (
            <>
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>System Notification</span>
            </>
          )}
        </div>
        <span className="font-mono text-slate-400 font-normal lowercase">{toast.timestamp}</span>
      </div>

      {/* Body Content */}
      <div className="p-3.5 flex items-start gap-3">
        {/* Leading Icon Badge */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isEmergency
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : isStatus
              ? 'bg-blue-500/20 text-sky-400 border-blue-500/30'
              : toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {isEmergency ? (
            <Siren className="w-5 h-5 animate-pulse" />
          ) : isStatus ? (
            <Radio className="w-5 h-5" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-2">
            <span>{toast.title}</span>
            {toast.metadata?.vehicleNumber && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-bold border border-white/10">
                {toast.metadata.vehicleNumber}
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
            {toast.message}
          </p>

          {/* Optional Action / Metadata pill */}
          {toast.metadata?.etaMinutes !== undefined && (
            <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-yellow-300">
              <Clock className="w-3 h-3 text-yellow-400" />
              <span>Estimated Response ETA: ~{toast.metadata.etaMinutes} mins</span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      <div className="w-full h-1 bg-white/10">
        <div
          className={`h-full transition-all linear ${
            isEmergency ? 'bg-rose-500' : isStatus ? 'bg-blue-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastNotificationStack: React.FC = () => {
  const { notifications, removeNotification, clearNotifications } = useApp();
  const [soundActive, setSoundActive] = useState<boolean>(() => soundManager.isEnabled());

  // Show only unread / active toasts in floating stack (up to 4 most recent)
  const activeToasts = notifications.slice(0, 4);

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 right-4 sm:right-6 z-40 w-full max-w-sm flex flex-col gap-2.5 pointer-events-none select-none"
    >
      {/* Sound Toggle Floating Badge */}
      <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400 pointer-events-auto">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Dispatch Feed</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundActive(soundManager.toggleSound())}
            title={soundActive ? 'Mute Alert Chimes' : 'Unmute Alert Chimes'}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
          >
            {soundActive ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-rose-400" />}
            <span>{soundActive ? 'Sound ON' : 'Muted'}</span>
          </button>
          {notifications.length > 1 && (
            <button
              onClick={clearNotifications}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Toasts List */}
      <div className="flex flex-col-reverse gap-2.5">
        {activeToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeNotification} />
        ))}
      </div>
    </div>
  );
};
