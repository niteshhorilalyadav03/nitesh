/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: PatientDash.tsx (Citizen / Patient Emergency SOS Hub)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HeartPulse,
  Flame,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  X,
  Compass,
  Siren,
  ChevronDown,
  Star,
  Receipt,
  History,
  CreditCard,
  Crosshair,
  RefreshCw,
  Radio,
  Zap,
  Users,
  Database
} from 'lucide-react';

export const PatientDash: React.FC = () => {
  const {
    currentUser,
    users,
    activeMission,
    triggerDispatch,
    cancelEmergency,
    userCurrentLocation,
    detectLiveLocation,
    isLocating,
    setCustomDispatchLocation,
    dbConnected,
    dbLastSyncTime
  } = useApp();

  const [emergencyType, setEmergencyType] = useState('Severe Chest Pain / Heart Condition');
  const [selectedLandmark, setSelectedLandmark] = useState(
    userCurrentLocation?.landmark || 'Shanti Park, Sector 5'
  );
  const [patientLat, setPatientLat] = useState(
    userCurrentLocation?.latitude.toFixed(4) || '19.2890'
  );
  const [patientLng, setPatientLng] = useState(
    userCurrentLocation?.longitude.toFixed(4) || '72.8610'
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [useLiveGPSMode, setUseLiveGPSMode] = useState(true);

  // Synchronize state when live GPS telemetry updates
  React.useEffect(() => {
    if (userCurrentLocation && useLiveGPSMode) {
      setPatientLat(userCurrentLocation.latitude.toFixed(4));
      setPatientLng(userCurrentLocation.longitude.toFixed(4));
      setSelectedLandmark(userCurrentLocation.landmark);
    }
  }, [userCurrentLocation, useLiveGPSMode]);

  // Preset Mira Road hotspots for quick panic tap
  const hotspots = [
    { name: 'Shanti Park, Sector 5', lat: '19.2890', lng: '72.8610' },
    { name: 'Mira Road Railway Station (East)', lat: '19.2815', lng: '72.8558' },
    { name: 'Kanakia Sector 3 Medical Hub', lat: '19.2867', lng: '72.8715' },
    { name: 'Golden Nest Circle', lat: '19.2985', lng: '72.8532' },
    { name: 'Western Express Highway Junction', lat: '19.2718', lng: '72.8752' }
  ];

  const handleSOSPress = async () => {
    setIsRequesting(true);
    try {
      const lat = parseFloat(patientLat) || 19.2890;
      const lng = parseFloat(patientLng) || 72.8610;
      await triggerDispatch(
        lat,
        lng,
        emergencyType,
        currentUser?.name || 'Citizen Victim',
        currentUser?.phone || '9892088776',
        selectedLandmark
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 select-none">
      {/* ------------------------------------------------------------------ */}
      {/* IF EMERGENCY IS ACTIVE: SHOW LIVE STATUS & ETA TRACKER CARD        */}
      {/* ------------------------------------------------------------------ */}
      {activeMission ? (
        <div className="bg-[#0B1E36] text-white rounded-3xl p-6 shadow-2xl border-2 border-rose-500/80 space-y-6 relative overflow-hidden animate-splash-in">
          {/* Ambient beacon glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />

          {/* Active Banner */}
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-rose-300">
                AMBULANCE EN ROUTE TO YOU
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Mission: {activeMission.id}</span>
          </div>

          {/* Live ETA Hero Banner */}
          <div className="text-center bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Estimated Time of Arrival
            </span>
            <div className="text-4xl sm:text-5xl font-black text-yellow-300 font-mono tracking-tight animate-pulse">
              ~{activeMission.etaMinutes} MINS
            </div>
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              Unit {activeMission.ambulanceVehicleNumber} is {activeMission.distanceKm} km away
            </p>
          </div>

          {/* Driver & Vehicle Details */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Siren className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{activeMission.ambulanceVehicleNumber}</h4>
                  <p className="text-slate-400 text-[11px]">{activeMission.ambulanceType}</p>
                </div>
              </div>

              {/* Call Driver Button */}
              <a
                href={`tel:${activeMission.driverContact}`}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95 text-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Driver</span>
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <span>Driver: <strong className="text-slate-200">{activeMission.driverName}</strong></span>
              <span className="font-mono text-slate-300">{activeMission.driverContact}</span>
            </div>
          </div>

          {/* Designated Hospital */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Designated Hospital</span>
              <h5 className="font-bold text-white mt-0.5">{activeMission.hospital.name}</h5>
              <p className="text-slate-400 text-[11px] mt-0.5 truncate">{activeMission.hospital.address}</p>
            </div>
            <a
              href={`tel:${activeMission.hospital.emergency_contact}`}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl border border-slate-700 flex items-center gap-1 shrink-0"
              title="Hospital Hotline"
            >
              <Building2 className="w-4 h-4" />
            </a>
          </div>

          {/* Cancel SOS Trigger */}
          <div className="pt-2">
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors text-center cursor-pointer"
              >
                Accidental Trigger? Cancel Emergency Call
              </button>
            ) : (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl space-y-2 text-center text-xs">
                <p className="text-red-200 font-bold">Are you sure you want to cancel this emergency dispatch?</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Keep Active
                  </button>
                  <button
                    onClick={() => {
                      cancelEmergency();
                      setShowCancelConfirm(false);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* STANDBY SOS DISPATCH FORM (Panic Interface)                        */
        /* ------------------------------------------------------------------ */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Emergency Life Support
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tap the SOS beacon below to immediately locate and dispatch the closest available ambulance.
            </p>
          </div>

          {/* GIANT CIRCULAR PULSING SOS BUTTON */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Waves */}
              <div className="absolute w-44 h-44 rounded-full bg-rose-500/20 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full bg-rose-500/30" />

              {/* Main Interactive Button */}
              <button
                disabled={isRequesting}
                onClick={handleSOSPress}
                className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white font-black text-2xl tracking-wider shadow-2xl transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer border-4 border-white disabled:opacity-70"
              >
                {isRequesting ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Flame className="w-7 h-7 fill-white animate-pulse" />
                    <span>SOS</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[11px] font-bold text-rose-600 mt-4 tracking-wider uppercase">
              1-Tap Instant Dispatch
            </span>
          </div>

          {/* Emergency Type Selector */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 uppercase tracking-wider block">
              Medical Emergency Category
            </label>
            <select
              value={emergencyType}
              onChange={e => setEmergencyType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Severe Chest Pain / Heart Condition">Critical: Severe Chest Pain / Heart Condition</option>
              <option value="Road Traffic Collision (Trauma)">Critical: Highway / Road Traffic Accident</option>
              <option value="Acute Respiratory Failure">Acute Respiratory Failure (Shortness of Breath)</option>
              <option value="Pregnancy & Neonatal Emergency">Pregnancy & Labor Distress</option>
              <option value="Unconscious / Severe Fall">Unconscious Victim / Severe Head Injury</option>
              <option value="General Acute Illness">General Acute Medical Emergency</option>
            </select>
          </div>

          {/* Real-Time Live Location & Telemetry Anchor */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase tracking-wider block">
                Emergency Scene Location (Mira Road)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    setUseLiveGPSMode(true);
                    await detectLiveLocation();
                  }}
                  disabled={isLocating}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-blue-200 disabled:opacity-50"
                  title="Detect live GPS coordinates from your device"
                >
                  <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
                </button>
              </div>
            </div>

            {/* Active GPS Status Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-sm space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono font-bold text-[10px] tracking-wide uppercase text-emerald-400">
                    {userCurrentLocation?.isLiveGPS ? 'Live Device GPS Connected' : 'Regional Location Fix'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-300">
                  ±{userCurrentLocation?.accuracyMeters || 12}m accuracy
                </span>
              </div>

              <div>
                <h5 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{selectedLandmark}</span>
                </h5>
                <p className="text-[11px] font-mono text-slate-300 mt-0.5">
                  Coordinates: {patientLat}°N, {patientLng}°E
                </p>
                {userCurrentLocation?.isProjected && (
                  <p className="text-[10px] text-amber-300 mt-1">
                    Live GPS detected & mapped to closest Mira Road CAD sector for immediate response.
                  </p>
                )}
              </div>
            </div>

            {/* Hotspot Presets for Fast Tap */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Or select from common Mira Road emergency points:</span>
                <span className="font-semibold text-slate-700">5 Quick Hubs</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {hotspots.map(h => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      setUseLiveGPSMode(false);
                      setSelectedLandmark(h.name);
                      setPatientLat(h.lat);
                      setPatientLng(h.lng);
                      setCustomDispatchLocation(parseFloat(h.lat), parseFloat(h.lng), h.name);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                      selectedLandmark === h.name && !useLiveGPSMode
                        ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${selectedLandmark === h.name && !useLiveGPSMode ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span>{h.name}</span>
                    </div>
                    {selectedLandmark === h.name && !useLiveGPSMode && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Health Info Quick Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-xs space-y-2">
        <h5 className="font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            Your Medical Record on File
          </span>
          <span className="text-slate-400 font-normal">Transmitted to Paramedics</span>
        </h5>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Blood Type</span>
            <span className="font-bold text-slate-800">{currentUser?.bloodType || 'O Positive (O+)'}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Emergency Contact</span>
            <span className="font-bold text-slate-800 truncate block">
              {currentUser?.emergencyContactName || 'Family Contact'}
            </span>
          </div>
        </div>
      </div>

      {/* Active First Responders & Regional Network (SQLite Synced) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-600" />
            <h5 className="font-bold text-slate-800 text-sm">
              Mira Road Emergency Response Network
            </h5>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>Live Coverage ({users.length} Personnel)</span>
          </span>
        </div>

        <p className="text-[11px] text-slate-500">
          When you press Emergency SOS, the following certified emergency responders and control room dispatchers are active in the central database ready to respond:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          {/* Ambulance Operators */}
          {users
            .filter(u => u.role === 'Ambulance Operator' || u.role === 'Driver')
            .slice(0, 2)
            .map(op => (
              <div key={op.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Siren className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{op.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Unit: {op.assignedVehicleNumber || 'Station Unit'}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  On Standby
                </span>
              </div>
            ))}

          {/* Emergency Coordinators */}
          {users
            .filter(u => u.role === 'Emergency Coordinator' || u.role === 'Dispatcher')
            .slice(0, 2)
            .map(coord => (
              <div key={coord.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{coord.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">108 CAD Watch</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  EOC Active
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Citizen Emergency History, Payments & Feedback Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h5 className="font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Emergency History & Receipts</span>
          </h5>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Govt. 108 Free Trauma Service
          </span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-slate-800">Mission #EMS-8821 • Cardiac Distress Call</p>
              <p className="text-slate-500 text-[10px]">Destination: Bhaktivedanta Hospital • Unit MH-04-AZ-1024</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-600 block">₹0.00 (Covered)</span>
              <span className="text-[10px] text-slate-400">Paid by State Disaster Fund</span>
            </div>
          </div>
        </div>

        {/* Paramedic Feedback & Rating */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700 block">Rate Recent Response Service:</span>
            <span className="text-[10px] text-slate-400">Help improve Mira Road EMS fleet response times</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="hover:scale-125 transition-transform cursor-pointer"
                title={`${star} Stars`}
              >
                <Star className="w-4 h-4 fill-amber-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
