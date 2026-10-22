/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: DispatcherDash.tsx (Computer-Aided Dispatch & Radar Operations)
 * Role: Dispatcher ⭐ (Emergency Coordinator / Control Room Operator)
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useApp, clean10DigitPhone } from '../context/AppContext';
import { MiraRoadMap } from './MiraRoadMap';
import { DashboardWidget } from './DashboardWidget';
import {
  Ambulance,
  Hospital,
  DispatchResult,
  EmergencyRequest
} from '../types';
import {
  Radio,
  Siren,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  PhoneCall,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Compass,
  Activity,
  Flame,
  Shield,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Check,
  X,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Crosshair,
  Users,
  Database,
  HeartPulse,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { soundManager } from '../utils/audioAlert';

export const DispatcherDash: React.FC = () => {
  const {
    users,
    ambulances,
    hospitals,
    activeMission,
    triggerDispatch,
    emergencyRequests,
    createEmergencyRequest,
    assignEmergencyRequest,
    resolveEmergencyRequest,
    toggleAmbulanceStatus,
    updateMissionStatus,
    completeMission,
    updateHospitalBeds,
    notify,
    userCurrentLocation,
    detectLiveLocation,
    isLocating,
    isWatchActive,
    toggleLiveLocationWatch,
    setCustomDispatchLocation,
    dbConnected,
    dbLastSyncTime,
    refreshUsersFromDb,
    addUser
  } = useApp();

  // CAD Console Active View & Filters
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [isMapDispatching, setIsMapDispatching] = useState<boolean>(false);
  const [callFilter, setCallFilter] = useState<'all' | 'pending' | 'critical' | 'assigned'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [personnelRoleFilter, setPersonnelRoleFilter] = useState<string>('all');
  const [personnelSearch, setPersonnelSearch] = useState<string>('');

  // Active right sidebar tab: 'calls' | 'fleet' | 'hospitals' | 'personnel' | 'manual'
  const [activeTab, setActiveTab] = useState<'calls' | 'fleet' | 'hospitals' | 'personnel' | 'manual'>('calls');

  // Quick Enroll Personnel Modal (Persists to SQLite Database)
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [enrollName, setEnrollName] = useState<string>('');
  const [enrollEmail, setEnrollEmail] = useState<string>('');
  const [enrollPhone, setEnrollPhone] = useState<string>('');
  const [enrollPhoneError, setEnrollPhoneError] = useState<string | null>(null);
  const [enrollRole, setEnrollRole] = useState<'Ambulance Operator' | 'Emergency Coordinator' | 'Healthcare Coordinator' | 'Citizen'>('Ambulance Operator');
  const [enrollVehicle, setEnrollVehicle] = useState<string>('MH-04-AZ-1024');
  const [enrollHospital, setEnrollHospital] = useState<string>('Bhaktivedanta Hospital');
  const [enrollDepartment, setEnrollDepartment] = useState<string>('Emergency Trauma Unit');

  // Manual 108 Call Modal
  const [showManualCallModal, setShowManualCallModal] = useState<boolean>(false);
  const [manualCallerName, setManualCallerName] = useState<string>('');
  const [manualCallerPhone, setManualCallerPhone] = useState<string>('');
  const [manualPhoneError, setManualPhoneError] = useState<string | null>(null);
  const [manualEmergencyType, setManualEmergencyType] = useState<string>('Acute Cardiac Distress / Chest Pain');
  const [manualPriority, setManualPriority] = useState<'Critical (P1)' | 'Urgent (P2)' | 'Standard (P3)'>('Critical (P1)');
  const [manualLandmark, setManualLandmark] = useState<string>('Shanti Park, Sector 5');
  const [manualLat, setManualLat] = useState<string>('19.2890');
  const [manualLng, setManualLng] = useState<string>('72.8610');
  const [manualNotes, setManualNotes] = useState<string>('');

  // Mira Road Landmark Presets for quick selection
  const miraRoadPresets = [
    { name: 'Shanti Park, Sector 5 (Near Jain Temple)', lat: '19.2890', lng: '72.8610', type: 'Acute Cardiac Distress / Chest Pain', prio: 'Critical (P1)' as const },
    { name: 'Western Express Highway Junction, Kashimira', lat: '19.2718', lng: '72.8752', type: 'Multi-Vehicle Highway Collision (Trauma)', prio: 'Critical (P1)' as const },
    { name: 'Mira Road Railway Station (East Plaza)', lat: '19.2815', lng: '72.8558', type: 'Platform Fall / Head Injury', prio: 'Urgent (P2)' as const },
    { name: 'Kanakia Sector 3, Near Cinemax Medical Hub', lat: '19.2867', lng: '72.8715', type: 'Acute Asthma & Respiratory Distress', prio: 'Urgent (P2)' as const },
    { name: 'Silver Park, Poonam Sagar Complex', lat: '19.2942', lng: '72.8635', type: 'Stroke Symptoms / Facial Droop', prio: 'Critical (P1)' as const },
    { name: 'Beverly Park, Near GCC International Club', lat: '19.2930', lng: '72.8710', type: 'Severe Diabetic Hypoglycemia / Unresponsive', prio: 'Critical (P1)' as const },
    { name: 'Pleasant Park, Sector 2 Link Road', lat: '19.2850', lng: '72.8640', type: 'Obstetric Emergency / Active Labor', prio: 'Urgent (P2)' as const }
  ];

  // Helper for 10-digit phone typing
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setManualCallerPhone(digitsOnly);
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setManualPhoneError('Phone number must be exactly 10 whole digits.');
    } else {
      setManualPhoneError(null);
    }
  };

  // Trigger dispatch when user clicks on map directly
  const handleMapDispatchTrigger = async (lat: number, lon: number, locationName: string) => {
    setIsMapDispatching(true);
    try {
      const res = await triggerDispatch(
        lat,
        lon,
        'Direct Map Telemetry Dispatch',
        'Citizen at ' + locationName,
        '9820011222',
        locationName
      );
      if (res) {
        setDispatchResult(res);
        setSelectedAmbulance(res.assigned_ambulance);
      }
    } finally {
      setIsMapDispatching(false);
    }
  };

  // Fast Auto-Dispatch for a specific emergency request
  const handleAutoDispatchCall = async (req: EmergencyRequest) => {
    setIsMapDispatching(true);
    try {
      const res = await assignEmergencyRequest(req.id);
      if (res) {
        setDispatchResult(res);
        setSelectedAmbulance(res.assigned_ambulance);
        setSelectedEmergency(req);
      }
    } finally {
      setIsMapDispatching(false);
    }
  };

  // Simulate an incoming 108 emergency call across Mira Road
  const handleSimulateIncoming108Call = () => {
    const randomPreset = miraRoadPresets[Math.floor(Math.random() * miraRoadPresets.length)];
    const randomCallers = [
      { name: 'Vikram Joshi', phone: '9820551122' },
      { name: 'Kavita Nair', phone: '9892113344' },
      { name: 'Ashok Singhania', phone: '9820998877' },
      { name: 'Shweta Tiwari', phone: '9833445566' },
      { name: 'Rohit Kadam', phone: '9819001122' }
    ];
    const caller = randomCallers[Math.floor(Math.random() * randomCallers.length)];

    const newReq = createEmergencyRequest({
      callerName: caller.name,
      callerPhone: caller.phone,
      location: {
        latitude: parseFloat(randomPreset.lat),
        longitude: parseFloat(randomPreset.lng),
        landmark: randomPreset.name,
        sector: randomPreset.name.split(',')[0]
      },
      emergencyType: randomPreset.type,
      priority: randomPreset.prio,
      notes: 'Automated 108 distress beacon received from Mira Road cellular tower Sector 401107.'
    });

    setSelectedEmergency(newReq);
    setActiveTab('calls');
    setCallFilter('pending');
  };

  // Submit manual emergency call form
  const handleCreateManualCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCallerName.trim()) return;
    if (manualCallerPhone.length !== 10) {
      setManualPhoneError('Phone must be strictly 10 digits.');
      return;
    }

    const newReq = createEmergencyRequest({
      callerName: manualCallerName.trim(),
      callerPhone: manualCallerPhone,
      location: {
        latitude: parseFloat(manualLat),
        longitude: parseFloat(manualLng),
        landmark: manualLandmark,
        sector: manualLandmark.split(',')[0]
      },
      emergencyType: manualEmergencyType,
      priority: manualPriority,
      notes: manualNotes.trim() || 'Manual emergency call logged by CAD operator.'
    });

    setShowManualCallModal(false);
    setManualCallerName('');
    setManualCallerPhone('');
    setManualNotes('');
    setSelectedEmergency(newReq);
    setActiveTab('calls');
    setCallFilter('pending');
  };

  // Submit quick enroll personnel form (persists directly to SQLite database)
  const handleEnrollPersonnelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName.trim() || !enrollPhone.trim()) return;
    const cleanPhone = clean10DigitPhone(enrollPhone);
    if (cleanPhone.length !== 10) {
      setEnrollPhoneError('Phone number must be strictly 10 digits.');
      return;
    }

    const defaultEmail = enrollEmail.trim() || `${enrollName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@lifeline.ems.in`;

    addUser({
      name: enrollName.trim(),
      email: defaultEmail,
      role: enrollRole,
      phone: cleanPhone,
      isActive: true,
      ...(enrollRole === 'Ambulance Operator'
        ? {
            assignedVehicleNumber: enrollVehicle || 'MH-04-AZ-1024',
            baseStation: 'Mira Road CAD Base Station',
            emtLevel: 'Advanced Life Support (ALS) Paramedic'
          }
        : {}),
      ...(enrollRole === 'Healthcare Coordinator'
        ? {
            affiliatedHospitalName: enrollHospital || 'Bhaktivedanta Hospital',
            department: enrollDepartment || 'Emergency Medicine',
            emergencyContactExtension: 'EXT-108'
          }
        : {}),
      ...(enrollRole === 'Emergency Coordinator'
        ? {
            operatorCode: 'CAD-' + Math.floor(1000 + Math.random() * 9000),
            terminalNumber: 'TERMINAL-CAD',
            radioChannel: 'EMS-154.25 MHz'
          }
        : {}),
      ...(enrollRole === 'Citizen'
        ? {
            bloodType: 'B Positive (B+)',
            defaultAddress: 'Mira Road East Sector 5',
            emergencyContactName: 'Family Contact'
          }
        : {})
    });

    setShowEnrollModal(false);
    setEnrollName('');
    setEnrollEmail('');
    setEnrollPhone('');
    setEnrollPhoneError(null);
  };

  // Filter Emergency Requests
  const filteredEmergencyRequests = emergencyRequests.filter(req => {
    if (callFilter === 'pending' && req.status !== 'pending') return false;
    if (callFilter === 'critical' && (!req.priority.includes('P1') || req.status === 'completed')) return false;
    if (callFilter === 'assigned' && req.status !== 'assigned') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        req.callerName.toLowerCase().includes(q) ||
        req.emergencyType.toLowerCase().includes(q) ||
        req.location.landmark.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const availableAmbulances = ambulances.filter(a => a.status === 'available');
  const pendingCallsCount = emergencyRequests.filter(r => r.status === 'pending').length;
  const criticalCallsCount = emergencyRequests.filter(r => r.status === 'pending' && r.priority.includes('P1')).length;

  return (
    <div className="space-y-6 animate-splash-in">
      {/* ==================================================================== */}
      {/* 1. CAD CONTROL ROOM STATION HEADER & METRICS                         */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                CAD DISPATCH TERMINAL • EOC MIRA ROAD
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-600">LIVE CAD 24/7</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Emergency Dispatcher Operations Console
            </h2>
            <p className="text-xs text-slate-500">
              Computer-Aided Dispatch, live emergency queue, nearest unit routing & telemetry radar.
            </p>
          </div>
        </div>

        {/* CAD Actions & Frequency */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Radio Channel Indicator */}
          <div className="hidden lg:flex flex-col items-end px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">CAD CHANNEL</span>
            <span className="font-mono font-bold text-slate-800">EMS-154.25 MHz</span>
          </div>

          {/* Simulate Incoming 108 Call Button */}
          <button
            type="button"
            onClick={handleSimulateIncoming108Call}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Simulate incoming distress call from Mira Road resident"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>Simulate 108 Call</span>
          </button>

          {/* Manual Call Entry Button */}
          <button
            type="button"
            onClick={() => setShowManualCallModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Manual Call</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1.5. LIVE GEOLOCATION TELEMETRY & CURRENT DISPATCH ANCHOR BAR        */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 border border-blue-900/60 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
              userCurrentLocation?.isLiveGPS
                ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-400/30'
                : 'bg-blue-600 text-white'
            }`}>
              <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            </div>
            {userCurrentLocation?.isLiveGPS && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                userCurrentLocation?.isLiveGPS
                  ? 'bg-sky-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {userCurrentLocation?.isLiveGPS ? 'LIVE DEVICE GPS ACTIVE' : 'REGIONAL CAD ANCHOR'}
              </span>

              {isWatchActive && (
                <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REAL-TIME STREAM
                </span>
              )}

              <span className="text-xs text-slate-300 font-mono">
                {userCurrentLocation?.latitude.toFixed(4)}°N, {userCurrentLocation?.longitude.toFixed(4)}°E
                <span className="text-slate-400 text-[11px] ml-1">
                  (±{userCurrentLocation?.accuracyMeters || 12}m)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <h4 className="font-extrabold text-sm text-white">
                {userCurrentLocation?.landmark || 'Shanti Park Sector 5, Mira Road'}
              </h4>
              {userCurrentLocation?.sector && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {userCurrentLocation.sector}
                </span>
              )}
            </div>

            {userCurrentLocation?.isProjected && (
              <p className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Remote device GPS detected. Synchronized to closest Mira Road CAD sector for realistic fleet routing.</span>
              </p>
            )}
          </div>
        </div>

        {/* Live GPS Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => detectLiveLocation()}
            disabled={isLocating}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Fetch browser device GPS coordinates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locking Satellites...' : 'Detect Device GPS'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLiveLocationWatch}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isWatchActive
                ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Continuous real-time geolocation streaming"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isWatchActive ? 'Watch Stream ON' : 'Live Stream'}</span>
          </button>

          {userCurrentLocation && (
            <button
              type="button"
              onClick={() => {
                handleMapDispatchTrigger(
                  userCurrentLocation.latitude,
                  userCurrentLocation.longitude,
                  userCurrentLocation.landmark
                );
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Immediately dispatch closest available ambulance to this live GPS fix"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Dispatch Here</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. REAL-TIME TELEMETRY KPI TILES                                      */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pending Emergency Calls */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Calls
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                {pendingCallsCount}
              </span>
              {criticalCallsCount > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  {criticalCallsCount} Critical P1
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* Fleet Availability */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Available Units
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {availableAmbulances.length}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                / {ambulances.length} Total
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Siren className="w-4 h-4" />
          </div>
        </div>

        {/* Average Dispatch Time */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Dispatch Time
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                1.4
              </span>
              <span className="text-xs text-slate-500 font-bold">mins</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        {/* City-Wide Hospital ICU Beds */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ICU Beds Available
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-teal-600 font-mono">
                {hospitals.reduce((acc, h) => acc + h.icu_beds_available, 0)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">across {hospitals.length} hosp</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ACTIVE DISPATCH MISSION HUD (IF ACTIVE)                           */}
      {/* ==================================================================== */}
      {activeMission && (
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-500/50 text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                  CAD MISSION {activeMission.id}
                </span>
                <span className="font-extrabold text-sm sm:text-base text-white">
                  {activeMission.ambulanceVehicleNumber} &rarr; {activeMission.patientName}
                </span>
                <span className="text-[11px] text-amber-300 font-bold uppercase">
                  [{activeMission.status}]
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Emergency: <strong>{activeMission.emergencyType}</strong> • Scene: {activeMission.emergencyLocation.landmark} • Hospital: <strong>{activeMission.hospital.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block uppercase">ETA TO SCENE</span>
              <span className="font-mono font-black text-amber-400 text-base sm:text-lg">
                ~{activeMission.etaMinutes} mins ({activeMission.distanceKm} km)
              </span>
            </div>

            {/* Stage Stepper Quick Controls for Dispatcher */}
            <div className="flex items-center gap-1.5">
              {activeMission.status === 'dispatched' && (
                <button
                  type="button"
                  onClick={() => updateMissionStatus('at-scene')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark At Scene
                </button>
              )}
              {activeMission.status === 'at-scene' && (
                <button
                  type="button"
                  onClick={() => updateMissionStatus('transporting')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark Transporting
                </button>
              )}
              {activeMission.status === 'transporting' && (
                <button
                  type="button"
                  onClick={completeMission}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Complete Mission
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. MAIN CAD SPLIT-SCREEN WORKSPACE                                   */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: REAL-TIME MIRA ROAD GIS RADAR MAP (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Geographic Incident & Fleet Radar (Mira Road)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Center: 19.2815°N, 72.8558°E
            </span>
          </div>

          <MiraRoadMap
            ambulances={ambulances}
            hospitals={hospitals}
            emergencyRequests={emergencyRequests}
            selectedEmergency={selectedEmergency}
            onSelectEmergency={(req) => {
              setSelectedEmergency(req);
              setActiveTab('calls');
            }}
            selectedAmbulance={selectedAmbulance}
            onSelectAmbulance={(amb) => {
              setSelectedAmbulance(amb);
              setActiveTab('fleet');
            }}
            dispatchResult={dispatchResult}
            onDispatchTriggered={(lat, lon, label) => handleMapDispatchTrigger(lat, lon, label)}
            onAssignEmergency={(requestId, ambId) => {
              const req = emergencyRequests.find(r => r.id === requestId);
              if (req) handleAutoDispatchCall(req);
            }}
            isLoading={isMapDispatching}
          />

          {/* Quick Map Dispatch Instructions Banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs text-blue-900 gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Smart Telemetry:</strong> Click any pulsing emergency marker to inspect incident vitals and auto-assign the nearest ambulance.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSimulateIncoming108Call}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
            >
              Test Incoming 108 Call
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CAD DISPATCH MANAGEMENT CONSOLE (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Console Header Tabs */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calls'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Calls</span>
              {pendingCallsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                  {pendingCallsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fleet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'fleet'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Siren className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fleet ({ambulances.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hospitals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'hospitals'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personnel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'personnel'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personnel ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Dispatch</span>
            </button>
          </div>

          {/* TAB CONTENT BODY */}
          <div className="p-4 flex-1">
            {/* ============================================================== */}
            {/* TAB 1: INCOMING EMERGENCY REQUESTS QUEUE                       */}
            {/* ============================================================== */}
            {activeTab === 'calls' && (
              <div className="space-y-3.5">
                {/* Search & Filter Sub-Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search incident, landmark, caller..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCallFilter('pending')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        callFilter === 'pending'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Pending ({emergencyRequests.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallFilter('critical')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        callFilter === 'critical'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Critical P1
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallFilter('assigned')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        callFilter === 'assigned'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Assigned ({emergencyRequests.filter(r => r.status === 'assigned').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        callFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All ({emergencyRequests.length})
                    </button>
                  </div>
                </div>

                {/* List of Incoming Emergency Calls */}
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {filteredEmergencyRequests.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No emergency requests in this view</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">All calls are assigned or resolved.</p>
                      <button
                        type="button"
                        onClick={handleSimulateIncoming108Call}
                        className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Simulate Incoming 108 Call
                      </button>
                    </div>
                  ) : (
                    filteredEmergencyRequests.map((req) => {
                      const isSelected = selectedEmergency?.id === req.id;
                      const isPending = req.status === 'pending';
                      const isP1 = req.priority.includes('P1');

                      // Calculate nearest unit
                      let nearestUnit: { amb: Ambulance; dist: number; eta: number } | null = null;
                      if (availableAmbulances.length > 0) {
                        const sorted = [...availableAmbulances].map(a => {
                          const dist = Math.sqrt(
                            Math.pow(a.current_location.latitude - req.location.latitude, 2) +
                            Math.pow(a.current_location.longitude - req.location.longitude, 2)
                          ) * 111;
                          const formattedDist = parseFloat(dist.toFixed(1));
                          const eta = Math.max(2, Math.round(formattedDist * 2.2));
                          return { amb: a, dist: formattedDist, eta };
                        }).sort((a, b) => a.dist - b.dist);
                        nearestUnit = sorted[0];
                      }

                      return (
                        <div
                          key={req.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                  isP1
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {req.priority}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-700">
                                {req.id}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {req.timestamp}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {req.emergencyType}
                          </h4>

                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{req.location.landmark}</span>
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                            <span>Caller: <strong>{req.callerName}</strong></span>
                            <span className="font-mono text-slate-500">📞 {req.callerPhone}</span>
                          </div>

                          {req.notes && (
                            <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg mt-1.5 border border-slate-100">
                              &ldquo;{req.notes}&rdquo;
                            </p>
                          )}

                          {/* Calculated Nearest Ambulance Recommendation */}
                          {isPending && nearestUnit && (
                            <div className="mt-2 p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between gap-2">
                              <div>
                                <div className="font-bold flex items-center gap-1 text-emerald-900">
                                  <Siren className="w-3 h-3 text-emerald-600" />
                                  <span>Nearest: {nearestUnit.amb.vehicle_number}</span>
                                </div>
                                <span className="text-[10px] text-emerald-700">
                                  {nearestUnit.dist} km • ETA: ~{nearestUnit.eta} mins ({nearestUnit.amb.driver_name})
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-2.5 flex items-center gap-2">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleAutoDispatchCall(req)}
                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                                <span>Auto-Dispatch Nearest Unit</span>
                              </button>
                            ) : (
                              <div className="flex-1 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold text-center">
                                Unit Assigned: {req.assignedAmbulancePlate || 'Dispatched'}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmergency(req);
                                soundManager.playStatusBlip();
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                              title="Focus on Map"
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </button>

                            {req.status === 'assigned' && (
                              <button
                                type="button"
                                onClick={() => resolveEmergencyRequest(req.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                                title="Mark Incident Resolved"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: FLEET AMBULANCE ROSTER & TELEMETRY                      */}
            {/* ============================================================== */}
            {activeTab === 'fleet' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Fleet Units ({ambulances.length})
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {availableAmbulances.length} Units Available
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {ambulances.map((amb) => {
                    const isAvail = amb.status === 'available';
                    const isSelected = selectedAmbulance?.id === amb.id;

                    return (
                      <div
                        key={amb.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/30'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                              {amb.vehicle_number}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                isAvail
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {amb.status}
                            </span>
                          </div>

                          {/* Quick Toggle Status */}
                          <button
                            type="button"
                            onClick={() => toggleAmbulanceStatus(amb.id)}
                            className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                          >
                            Set {isAvail ? 'Busy' : 'Available'}
                          </button>
                        </div>

                        <div className="text-xs text-slate-700 font-bold">{amb.type}</div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{amb.current_location.landmark}</span>
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                          <span>Driver: <strong>{amb.driver_name}</strong></span>
                          <span className="font-mono">📞 {amb.contact}</span>
                        </div>

                        {amb.equipment && amb.equipment.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {amb.equipment.slice(0, 3).map((eq, i) => (
                              <span
                                key={i}
                                className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: RECEIVING HOSPITALS & ICU READINESS                      */}
            {/* ============================================================== */}
            {activeTab === 'hospitals' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Mira Road Hospital Network ({hospitals.length})
                  </span>
                  <span className="text-teal-600 font-bold font-mono">
                    Total ICU: {hospitals.reduce((acc, h) => acc + h.icu_beds_available, 0)} Beds
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {hospitals.map((hosp) => (
                    <div
                      key={hosp.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {hosp.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{hosp.address}</p>
                        </div>
                        {hosp.has_trauma_center && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-full shrink-0">
                            Trauma Center
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">ICU Beds:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            {hosp.icu_beds_available} Avail
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Gen Beds:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {hosp.general_beds_available || 18} Avail
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Hotline: {hosp.emergency_contact}</span>
                        {/* Quick adjustments */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateHospitalBeds(hosp.id, 0, -1)}
                            disabled={hosp.icu_beds_available <= 0}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold cursor-pointer disabled:opacity-40"
                            title="Decrement ICU bed"
                          >
                            -1 ICU
                          </button>
                          <button
                            type="button"
                            onClick={() => updateHospitalBeds(hosp.id, 0, 1)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold cursor-pointer"
                            title="Increment ICU bed"
                          >
                            +1 ICU
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: MANUAL DISPATCH HOTSPOTS & QUICK SOS                    */}
            {/* ============================================================== */}
            {activeTab === 'manual' && (
              <div className="space-y-4">
                {/* 1-Tap Current Live Location Dispatch Card */}
                {userCurrentLocation && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs">
                        <Crosshair className="w-4 h-4 text-blue-600" />
                        <span>Active Target GPS Telemetry</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        userCurrentLocation.isLiveGPS ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {userCurrentLocation.isLiveGPS ? 'LIVE GPS' : 'BASELINE'}
                      </span>
                    </div>

                    <div>
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {userCurrentLocation.landmark}
                      </p>
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                        {userCurrentLocation.latitude.toFixed(4)}°N, {userCurrentLocation.longitude.toFixed(4)}°E (±{userCurrentLocation.accuracyMeters || 12}m)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleMapDispatchTrigger(
                          userCurrentLocation.latitude,
                          userCurrentLocation.longitude,
                          userCurrentLocation.landmark
                        );
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Dispatch Nearest Unit to This Location</span>
                    </button>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                    Direct Mira Road Hotspot Dispatch
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Trigger smart dispatch to calculated nearest ambulance from standard emergency hotspots:
                  </p>

                  <div className="space-y-2">
                    {miraRoadPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleMapDispatchTrigger(
                            parseFloat(preset.lat),
                            parseFloat(preset.lng),
                            preset.name
                          );
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/70 hover:border-blue-400 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs group"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs group-hover:text-blue-900">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{preset.type}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowManualCallModal(true)}
                    className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter Custom Coordinates / Victim</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: REAL-TIME PERSONNEL & OPERATORS DIRECTORY (DATABASE)    */}
            {/* ============================================================== */}
            {activeTab === 'personnel' && (
              <div className="space-y-3.5 animate-splash-in">
                {/* SQLite Database Sync Status Bar */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-300 font-mono uppercase tracking-wide">
                          SQLITE MULTI-USER SYNC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                        {users.length} Registered Personnel Live in CAD
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {dbLastSyncTime}
                    </span>
                    <button
                      type="button"
                      onClick={() => refreshUsersFromDb()}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Sync personnel from SQLite database"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEnrollModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="Enroll new personnel into live SQLite database"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Enroll</span>
                    </button>
                  </div>
                </div>

                {/* Personnel Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={personnelSearch}
                    onChange={(e) => setPersonnelSearch(e.target.value)}
                    placeholder="Search by name, role, phone, vehicle plate, hospital..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                  {personnelSearch && (
                    <button
                      type="button"
                      onClick={() => setPersonnelSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                  {[
                    { id: 'all', label: 'All', count: users.length },
                    { id: 'Ambulance Operator', label: 'Drivers', count: users.filter(u => u.role === 'Ambulance Operator' || u.role === 'Driver').length },
                    { id: 'Citizen', label: 'Citizens', count: users.filter(u => u.role === 'Citizen' || u.role === 'Patient').length },
                    { id: 'Healthcare Coordinator', label: 'Hospital Staff', count: users.filter(u => u.role === 'Healthcare Coordinator' || u.role === 'Hospital Administrator').length },
                    { id: 'Emergency Coordinator', label: 'Dispatchers', count: users.filter(u => u.role === 'Emergency Coordinator' || u.role === 'Dispatcher').length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPersonnelRoleFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        personnelRoleFilter === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Filtered Users Cards List */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {users
                    .filter((u) => {
                      if (personnelRoleFilter === 'Ambulance Operator') {
                        if (u.role !== 'Ambulance Operator' && u.role !== 'Driver') return false;
                      } else if (personnelRoleFilter === 'Citizen') {
                        if (u.role !== 'Citizen' && u.role !== 'Patient') return false;
                      } else if (personnelRoleFilter === 'Healthcare Coordinator') {
                        if (u.role !== 'Healthcare Coordinator' && u.role !== 'Hospital Administrator') return false;
                      } else if (personnelRoleFilter === 'Emergency Coordinator') {
                        if (u.role !== 'Emergency Coordinator' && u.role !== 'Dispatcher') return false;
                      }

                      if (personnelSearch.trim()) {
                        const q = personnelSearch.toLowerCase();
                        const matchName = u.name.toLowerCase().includes(q);
                        const matchPhone = (u.phone || '').includes(q);
                        const matchRole = u.role.toLowerCase().includes(q);
                        const matchEmail = (u.email || '').toLowerCase().includes(q);
                        const matchPlate = (u.assignedVehicleNumber || '').toLowerCase().includes(q);
                        const matchHosp = (u.affiliatedHospitalName || '').toLowerCase().includes(q);
                        const matchAddr = (u.defaultAddress || '').toLowerCase().includes(q);
                        if (!matchName && !matchPhone && !matchRole && !matchEmail && !matchPlate && !matchHosp && !matchAddr) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .map((user) => {
                      const isDriver = user.role === 'Ambulance Operator' || user.role === 'Driver';
                      const isCitizen = user.role === 'Citizen' || user.role === 'Patient';
                      const isHospital = user.role === 'Healthcare Coordinator' || user.role === 'Hospital Administrator';
                      const isDispatcher = user.role === 'Emergency Coordinator' || user.role === 'Dispatcher';

                      return (
                        <div
                          key={user.id}
                          className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isDriver
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isCitizen
                                    ? 'bg-rose-100 text-rose-800'
                                    : isHospital
                                    ? 'bg-teal-100 text-teal-800'
                                    : isDispatcher
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {isDriver ? (
                                  <Siren className="w-4 h-4" />
                                ) : isCitizen ? (
                                  <HeartPulse className="w-4 h-4" />
                                ) : isHospital ? (
                                  <Building2 className="w-4 h-4" />
                                ) : isDispatcher ? (
                                  <Radio className="w-4 h-4" />
                                ) : (
                                  <Shield className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {user.name}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block uppercase tracking-wider ${
                                    isDriver
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : isCitizen
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                      : isHospital
                                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                      : isDispatcher
                                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </div>
                            </div>

                            {/* Direct Call Link */}
                            {user.phone && (
                              <a
                                href={`tel:${user.phone}`}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-mono text-[11px] font-bold flex items-center gap-1 transition-colors border border-slate-200"
                                title="Call directly"
                              >
                                <PhoneCall className="w-3 h-3 text-emerald-600" />
                                <span>{user.phone}</span>
                              </a>
                            )}
                          </div>

                          {/* Role-Specific Telemetry & Context */}
                          {isDriver && (
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Assigned Unit</span>
                                <span className="font-mono font-bold text-slate-800">
                                  {user.assignedVehicleNumber || 'AMB-POOL'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Base Hub</span>
                                <span className="font-bold text-slate-700 truncate block">
                                  {user.baseStation || 'Mira Road Station'}
                                </span>
                              </div>
                            </div>
                          )}

                          {isCitizen && (
                            <div className="space-y-1 text-[11px] bg-rose-50/50 p-2 rounded-xl border border-rose-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-rose-700 font-bold">
                                  Blood Group: {user.bloodType || 'Unknown'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Contact: {user.emergencyContactName || 'Self'}
                                </span>
                              </div>
                              {user.defaultAddress && (
                                <p className="text-[11px] text-slate-600 font-medium truncate">
                                  Address: {user.defaultAddress}
                                </p>
                              )}
                              {user.medicalNotes && (
                                <p className="text-[10px] text-rose-800 italic truncate">
                                  Notes: {user.medicalNotes}
                                </p>
                              )}
                            </div>
                          )}

                          {isHospital && (
                            <div className="space-y-1 text-[11px] bg-teal-50/50 p-2 rounded-xl border border-teal-100">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-teal-900 truncate">
                                  {user.affiliatedHospitalName || 'Hospital Network'}
                                </span>
                                <span className="text-[10px] font-mono text-teal-700 font-bold">
                                  {user.emergencyContactExtension || 'EXT-108'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Dept: {user.department || 'Emergency Medicine & Trauma'}
                              </p>
                            </div>
                          )}

                          {isDispatcher && (
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                              <div>
                                <span className="text-[10px] text-blue-700 block font-semibold">Terminal</span>
                                <span className="font-mono font-bold text-slate-800">
                                  {user.terminalNumber || 'EOC-TERMINAL'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-blue-700 block font-semibold">Frequency</span>
                                <span className="font-mono font-bold text-blue-900">
                                  {user.radioChannel || 'EMS-154.25'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Quick CAD Operations Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            {isCitizen && (
                              <button
                                type="button"
                                onClick={() => {
                                  setManualCallerName(user.name);
                                  setManualCallerPhone(user.phone);
                                  setManualLandmark(user.defaultAddress || 'Mira Road Sector 5');
                                  setManualNotes(`Registered Citizen Profile. Blood: ${user.bloodType || 'O+'}. Notes: ${user.medicalNotes || 'None'}`);
                                  setShowManualCallModal(true);
                                }}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <HeartPulse className="w-3 h-3" />
                                <span>Dispatch Ambulance to Citizen</span>
                              </button>
                            )}

                            {isDriver && (
                              <button
                                type="button"
                                onClick={() => {
                                  const amb = ambulances.find(a => a.vehicle_number === user.assignedVehicleNumber);
                                  if (amb) {
                                    setSelectedAmbulance(amb);
                                    setActiveTab('fleet');
                                    notify('info', 'DRIVER LOCATED IN FLEET', `Assigned vehicle ${amb.vehicle_number} selected for ${user.name}.`);
                                  } else {
                                    notify('info', 'DRIVER CONTACTED', `Radio channel open to ${user.name} (${user.phone}).`);
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <Siren className="w-3 h-3" />
                                <span>Track / Assign Fleet Unit</span>
                              </button>
                            )}

                            {isHospital && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('hospitals');
                                  notify('info', 'HOSPITAL TRIAGE', `Switched to Hospital Roster for ${user.affiliatedHospitalName || user.name}.`);
                                }}
                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <Building2 className="w-3 h-3" />
                                <span>Hospital Capacity</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL: LOG MANUAL 108 EMERGENCY CALL                             */}
      {/* ==================================================================== */}
      {showManualCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-splash-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Log Incoming 108 Emergency Call
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Capture caller telemetry and inject into CAD dispatch queue
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualCallModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualCallSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Caller / Patient Name</label>
                  <input
                    type="text"
                    required
                    value={manualCallerName}
                    onChange={(e) => setManualCallerName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Caller Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    value={manualCallerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. 9820011222"
                    className={`w-full p-2 border rounded-xl font-mono focus:ring-2 outline-none ${
                      manualPhoneError ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {manualPhoneError && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-0.5">{manualPhoneError}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reported Emergency Condition</label>
                <input
                  type="text"
                  required
                  value={manualEmergencyType}
                  onChange={(e) => setManualEmergencyType(e.target.value)}
                  placeholder="e.g. Severe Chest Pain / Cardiac Distress"
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority Triage Tier</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Critical (P1)">Critical (P1) - Immediate Dispatch</option>
                    <option value="Urgent (P2)">Urgent (P2) - Urgent Transport</option>
                    <option value="Standard (P3)">Standard (P3) - Non-Life Threatening</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preset Landmark Quick Pick</label>
                  <select
                    onChange={(e) => {
                      const selected = miraRoadPresets.find(p => p.name === e.target.value);
                      if (selected) {
                        setManualLandmark(selected.name);
                        setManualLat(selected.lat);
                        setManualLng(selected.lng);
                      }
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select from Mira Road hotspots...</option>
                    {miraRoadPresets.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick GPS Geolocation Auto-Fill Bar */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-blue-950 text-xs block">
                      Live Telemetry Fix
                    </span>
                    <span className="text-[11px] text-blue-700 font-mono truncate max-w-[200px] block">
                      {userCurrentLocation ? `${userCurrentLocation.landmark.split('(')[0]}` : 'Ready to capture device fix'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const fix = userCurrentLocation || await detectLiveLocation();
                    if (fix) {
                      setManualLat(fix.latitude.toFixed(4));
                      setManualLng(fix.longitude.toFixed(4));
                      setManualLandmark(fix.landmark);
                      notify('status', 'GPS AUTO-FILLED', `Captured live coordinates (${fix.latitude.toFixed(4)}°N, ${fix.longitude.toFixed(4)}°E) for CAD log.`);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-sky-200" />
                  <span>Use Live Fix</span>
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Incident Landmark / Address</label>
                <input
                  type="text"
                  required
                  value={manualLandmark}
                  onChange={(e) => setManualLandmark(e.target.value)}
                  placeholder="e.g. Shanti Park Sector 5, Near Jain Temple"
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispatcher / Clinical Notes</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Additional observations, bystander CPR in progress, conscious level..."
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualCallModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Log & Queue in CAD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5B. QUICK ENROLL PERSONNEL MODAL (PERSIST TO SQLITE DATABASE)        */}
      {/* ==================================================================== */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Enroll CAD Personnel</h3>
                  <p className="text-xs text-slate-500">Persists to SQLite DB & synchronizes in real time across all dashboards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollPersonnelSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Operational Role *</label>
                <select
                  value={enrollRole}
                  onChange={(e) => setEnrollRole(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Ambulance Operator">Ambulance Operator (Driver / Paramedic)</option>
                  <option value="Healthcare Coordinator">Healthcare Coordinator (Hospital ER Staff)</option>
                  <option value="Emergency Coordinator">Emergency Coordinator (CAD Dispatcher)</option>
                  <option value="Citizen">Citizen (Registered Caller / Patient)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspector Santosh Patil"
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">10-Digit Mobile Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9820123456"
                    value={enrollPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEnrollPhone(digits);
                      if (digits.length > 0 && digits.length < 10) {
                        setEnrollPhoneError('Must be exactly 10 digits.');
                      } else {
                        setEnrollPhoneError(null);
                      }
                    }}
                    className={`w-full pl-12 pr-3 py-2.5 border rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none ${
                      enrollPhoneError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {enrollPhoneError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {enrollPhoneError}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@lifeline.ems.in"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {enrollRole === 'Ambulance Operator' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Vehicle Number</label>
                  <input
                    type="text"
                    value={enrollVehicle}
                    onChange={(e) => setEnrollVehicle(e.target.value)}
                    placeholder="MH-04-AZ-1024"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {enrollRole === 'Healthcare Coordinator' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Affiliated Hospital</label>
                    <select
                      value={enrollHospital}
                      onChange={(e) => setEnrollHospital(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ER Department</label>
                    <input
                      type="text"
                      value={enrollDepartment}
                      onChange={(e) => setEnrollDepartment(e.target.value)}
                      placeholder="Trauma / Triage ER"
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Saved directly to <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 font-semibold">lifeline.db</code> (SQLite) and dispatched via real-time SSE stream. Connected ambulances, triage desks, and admins update in sub-second latency.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!enrollName.trim() || enrollPhone.length !== 10}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Persist & Enroll Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. ANALYTICS & FREQUENCY METRICS                                     */}
      {/* ==================================================================== */}
      <DashboardWidget />
    </div>
  );
};
