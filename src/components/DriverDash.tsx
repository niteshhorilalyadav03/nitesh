/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: DriverDash.tsx (Mobile-Optimized Driver Cockpit Terminal)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Siren,
  Navigation,
  PhoneCall,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Fuel,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Power,
  ChevronRight,
  Send,
  Activity,
  HeartPulse,
  Radio,
  Users,
  Database
} from 'lucide-react';

export const DriverDash: React.FC = () => {
  const {
    currentUser,
    users,
    ambulances,
    activeMission,
    toggleAmbulanceStatus,
    updateMissionStatus,
    completeMission,
    triggerDispatch,
    updatePatientVitals
  } = useApp();

  const [crewTab, setCrewTab] = useState<'operators' | 'dispatchers' | 'hospitals'>('operators');

  // In-transit vitals state
  const [bp, setBp] = useState('125/82');
  const [pulse, setPulse] = useState('88');
  const [spo2, setSpo2] = useState('98');
  const [gcs, setGcs] = useState('15');
  const [vitalsSent, setVitalsSent] = useState(false);

  // Find this driver's assigned vehicle or default to AMB-001
  const assignedPlate = currentUser?.assignedVehicleNumber || 'MH-04-AZ-1024';
  const driverVehicle =
    ambulances.find(a => a.vehicle_number === assignedPlate) || ambulances[0];

  const isAvailable = driverVehicle?.status === 'available';

  // Mission progression steps
  const missionSteps = [
    { key: 'dispatched', label: '1. Dispatched', desc: 'En route to patient' },
    { key: 'at-scene', label: '2. At Scene', desc: 'Patient triage & stabilization' },
    { key: 'transporting', label: '3. Transporting', desc: 'En route to hospital' },
    { key: 'completed', label: '4. Completed', desc: 'Patient handed over' }
  ];

  const currentStepIndex = missionSteps.findIndex(s => s.key === activeMission?.status);

  const handleTransmitVitals = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatientVitals({
      bloodPressure: bp,
      pulseRate: parseInt(pulse, 10) || 88,
      spo2: parseInt(spo2, 10) || 98,
      temperature: '98.6 °F',
      gcsScore: parseInt(gcs, 10) || 15,
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setVitalsSent(true);
    setTimeout(() => setVitalsSent(false), 3000);
  };

  // Demo dispatch trigger if no mission is active
  const handleSimulateAssignment = async () => {
    await triggerDispatch(
      19.2890,
      72.8610,
      'Acute Cardiac Emergency',
      'Pooja Nair',
      '9820577881',
      'Shanti Park Sector 5'
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 1. DRIVER HUD HEADER & QUICK STATUS TOGGLE                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Siren className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 font-mono text-base">
                  {driverVehicle?.vehicle_number || assignedPlate}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {driverVehicle?.type || 'ALS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Driver: <strong>{currentUser?.name || driverVehicle?.driver_name || 'Ramesh Pawar'}</strong>
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fuel Level</span>
            <span className="font-mono font-bold text-slate-700 text-sm flex items-center justify-end gap-1">
              <Fuel className="w-3.5 h-3.5 text-emerald-600" />
              {driverVehicle?.fuel_level || '92%'}
            </span>
          </div>
        </div>

        {/* ONE-TAP STATUS TOGGLE BUTTON */}
        <div>
          <button
            onClick={() => {
              if (driverVehicle) {
                toggleAmbulanceStatus(driverVehicle.id);
              }
            }}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer active:scale-[0.98] border ${
              isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-900 border-amber-300'
            }`}
          >
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isAvailable ? 'bg-emerald-300' : 'bg-amber-300'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isAvailable ? 'bg-white' : 'bg-slate-900'
              }`} />
            </span>
            <span>Current Status: {isAvailable ? 'AVAILABLE FOR RUNS' : 'BUSY / ON ACTIVE RUN'}</span>
            <span className="text-[10px] font-normal lowercase opacity-80">(Tap to toggle)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. ACTIVE MISSION COCKPIT                                          */}
      {/* ------------------------------------------------------------------ */}
      {activeMission ? (
        <div className="bg-[#0B1E36] text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-5">
          {/* Mission Header */}
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-rose-400">
                ACTIVE DISPATCH MISSION
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">{activeMission.id}</span>
          </div>

          {/* Victim Details & Target Coordinates */}
          <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-sky-400">Victim Emergency</p>
                <h4 className="text-lg font-black text-white mt-0.5">{activeMission.patientName}</h4>
                <p className="text-xs text-rose-300 font-semibold mt-0.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {activeMission.emergencyType}
                </p>
              </div>

              {/* Call Patient Phone */}
              <a
                href={`tel:${activeMission.patientContact}`}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              >
                <PhoneCall className="w-4 h-4" />
                <span className="hidden sm:inline">Call Victim</span>
              </a>
            </div>

            {/* Location & Navigation */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold text-white">{activeMission.emergencyLocation.landmark || 'Mira Road GPS Site'}</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  {activeMission.distanceKm} km away
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pl-5">
                <span className="font-mono">
                  GPS: {activeMission.emergencyLocation.latitude.toFixed(4)}°N, {activeMission.emergencyLocation.longitude.toFixed(4)}°E
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.emergencyLocation.latitude},${activeMission.emergencyLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-blue-600/40 hover:bg-blue-600 text-sky-200 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Turn-by-Turn GPS</span>
                </a>
              </div>
            </div>
          </div>

          {/* Route HUD Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Travel ETA</span>
              <p className="text-2xl font-black text-yellow-300 font-mono mt-0.5">
                ~{activeMission.etaMinutes} mins
              </p>
              <span className="text-[10px] text-slate-400">Avg response speed: 30 km/h</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Hospital</span>
              <p className="text-xs font-bold text-white mt-1 truncate">
                {activeMission.hospital.name}
              </p>
              <a
                href={`tel:${activeMission.hospital.emergency_contact}`}
                className="text-[11px] text-sky-400 font-mono flex items-center gap-1 mt-1 hover:underline"
              >
                <PhoneCall className="w-3 h-3" />
                {activeMission.hospital.emergency_contact}
              </a>
            </div>
          </div>

          {/* Mission Progress Stepper */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Mission Progression Checkpoints:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
              {missionSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => updateMissionStatus(step.key as any)}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/40'
                        : isPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* IN-TRANSIT PATIENT VITALS TRANSMISSION */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-teal-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Transmit Patient Vitals to Hospital</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>LIVE GPS SHARING ACTIVE</span>
              </span>
            </div>

            <form onSubmit={handleTransmitVitals} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={e => setBp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={e => setPulse(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="85"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="98"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">GCS Score (/15)</label>
                  <input
                    type="number"
                    value={gcs}
                    onChange={e => setGcs(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Transmits directly to Healthcare Coordinator at {activeMission.hospital.name}
                </span>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                >
                  {vitalsSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{vitalsSent ? 'Vitals Transmitted!' : 'Beam Vitals to ED'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* COMPLETE MISSION BUTTON */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Confirm complete mission and return ambulance to Available state?')) {
                  completeMission();
                }
              }}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>Complete Mission & Reset to Available</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standby State */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-base">Stationary on Base Patrol</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your unit <strong>{assignedPlate}</strong> is currently on standby waiting for dispatch calls from the regional EOC.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSimulateAssignment}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Test Emergency Mission</span>
            </button>
          </div>
        </div>
      )}

      {/* Driver Checklist & Equipment */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
        <h5 className="font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Pre-Flight Medical Checklist
        </h5>
        <div className="grid grid-cols-2 gap-2 text-slate-600">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Oxygen Pressure &gt; 150 bar</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Defibrillator Battery 100%</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>GPS Beacon Calibrated</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Siren & Lights Operational</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. STATION CREW & FLEET OPERATORS (SQLITE DATABASE SYNCED)         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h5 className="font-bold text-slate-800 text-sm">
              Station Crew & Network Roster
            </h5>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>SQLite Synced</span>
          </span>
        </div>

        {/* Crew Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setCrewTab('operators')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              crewTab === 'operators'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operators ({users.filter(u => u.role === 'Ambulance Operator' || u.role === 'Driver').length})
          </button>
          <button
            type="button"
            onClick={() => setCrewTab('dispatchers')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              crewTab === 'dispatchers'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatchers ({users.filter(u => u.role === 'Emergency Coordinator' || u.role === 'Dispatcher').length})
          </button>
          <button
            type="button"
            onClick={() => setCrewTab('hospitals')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              crewTab === 'hospitals'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hospitals ({users.filter(u => u.role === 'Healthcare Coordinator' || u.role === 'Hospital Administrator').length})
          </button>
        </div>

        {/* Tab 1: Ambulance Operators */}
        {crewTab === 'operators' && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {users
              .filter(u => u.role === 'Ambulance Operator' || u.role === 'Driver')
              .map(op => {
                const isMe = op.id === currentUser?.id || op.email === currentUser?.email;
                return (
                  <div
                    key={op.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                      isMe
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                        <Siren className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{op.name}</span>
                          {isMe && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Unit: {op.assignedVehicleNumber || 'Station Reserve'} • Hub: {op.baseStation || 'Mira Road Base'}
                        </span>
                      </div>
                    </div>

                    {op.phone && (
                      <a
                        href={`tel:${op.phone}`}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-xl font-mono text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                      >
                        <PhoneCall className="w-3 h-3 text-emerald-600" />
                        <span>{op.phone}</span>
                      </a>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Tab 2: Dispatchers */}
        {crewTab === 'dispatchers' && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {users
              .filter(u => u.role === 'Emergency Coordinator' || u.role === 'Dispatcher')
              .map(coord => (
                <div
                  key={coord.id}
                  className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{coord.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Freq: {coord.radioChannel || 'EMS-154.25'} • {coord.terminalNumber || 'EOC Control'}
                      </span>
                    </div>
                  </div>

                  {coord.phone && (
                    <a
                      href={`tel:${coord.phone}`}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-xl font-mono text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                    >
                      <PhoneCall className="w-3 h-3 text-blue-600" />
                      <span>{coord.phone}</span>
                    </a>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Tab 3: Hospital Coordinators */}
        {crewTab === 'hospitals' && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {users
              .filter(u => u.role === 'Healthcare Coordinator' || u.role === 'Hospital Administrator')
              .map(hosp => (
                <div
                  key={hosp.id}
                  className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{hosp.name}</span>
                      <span className="text-[10px] text-teal-700 font-bold block truncate max-w-[180px]">
                        {hosp.affiliatedHospitalName || 'Hospital Network'}
                      </span>
                    </div>
                  </div>

                  {hosp.phone && (
                    <a
                      href={`tel:${hosp.phone}`}
                      className="px-2.5 py-1 bg-white hover:bg-teal-100 text-slate-700 hover:text-teal-800 rounded-xl font-mono text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                    >
                      <PhoneCall className="w-3 h-3 text-teal-600" />
                      <span>{hosp.phone}</span>
                    </a>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
