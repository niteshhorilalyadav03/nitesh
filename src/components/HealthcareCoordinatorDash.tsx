/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: HealthcareCoordinatorDash.tsx (Hospital, Doctors & Clinical Handover)
 * Role: Healthcare Coordinator
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Stethoscope,
  Bed,
  HeartPulse,
  Activity,
  Siren,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PhoneCall,
  UserPlus,
  ShieldCheck,
  FileText,
  Plus,
  Minus,
  Check,
  Flame,
  ArrowRight,
  ShieldAlert,
  Database,
  Users,
  X
} from 'lucide-react';

export const HealthcareCoordinatorDash: React.FC = () => {
  const {
    currentUser,
    users,
    addUser,
    hospitals,
    doctors,
    activeMission,
    toggleDoctorDuty,
    updateHospitalBeds,
    updatePatientHandover,
    updateTreatmentStatus,
    completeMission
  } = useApp();

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-001');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('DOC-01');
  const [assignedBay, setAssignedBay] = useState<string>('Trauma Bay 1');
  const [clinicalNotes, setClinicalNotes] = useState<string>('Patient received via ALS unit. Immediate stabilization initiated.');
  const [showDoctorModal, setShowDoctorModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'triage' | 'beds' | 'doctors'>('triage');

  // Form state for adding staff to database
  const [newDocName, setNewDocName] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('Emergency Medicine Specialist');
  const [newDocBay, setNewDocBay] = useState('Resuscitation Bay 2');
  const [newDocPhoneError, setNewDocPhoneError] = useState<string | null>(null);

  // Currently focused hospital
  const hospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || {
    id: 'HOSP-001',
    name: 'Bhaktivedanta Hospital & Research Institute',
    address: 'Sector 1, Srishti Complex, Mira Road East',
    emergency_contact: '022-29452500',
    icu_beds_available: 6,
    has_trauma_center: true
  };

  const currentIcuBeds = hospital.icu_beds_available ?? 6;
  const currentGeneralBeds = hospital.general_beds_available ?? 14;

  const onDutyDoctors = doctors.filter(d => d.onDuty);

  const handleSignHandover = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find(d => d.id === selectedDoctorId);
    const doctorName = doc ? doc.name : (currentUser?.name || 'Dr. Ananya Roy');
    updatePatientHandover(doctorName, assignedBay, clinicalNotes);
  };

  return (
    <div className="space-y-6 select-none">
      {/* ==================================================================== */}
      {/* 1. TOP HEALTHCARE COMMAND HEADER                                     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                HEALTHCARE COORDINATOR CONSOLE
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {hospital.name}
            </h2>
            <p className="text-xs text-slate-500">
              Coordinator: <strong className="text-slate-800">{currentUser?.name || 'Dr. Ananya Roy, MD'}</strong> • Emergency Hotline: {hospital.emergency_contact}
            </p>
          </div>
        </div>

        {/* Hospital Switcher dropdown if multiple */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 hidden sm:inline">Facility:</label>
          <select
            value={selectedHospitalId}
            onChange={e => setSelectedHospitalId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.icu_beds_available} ICU Beds)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. REAL-TIME INCOMING AMBULANCE ALERT & PATIENT HANDOVER BANNER     */}
      {/* ==================================================================== */}
      {activeMission ? (
        <div className="bg-gradient-to-br from-slate-900 via-[#0B1E36] to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-rose-500/80 relative overflow-hidden animate-splash-in">
          {/* Ambient red beacon blur */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Alert Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
              <h3 className="font-mono text-sm sm:text-base font-black tracking-wide text-rose-300 uppercase">
                INCOMING EMERGENCY AMBULANCE TELEMETRY ALERT
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300 font-bold">
                Mission #{activeMission.id}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-bold">
                Status: {activeMission.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Grid of Ambulance & Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
            {/* 1. ETA & Vehicle */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Estimated Emergency Arrival
              </span>
              <div className="text-3xl sm:text-4xl font-black text-yellow-300 font-mono">
                ~{activeMission.etaMinutes} MINS
              </div>
              <div className="text-xs text-slate-300 pt-1 space-y-1">
                <p>
                  Unit: <strong className="text-white font-mono">{activeMission.ambulanceVehicleNumber}</strong> ({activeMission.ambulanceType})
                </p>
                <p>
                  Ambulance Operator: <strong className="text-white">{activeMission.driverName}</strong>
                </p>
                <a
                  href={`tel:${activeMission.driverContact}`}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:underline font-mono"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>{activeMission.driverContact}</span>
                </a>
              </div>
            </div>

            {/* 2. Patient Profile & Emergency */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Patient & Chief Complaint
              </span>
              <h4 className="text-base font-bold text-white">
                {activeMission.patientName}
              </h4>
              <p className="text-xs text-rose-300 font-semibold bg-rose-950/50 p-2 rounded-xl border border-rose-800/50">
                {activeMission.emergencyType}
              </p>
              <p className="text-[11px] text-slate-400">
                Pickup: {activeMission.emergencyLocation.landmark || 'Mira Road Hotspot'}
              </p>
            </div>

            {/* 3. Live Telemetry Vitals */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span>In-Transit Patient Vitals</span>
                <span className="text-emerald-400 font-mono text-[9px]">LIVE TELEMETRY</span>
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 block font-mono">BLOOD PRESSURE</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {activeMission.vitals?.bloodPressure || '130/85 mmHg'}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 block font-mono">OXYGEN (SpO2)</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {activeMission.vitals?.spo2 ? `${activeMission.vitals.spo2}%` : '96%'}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 block font-mono">PULSE RATE</span>
                  <span className="font-bold text-yellow-300 font-mono text-sm">
                    {activeMission.vitals?.pulseRate ? `${activeMission.vitals.pulseRate} bpm` : '94 bpm'}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 block font-mono">GCS COMA SCORE</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {activeMission.vitals?.gcsScore ? `${activeMission.vitals.gcsScore}/15` : '15/15'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Handover & Treatment Section */}
          <div className="mt-5 pt-5 border-t border-slate-800 bg-slate-900/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>Patient Handover & Resuscitation Bay Protocol</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Treatment Stage:</span>
                <select
                  value={activeMission.treatmentStatus || 'En Route'}
                  onChange={e => updateTreatmentStatus(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="En Route">En Route to Emergency Dept</option>
                  <option value="Triage Arrived">Arrived at Triage</option>
                  <option value="In Treatment">In Active Resuscitation</option>
                  <option value="Admitted ICU">Admitted to Trauma ICU</option>
                  <option value="Stabilized">Patient Stabilized</option>
                  <option value="Discharged">Discharged / Step-Down</option>
                </select>
              </div>
            </div>

            {activeMission.handoverCompleted ? (
              <div className="p-4 rounded-2xl bg-teal-950/70 border border-teal-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-800 text-teal-200 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">
                      Clinical Handover Ratified by {activeMission.handoverSignedBy}
                    </h5>
                    <p className="text-[11px] text-teal-300 mt-0.5">
                      Assigned to: <strong className="text-white">{activeMission.assignedBedNumber}</strong> • Signed at {activeMission.handoverTimestamp}
                    </p>
                    <p className="text-[11px] text-slate-300 italic mt-0.5">
                      "{activeMission.handoverNotes}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={completeMission}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Complete Mission & Release Ambulance
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignHandover} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Assign Emergency Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.onDuty ? 'On Duty' : 'Off Duty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Emergency Bay / Bed
                  </label>
                  <input
                    type="text"
                    value={assignedBay}
                    onChange={e => setAssignedBay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Trauma Bay 1"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Clinical Triage Notes
                  </label>
                  <input
                    type="text"
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Triage assessment..."
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Ratify Handover</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>No active emergency inbound call at this second. Hospital Emergency Department is on Standby.</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. CORE MANAGEMENT SECTIONS: BEDS & DOCTORS                          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================= */}
        {/* SECTION A: BED & ICU CAPACITY MANAGEMENT                           */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Bed & ICU Capacity Management
                </h3>
                <p className="text-xs text-slate-500">Live capacity controls for emergency admissions</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              REAL-TIME SYNC
            </span>
          </div>

          {/* Quick Stats Grid with Interactive Steppers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. ICU Beds Controller */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Available ICU Beds</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Critical Care
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {currentIcuBeds} <span className="text-xs text-slate-400 font-normal">/ 12 Total</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 0, -1)}
                    disabled={currentIcuBeds <= 0}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Admit 1 ICU Patient"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, 0, +1)}
                    className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Release 1 ICU Bed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentIcuBeds / 12) * 100)}%` }}
                />
              </div>
            </div>

            {/* 2. Emergency Trauma & General Beds */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Emergency Ward Beds</span>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Step-Down / General
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {currentGeneralBeds} <span className="text-xs text-slate-400 font-normal">/ 25 Total</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, -1, 0)}
                    disabled={currentGeneralBeds <= 0}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Admit 1 Patient"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateHospitalBeds(hospital.id, +1, 0)}
                    className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Discharge / Free 1 Bed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentGeneralBeds / 25) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resuscitation Bays Overview */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Emergency Trauma Bay Readiness
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="text-[10px] text-emerald-700 font-bold block">Bay 1 (ALS)</span>
                <span className="font-extrabold text-xs">READY</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="text-[10px] text-emerald-700 font-bold block">Bay 2 (Trauma)</span>
                <span className="font-extrabold text-xs">READY</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="text-[10px] text-amber-700 font-bold block">Bay 3 (Cardiac)</span>
                <span className="font-extrabold text-xs">IN USE</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
                <span className="text-[10px] text-purple-700 font-bold block">Cath Lab</span>
                <span className="font-extrabold text-xs">ON STANDBY</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION B: DOCTORS ON DUTY & TRIAGE STAFF                         */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Emergency Doctors Coordination
                </h3>
                <p className="text-xs text-slate-500">
                  {onDutyDoctors.length} Doctors currently on-duty in Emergency Department
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDoctorModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-teal-200"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Medical Staff</span>
            </button>
          </div>

          {/* Database Healthcare Personnel List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Hospital Staff & Coordinators (SQLite Synced)
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {users
                .filter(u => u.role === 'Healthcare Coordinator' || u.role === 'Hospital Administrator')
                .map(staff => (
                  <div key={staff.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{staff.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                            {staff.department || 'Emergency Medicine'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Facility: {staff.affiliatedHospitalName || hospital.name} • Ext: {staff.emergencyContactExtension || 'EXT-108'}
                        </span>
                      </div>
                    </div>

                    {staff.phone && (
                      <a
                        href={`tel:${staff.phone}`}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        <PhoneCall className="w-3 h-3 text-teal-600" />
                        <span>{staff.phone}</span>
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Active Clinical Doctors List */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Assigned Trauma Center Doctors
            </span>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
              {doctors.map(doc => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        doc.onDuty
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</h4>
                      <p className="text-slate-500 text-[11px]">{doc.specialty}</p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Phone: {doc.phone} • Assigned: {doc.assignedBay || 'General ED'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${doc.phone}`}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title={`Call ${doc.name}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => toggleDoctorDuty(doc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        doc.onDuty
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {doc.onDuty ? 'On Duty' : 'Off Duty'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inbound Ambulance Operators Quick Dial */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Inbound Ambulance Operators & Drivers Network
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {users
                .filter(u => u.role === 'Ambulance Operator' || u.role === 'Driver')
                .slice(0, 4)
                .map(driver => (
                  <div key={driver.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">{driver.name}</span>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                        {driver.assignedVehicleNumber || 'Unit Pool'}
                      </span>
                    </div>
                    {driver.phone && (
                      <a
                        href={`tel:${driver.phone}`}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shrink-0 flex items-center gap-1"
                        title="Call Ambulance Driver"
                      >
                        <PhoneCall className="w-3 h-3 text-emerald-600" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD MEDICAL STAFF & SAVE TO SQLITE DATABASE */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-splash-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add Medical Staff / Doctor</h3>
                  <p className="text-[10px] text-slate-500">Persists directly into shared SQLite database</p>
                </div>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDocName.trim() || !newDocPhone.trim()) return;
                const cleanPhone = newDocPhone.replace(/\D/g, '').slice(0, 10);
                if (cleanPhone.length !== 10) {
                  setNewDocPhoneError('Phone must be strictly 10 digits.');
                  return;
                }

                // Add to SQLite database
                addUser({
                  name: newDocName.trim(),
                  email: `${newDocName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${hospital.name.toLowerCase().includes('bhakti') ? 'bhaktivedanta' : 'hospital'}.org`,
                  role: 'Healthcare Coordinator',
                  phone: cleanPhone,
                  affiliatedHospitalName: hospital.name,
                  department: newDocSpecialty,
                  emergencyContactExtension: 'EXT-108'
                });

                setNewDocName('');
                setNewDocPhone('');
                setNewDocPhoneError(null);
                setShowDoctorModal(false);
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name & Degree *</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  placeholder="e.g. Dr. Siddharth Verma, MD"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Specialty *</label>
                <select
                  value={newDocSpecialty}
                  onChange={e => setNewDocSpecialty(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="Trauma & Emergency Surgeon">Trauma & Emergency Surgeon</option>
                  <option value="Emergency Medicine Consultant">Emergency Medicine Consultant</option>
                  <option value="Interventional Cardiologist">Interventional Cardiologist</option>
                  <option value="Intensive Critical Care Specialist">Intensive Critical Care Specialist</option>
                  <option value="Healthcare Coordinator">Healthcare Coordinator</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">10-Digit Mobile Phone *</label>
                  <span className="text-[10px] text-slate-400 font-mono">10 digits</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={newDocPhone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewDocPhone(digits);
                    setNewDocPhoneError(digits.length > 0 && digits.length < 10 ? 'Must be 10 digits.' : null);
                  }}
                  placeholder="9820199887"
                  className={`w-full p-2.5 border rounded-xl font-mono focus:ring-2 outline-none ${
                    newDocPhoneError ? 'border-red-400 focus:ring-red-500 bg-red-50/20' : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
                {newDocPhoneError && (
                  <p className="text-[10px] text-red-600 mt-0.5">{newDocPhoneError}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Trauma Bay / Area</label>
                <input
                  type="text"
                  value={newDocBay}
                  onChange={e => setNewDocBay(e.target.value)}
                  placeholder="e.g. Resuscitation Bay 2"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. CLINICAL WORKFLOW REFERENCE FOR HEALTHCARE COORDINATOR            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Real-Life Complete Workflow (Healthcare Coordinator Responsibilities)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 1</span>
            <strong className="text-slate-900 block mt-0.5">Alert Inbound</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Receive alert from Ambulance Operator with real-time ETA and patient condition.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 2</span>
            <strong className="text-slate-900 block mt-0.5">Capacity Check</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Verify ICU bed availability and reserve emergency trauma resuscitation bay.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 3</span>
            <strong className="text-slate-900 block mt-0.5">Doctor Assignment</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Assign on-duty emergency doctor and trauma crew prior to vehicle arrival.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 4</span>
            <strong className="text-slate-900 block mt-0.5">Patient Handover</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Verify patient vitals, ratify handover checklist, and release ambulance operator.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 5</span>
            <strong className="text-slate-900 block mt-0.5">Treatment Tracking</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Update treatment stage from Resuscitation to ICU admission or stabilization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
