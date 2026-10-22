/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch and Routing System
 * Component: DispatchConsole.tsx
 * Author: Yadav Nitesh Horilal (TE-IT, Shree L. R. Tiwari College of Engineering)
 * ==============================================================================
 * 
 * VIVA EXPLANATION NOTE FOR PROFESSOR:
 * ------------------------------------------------------------------------------
 * - useState: Manages local component states (fleet data, active dispatch, loading, errors).
 * - useEffect: Lifecycle hook that automatically triggers the GET request on initial mount.
 * - fetch API: Native browser asynchronous HTTP client using ES6 Promises / async-await.
 * - API_BASE: Configurable URL allowing seamless operation against local http://localhost:5000
 *   or cloud environment.
 * ==============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Ambulance, DispatchResult, Hospital } from '../types';
import {
  Siren,
  Activity,
  MapPin,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Flame,
  ShieldAlert,
  Building2,
  Sliders,
  Send,
  Check,
  ChevronRight,
  Radio,
  Sparkles
} from 'lucide-react';

interface DispatchConsoleProps {
  onSelectAmbulance?: (amb: Ambulance) => void;
  onDispatchSuccess?: (result: DispatchResult) => void;
}

// Configurable API base: Supports local port 5000 or same-origin deployment
// If running React standalone on port 3000 and Express on port 5000:
// You can set VITE_API_URL="http://localhost:5000" in .env
const DEFAULT_API_BASE = import.meta.env.VITE_API_URL || '';

export const DispatchConsole: React.FC<DispatchConsoleProps> = ({
  onSelectAmbulance,
  onDispatchSuccess
}) => {
  // ============================================================================
  // 1. STATE MANAGEMENT
  // ============================================================================
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [assignedDispatch, setAssignedDispatch] = useState<DispatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy'>('all');

  // Input states for custom SOS simulation
  const [customLat, setCustomLat] = useState<string>('19.2890');
  const [customLng, setCustomLng] = useState<string>('72.8610');
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string>('Severe Chest Pain (Cardiac)');
  const [victimName, setVictimName] = useState<string>('Emergency Patient (Mira Road)');
  const [requiredTier, setRequiredTier] = useState<string>('');

  // Target backend URL (defaults to same-origin with option to switch to http://localhost:5000)
  const [apiEndpointBase, setApiEndpointBase] = useState<string>(DEFAULT_API_BASE);

  // Quick preset hotspots across Mira Road, Thane
  const miraRoadPresets = [
    { name: 'Shanti Park, Sector 5', lat: 19.2890, lng: 72.8610, type: 'Severe Chest Pain (Cardiac)' },
    { name: 'Mira Road Railway Station (East)', lat: 19.2815, lng: 72.8558, type: 'Pedestrian Accident (Trauma)' },
    { name: 'Kanakia Sector 3 Medical Hub', lat: 19.2867, lng: 72.8715, type: 'Acute Respiratory Distress' },
    { name: 'Golden Nest Circle (Link Rd)', lat: 19.2985, lng: 72.8532, type: 'Road Traffic Collision' },
    { name: 'Kashimira WE Highway Junction', lat: 19.2718, lng: 72.8752, type: 'Multiple Trauma / Highway Incident' }
  ];

  // ============================================================================
  // 2. FEATURE 1: FETCH FLEET DATA (GET /api/ambulances)
  // ============================================================================
  const fetchFleetData = useCallback(async () => {
    setIsLoadingFleet(true);
    setErrorMessage(null);
    try {
      const url = `${apiEndpointBase}/api/ambulances`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setAmbulances(json.data);
      } else if (Array.isArray(json)) {
        setAmbulances(json);
      } else {
        throw new Error('Unexpected response format from backend API');
      }
    } catch (err: any) {
      console.error('Fetch fleet error:', err);
      setErrorMessage(`Failed to connect to backend at ${apiEndpointBase || 'current host'}: ${err.message}`);
    } finally {
      setIsLoadingFleet(false);
    }
  }, [apiEndpointBase]);

  // Initial load hook
  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  // Derived metrics from fleet state
  const totalFleet = ambulances.length;
  const availableUnits = ambulances.filter(a => a.status === 'available').length;
  const busyUnits = ambulances.filter(a => a.status === 'busy').length;

  // Filtered list
  const displayedAmbulances = ambulances.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  // ============================================================================
  // 3. FEATURE 2: SIMULATE SOS CALL (POST /api/ambulances/dispatch)
  // ============================================================================
  const handleSimulateSOS = async (
    lat: number,
    lng: number,
    emergencyType: string = 'General Medical Emergency',
    patientLabel: string = victimName
  ) => {
    setIsDispatching(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      latitude: lat,
      longitude: lng,
      patient_name: patientLabel,
      emergency_type: emergencyType,
      required_type: requiredTier || undefined
    };

    try {
      const url = `${apiEndpointBase}/api/ambulances/dispatch`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No ambulances available or dispatch failed.');
      }

      // Feature 3: Store assigned response in state
      setAssignedDispatch(data.dispatch_result);
      setSuccessMessage(data.message || 'Nearest ambulance dispatched successfully!');

      if (onDispatchSuccess) {
        onDispatchSuccess(data.dispatch_result);
      }

      // Refresh fleet data so updated status or assignments are in sync
      fetchFleetData();
    } catch (err: any) {
      console.error('Dispatch error:', err);
      setErrorMessage(err.message || 'Failed to dispatch ambulance.');
    } finally {
      setIsDispatching(false);
    }
  };

  // ============================================================================
  // 4. FEATURE 4: STATUS TOGGLE (PATCH /api/ambulances/:id/status)
  // ============================================================================
  const handleToggleStatus = async (ambulanceId: string, currentStatus: 'available' | 'busy') => {
    const nextStatus = currentStatus === 'available' ? 'busy' : 'available';

    try {
      const url = `${apiEndpointBase}/api/ambulances/${ambulanceId}/status`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status. Server responded with ${response.status}`);
      }

      const data = await response.json();

      // Refresh fleet data immediately after update
      await fetchFleetData();

      setSuccessMessage(`Vehicle ${ambulanceId} status changed to '${nextStatus}'.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Status toggle error:', err);
      setErrorMessage(`Error updating vehicle status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================== */}
      {/* METRIC CARDS (Total Fleet, Available For Dispatch, Currently Busy)      */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Fleet */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Fleet
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {isLoadingFleet ? '...' : totalFleet}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Stationed in Mira Road, Mumbai
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Siren className="w-6 h-6" />
          </div>
        </div>

        {/* Available for Dispatch */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Available For Dispatch
              </p>
            </div>
            <h3 className="text-3xl font-black text-emerald-800 mt-1">
              {isLoadingFleet ? '...' : availableUnits}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              Ready for immediate Haversine routing
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Currently Busy */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-amber-50/40">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Currently Busy
            </p>
            <h3 className="text-3xl font-black text-amber-800 mt-1">
              {isLoadingFleet ? '...' : busyUnits}
            </h3>
            <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
              In-transit or at hospital triage
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* FEATURE 3: ASSIGNED AMBULANCE DISPATCH CARD (Shows when assigned)      */}
      {/* ====================================================================== */}
      {assignedDispatch && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border-2 border-emerald-400/60 relative overflow-hidden">
          {/* Ambient decorative glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-700/50 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-extrabold text-lg text-emerald-300 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Nearest Ambulance Assigned & Dispatched
              </h3>
            </div>
            <button
              onClick={() => setAssignedDispatch(null)}
              className="text-xs px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-emerald-200 transition-colors cursor-pointer"
            >
              Clear Assignment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Assigned Vehicle Number */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Assigned Vehicle Number
              </p>
              <p className="text-xl font-black text-white font-mono mt-1">
                {assignedDispatch.assigned_ambulance.vehicle_number}
              </p>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Unit ID: {assignedDispatch.assigned_ambulance.id} ({assignedDispatch.assigned_ambulance.type})
              </p>
            </div>

            {/* Metric 2: Calculated Distance in KM */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Haversine Route Distance
              </p>
              <p className="text-xl font-black text-emerald-300 font-mono mt-1">
                {assignedDispatch.assigned_ambulance.distance_km} km
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                From {assignedDispatch.assigned_ambulance.base_station || 'Station'}
              </p>
            </div>

            {/* Metric 3: Estimated ETA */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Estimated Transit ETA
              </p>
              <p className="text-xl font-black text-yellow-300 font-mono mt-1">
                ~{assignedDispatch.assigned_ambulance.estimated_eta_minutes || assignedDispatch.assigned_ambulance.eta_minutes || 4} mins
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Avg speed: 30 km/h (Mira Road traffic)
              </p>
            </div>

            {/* Metric 4: Target Hospital */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Target Hospital Triage
              </p>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {assignedDispatch.recommended_hospital?.name || 'Bhaktivedanta Hospital'}
              </p>
              <p className="text-[11px] text-emerald-200 mt-0.5 truncate">
                Emergency: {assignedDispatch.recommended_hospital?.emergency_contact || '022-29452500'}
              </p>
            </div>
          </div>

          {/* Details Bar */}
          <div className="mt-4 pt-3 border-t border-emerald-800/40 flex flex-wrap items-center justify-between text-xs text-emerald-200 gap-2">
            <div className="flex items-center gap-4">
              <span>Driver: <strong className="text-white">{assignedDispatch.assigned_ambulance.driver_name}</strong></span>
              <span>Contact: <strong className="text-white font-mono">{assignedDispatch.assigned_ambulance.contact}</strong></span>
              <span>Emergency Type: <strong className="text-white">{assignedDispatch.emergency_type}</strong></span>
            </div>
            <div className="text-[11px] text-emerald-300/80">
              Dispatched at: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2-COLUMN LAYOUT: SIMULATE SOS (Left) + STATIONED AMBULANCES (Right)    */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SIMULATE SOS CALL */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h4 className="font-bold text-slate-800 text-sm md:text-base">
                Simulate Emergency SOS Call
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Triggers a <code>POST /api/ambulances/dispatch</code> request to run the nearest-assignment calculation.
            </p>
          </div>

          {/* Preset Mira Road Hotspots */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Quick Mira Road Emergency Presets:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {miraRoadPresets.map((preset) => (
                <button
                  key={preset.name}
                  disabled={isDispatching}
                  onClick={() => {
                    setCustomLat(preset.lat.toString());
                    setCustomLng(preset.lng.toString());
                    setSelectedEmergencyType(preset.type);
                    handleSimulateSOS(preset.lat, preset.lng, preset.type, `Victim @ ${preset.name}`);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-slate-50/70 hover:bg-rose-50/60 transition-all text-xs flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-rose-900">
                      {preset.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {preset.type} • ({preset.lat}, {preset.lng})
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Coordinate Dispatch Form */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Custom GPS Coordinates
              </span>
              <span className="text-[10px] font-mono text-slate-400">Mira Road Bounds</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="19.2890"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="72.8610"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Emergency Severity & Case
              </label>
              <select
                value={selectedEmergencyType}
                onChange={(e) => setSelectedEmergencyType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Severe Chest Pain (Cardiac)">Critical: Severe Chest Pain (Cardiac)</option>
                <option value="Road Traffic Collision (Trauma)">Critical: Road Traffic Collision (Trauma)</option>
                <option value="Acute Respiratory Distress">Acute Respiratory Distress</option>
                <option value="Pregnancy & Neonatal Emergency">Pregnancy & Neonatal Emergency</option>
                <option value="General Medical Emergency">General Medical Emergency</option>
              </select>
            </div>

            <button
              disabled={isDispatching}
              onClick={() => {
                const lat = parseFloat(customLat);
                const lng = parseFloat(customLng);
                if (isNaN(lat) || isNaN(lng)) {
                  setErrorMessage('Please enter valid numeric latitude and longitude coordinates.');
                  return;
                }
                handleSimulateSOS(lat, lng, selectedEmergencyType, victimName);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Nearest Haversine Distance...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-white" />
                  <span>Dispatch Nearest Available Ambulance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: FEATURE 4 - STATIONED AMBULANCES & STATUS TOGGLES */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm md:text-base">
                  Stationed Ambulances & Availability Control
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any status badge to execute a <code>PATCH /api/ambulances/:id/status</code> request.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({totalFleet})
              </button>
              <button
                onClick={() => setFilterStatus('available')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'available' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Available ({availableUnits})
              </button>
              <button
                onClick={() => setFilterStatus('busy')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'busy' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                Busy ({busyUnits})
              </button>
              <button
                onClick={fetchFleetData}
                title="Refresh from backend"
                className="p-1 hover:bg-slate-200 rounded-md text-slate-500 ml-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFleet ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Ambulances Cards List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {isLoadingFleet && ambulances.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                Connecting to backend API on {apiEndpointBase || 'port 5000'}...
              </div>
            ) : displayedAmbulances.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No ambulances found for filter '{filterStatus}'.
              </div>
            ) : (
              displayedAmbulances.map((amb) => {
                const isAssigned = assignedDispatch?.assigned_ambulance.id === amb.id;
                const isAvail = amb.status === 'available';

                return (
                  <div
                    key={amb.id}
                    onClick={() => onSelectAmbulance && onSelectAmbulance(amb)}
                    className={`p-3.5 rounded-xl border transition-all text-xs ${
                      isAssigned
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                        : isAvail
                        ? 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 font-mono text-sm">
                          {amb.vehicle_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {amb.id}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                          {amb.type}
                        </span>
                      </div>

                      {/* FEATURE 4: Status Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(amb.id, amb.status);
                        }}
                        title="Click to toggle status between available and busy"
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isAvail
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        <span>{amb.status}</span>
                        <span className="text-[8px] opacity-70 underline ml-0.5">Toggle</span>
                      </button>
                    </div>

                    {/* Location & Driver details */}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{amb.current_location.landmark}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 text-slate-500">
                        <span>Driver: <strong className="text-slate-700">{amb.driver_name}</strong></span>
                        <span className="font-mono">{amb.contact}</span>
                      </div>
                    </div>

                    {/* Equipment tags */}
                    {amb.equipment && amb.equipment.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-semibold uppercase mr-1">
                          Equipped:
                        </span>
                        {amb.equipment.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium"
                          >
                            {item}
                          </span>
                        ))}
                        {amb.equipment.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{amb.equipment.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
