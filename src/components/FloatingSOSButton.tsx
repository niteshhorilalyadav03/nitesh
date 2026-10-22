/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: FloatingSOSButton.tsx (Persistent High-Visibility Floating SOS Beacon)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Siren,
  PhoneCall,
  MapPin,
  CheckCircle2,
  X,
  AlertTriangle,
  Radio,
  Clock,
  Compass
} from 'lucide-react';
import { soundManager } from '../utils/audioAlert';

export const FloatingSOSButton: React.FC = () => {
  const {
    currentUser,
    activeMission,
    triggerDispatch,
    cancelEmergency,
    notify,
    userCurrentLocation,
    detectLiveLocation
  } = useApp();

  const [isActivating, setIsActivating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'locked'>('idle');

  // Trigger Immediate Emergency Dispatch with GPS
  const handleTriggerInstantSOS = async () => {
    setIsActivating(true);
    setGpsStatus('locating');

    // Resolve accurate coordinates from live location engine
    let lat = userCurrentLocation?.latitude || 19.2890;
    let lng = userCurrentLocation?.longitude || 72.8610;
    let landmark = userCurrentLocation?.landmark || 'Shanti Park Sector 5, Mira Road';

    try {
      const fix = await detectLiveLocation();
      if (fix) {
        lat = fix.latitude;
        lng = fix.longitude;
        landmark = fix.landmark;
        setGpsStatus('locked');
      }
    } catch (err) {
      console.warn('Geolocation fallback to current state:', err);
    }

    const patientName = currentUser?.name || 'Citizen Emergency Beacon';
    const patientPhone = currentUser?.phone || '9892088776';

    try {
      soundManager.playEmergencyAlert();

      // Trigger core dispatch algorithm
      const result = await triggerDispatch(
        lat,
        lng,
        'CRITICAL 1-TAP PANIC SOS BEACON',
        patientName,
        patientPhone,
        landmark
      );

      // Emits an immediate high-priority alert targeted to Dispatcher & all units
      notify(
        'emergency',
        '🚨 CRITICAL 1-TAP SOS SIGNAL RECEIVED',
        `Immediate emergency beacon activated by ${patientName} at ${landmark}. Automated Haversine dispatch assigned nearest available life-support unit!`,
        {
          vehicleNumber: result?.assigned_ambulance?.vehicle_number || 'AMB-001',
          etaMinutes: result?.assigned_ambulance?.estimated_eta_minutes || 3,
          status: 'dispatched'
        }
      );
    } catch (err) {
      console.error('SOS Trigger Error:', err);
    } finally {
      setIsActivating(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* PERSISTENT FLOATING SOS BEACON (BOTTOM-RIGHT)                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed bottom-6 right-5 sm:right-7 z-50 select-none flex flex-col items-end gap-2 pointer-events-auto">
        {/* Active Dispatch Pulse Tooltip (if an ambulance is currently en route) */}
        {activeMission && (
          <div className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-rose-500 shadow-xl flex items-center gap-2 text-xs animate-splash-in">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-bold text-[11px] text-rose-300">
              Unit {activeMission.ambulanceVehicleNumber} en route (~{activeMission.etaMinutes}m)
            </span>
            <button
              onClick={() => cancelEmergency()}
              className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
              title="Cancel Emergency"
            >
              Cancel
            </button>
          </div>
        )}

        {/* The Giant High-Visibility SOS Floating Button */}
        <div className="relative group">
          {/* Animated Multi-Ring Glowing Radar Pulses */}
          <div className="absolute -inset-1.5 rounded-full bg-rose-600 opacity-75 blur-md group-hover:opacity-100 transition duration-300 animate-pulse" />
          <div className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isActivating}
            className={`relative flex items-center gap-2.5 px-5 py-3.5 rounded-full font-black text-sm uppercase tracking-wider text-white shadow-2xl transition-all duration-200 active:scale-95 border-2 border-white cursor-pointer ${
              activeMission
                ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500'
            }`}
            title="Click to trigger instant Emergency SOS with your GPS location to the Dispatcher"
            aria-label="Emergency SOS Beacon"
          >
            {/* Pulsing Icon */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              {isActivating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Flame className="w-5 h-5 fill-white text-white animate-heartbeat" />
              )}
            </div>

            {/* Button Labels */}
            <div className="text-left leading-none">
              <span className="block text-sm font-black tracking-tight text-white drop-shadow-xs">
                SOS EMERGENCY
              </span>
              <span className="block text-[9px] font-mono tracking-widest text-rose-200 mt-0.5 uppercase opacity-90">
                {activeMission ? 'DISPATCH ACTIVE' : '1-TAP DISPATCH'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* INSTANT CONFIRMATION & LOCATION MODAL                              */}
      {/* ------------------------------------------------------------------ */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-splash-in"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <Siren className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white tracking-tight">
                    Confirm Emergency SOS
                  </h3>
                  <span className="text-[10px] font-mono uppercase text-rose-200">
                    Priority 1 Distress Transmission
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Clicking <strong>"Confirm Immediate Dispatch"</strong> will transmit your live GPS coordinates to the <strong>Mira Road Emergency Operations Center (EOC)</strong> and automatically dispatch the closest available ambulance.
              </p>

              {/* Location Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    Transmitted Location:
                  </span>
                  <span className="font-mono text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    GPS Ready
                  </span>
                </div>
                <p className="text-slate-800 font-semibold pl-5 text-xs">
                  {userCurrentLocation?.landmark || 'Shanti Park Sector 5, Mira Road'}
                </p>
                <p className="text-slate-500 font-mono text-[11px] pl-5">
                  Lat: {userCurrentLocation?.latitude.toFixed(4) || '19.2890'}°N, Lon: {userCurrentLocation?.longitude.toFixed(4) || '72.8610'}°E (±{userCurrentLocation?.accuracyMeters || 12}m)
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5 pt-1 border-t border-slate-100">
                  <span>Caller: <strong>{currentUser?.name || 'Citizen Caller'}</strong></span>
                  <span>Contact: {currentUser?.phone || '9892088776'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  disabled={isActivating}
                  onClick={handleTriggerInstantSOS}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isActivating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Distress Signal...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-5 h-5 fill-white" />
                      <span>Confirm Immediate Dispatch</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  Cancel / Return to Dashboard
                </button>
              </div>

              {/* Public Helpline Backup */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Direct Voice Emergency Helpline:</span>
                <a
                  href="tel:112"
                  className="font-bold font-mono text-rose-600 hover:underline flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call 112 / 108</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
