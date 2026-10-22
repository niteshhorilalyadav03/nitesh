/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Module: Interactive CAD Operations Radar Map Component
 * File: src/components/MiraRoadMap.tsx
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ambulance, Hospital, DispatchResult, EmergencyRequest } from '../types';
import { useApp } from '../context/AppContext';
import {
  Siren,
  Building2,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  Navigation,
  Info,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  Zap,
  Crosshair,
  Radio,
  RotateCw,
  Target
} from 'lucide-react';

interface MiraRoadMapProps {
  ambulances: Ambulance[];
  hospitals?: Hospital[];
  emergencyRequests?: EmergencyRequest[];
  selectedEmergency?: EmergencyRequest | null;
  onSelectEmergency?: (req: EmergencyRequest) => void;
  selectedAmbulance?: Ambulance | null;
  onSelectAmbulance?: (ambulance: Ambulance) => void;
  dispatchResult?: DispatchResult | null;
  onDispatchTriggered?: (lat: number, lon: number, locationName: string) => void;
  onAssignEmergency?: (requestId: string, ambulanceId?: string) => void;
  isLoading?: boolean;
}

// ==============================================================================
// HAVERSINE DISTANCE HELPER FOR MAP POPUPS
// ==============================================================================
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// ==============================================================================
// CUSTOM LEAFLET DIV-ICONS (Tailwind CSS Rendered)
// ==============================================================================

/**
 * Creates custom ambulance icon with status styling:
 * - Emerald Green for 'available'
 * - Amber/Orange for 'busy'
 * - Active bounce/halo for assigned unit
 */
const createAmbulanceIcon = (status: 'available' | 'busy', isAssigned: boolean, vehicleNumber: string) => {
  const shortPlate = vehicleNumber.split('-')[2] || vehicleNumber.slice(-4);
  const isAvail = status === 'available';

  const badgeColor = isAssigned
    ? 'bg-blue-600 border-blue-200 ring-4 ring-blue-400/60 text-white animate-bounce'
    : isAvail
    ? 'bg-emerald-600 border-emerald-200 ring-2 ring-emerald-400/40 text-white shadow-md'
    : 'bg-amber-500 border-amber-200 text-white opacity-85';

  return L.divIcon({
    className: 'custom-leaflet-ambulance-icon',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        ${isAvail ? '<span class="absolute w-8 h-8 rounded-full bg-emerald-400 opacity-60 animate-ping"></span>' : ''}
        ${isAssigned ? '<span class="absolute w-9 h-9 rounded-full bg-blue-400 opacity-80 animate-ping"></span>' : ''}
        <div class="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono shadow-lg transition-transform ${badgeColor}">
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <span>${shortPlate}</span>
        </div>
      </div>
    `,
    iconSize: [44, 26],
    iconAnchor: [22, 13],
    popupAnchor: [0, -15]
  });
};

/**
 * Creates custom icon for Incoming Emergency Calls across Mira Road:
 * - Pulsing Red for Critical (P1)
 * - Pulsing Amber for Urgent (P2)
 * - Blue for Already Assigned
 */
const createEmergencyRequestIcon = (req: EmergencyRequest, isSelected: boolean) => {
  const isP1 = req.priority.includes('P1');
  const isAssigned = req.status === 'assigned';
  const isPending = req.status === 'pending';

  let bg = isP1 ? 'bg-rose-600' : 'bg-amber-600';
  let ring = isP1 ? 'ring-rose-400' : 'ring-amber-400';
  let badgeLabel = isP1 ? 'P1' : 'P2';

  if (isAssigned) {
    bg = 'bg-blue-600';
    ring = 'ring-blue-400';
    badgeLabel = 'CAD';
  }

  return L.divIcon({
    className: 'custom-leaflet-emergency-req-icon',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
        ${isPending ? `<span class="absolute w-10 h-10 rounded-full ${isP1 ? 'bg-rose-500' : 'bg-amber-500'} opacity-75 animate-ping"></span>` : ''}
        <div class="flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-white text-[10px] font-black font-mono shadow-2xl text-white ${bg} ${isSelected ? 'ring-4 ' + ring : ''}">
          <span class="w-2 h-2 rounded-full bg-white ${isPending ? 'animate-pulse' : ''}"></span>
          <span>${badgeLabel}</span>
          <span class="text-[9px] font-bold truncate max-w-[65px] opacity-90">${req.location.sector || req.id}</span>
        </div>
      </div>
    `,
    iconSize: [54, 28],
    iconAnchor: [27, 14],
    popupAnchor: [0, -16]
  });
};

/**
 * Creates hospital icon for medical centers in Mira Road
 */
const createHospitalIcon = (isTarget: boolean, beds: number) => {
  return L.divIcon({
    className: 'custom-leaflet-hospital-icon',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="px-2 py-0.5 rounded-lg border text-white shadow-md flex items-center gap-1 ${
          isTarget ? 'bg-rose-600 border-rose-300 ring-4 ring-rose-400/60 animate-pulse' : 'bg-slate-900 border-slate-700'
        }">
          <svg class="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M12 7v4" />
            <path d="M10 9h4" />
          </svg>
          <span class="text-[10px] font-bold font-mono text-emerald-400">${beds} ICU</span>
        </div>
      </div>
    `,
    iconSize: [52, 24],
    iconAnchor: [26, 12],
    popupAnchor: [0, -14]
  });
};

/**
 * Creates custom icon for Current Live Location Fix (with pulsing radar ripple)
 */
const createCurrentLocationIcon = (isLiveGPS: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-live-location-icon',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <span class="absolute w-12 h-12 rounded-full ${isLiveGPS ? 'bg-sky-400' : 'bg-blue-400'} opacity-60 animate-ping"></span>
        <span class="absolute w-7 h-7 rounded-full ${isLiveGPS ? 'bg-sky-500/30 ring-2 ring-sky-400' : 'bg-blue-500/30 ring-2 ring-blue-400'}"></span>
        <div class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
        <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[9px] font-mono font-bold tracking-tight whitespace-nowrap shadow-md border border-slate-700">
          ${isLiveGPS ? '📍 LIVE GPS FIX' : '📍 DISPATCH PIN'}
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -20]
  });
};

// ==============================================================================
// LEAFLET MAP HOOKS
// ==============================================================================

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(4));
      const lng = parseFloat(e.latlng.lng.toFixed(4));
      onMapClick(lat, lng);
    }
  });
  return null;
}

function MapFlyToController({ target }: { target?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

// ==============================================================================
// MAIN MIRA ROAD MAP COMPONENT
// ==============================================================================

export const MiraRoadMap: React.FC<MiraRoadMapProps> = ({
  ambulances,
  hospitals = [],
  emergencyRequests = [],
  selectedEmergency,
  onSelectEmergency,
  selectedAmbulance,
  onSelectAmbulance,
  dispatchResult,
  onDispatchTriggered,
  onAssignEmergency,
  isLoading = false
}) => {
  const {
    userCurrentLocation,
    detectLiveLocation,
    isLocating,
    isWatchActive,
    toggleLiveLocationWatch,
    setCustomDispatchLocation
  } = useApp();

  // Center of Mira Road, Mumbai (approx 19.2815, 72.8558)
  const MIRA_ROAD_CENTER: [number, number] = [19.2815, 72.8558];

  // Map Layer Toggles
  const [showAmbulances, setShowAmbulances] = useState<boolean>(true);
  const [onlyAvailableAmbulances, setOnlyAvailableAmbulances] = useState<boolean>(false);
  const [showEmergencies, setShowEmergencies] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showLiveLocation, setShowLiveLocation] = useState<boolean>(true);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Sync fly target when an emergency or ambulance is selected
  useEffect(() => {
    if (selectedEmergency) {
      setFlyTarget([selectedEmergency.location.latitude, selectedEmergency.location.longitude]);
    } else if (selectedAmbulance) {
      setFlyTarget([selectedAmbulance.current_location.latitude, selectedAmbulance.current_location.longitude]);
    } else if (dispatchResult?.emergency_location) {
      setFlyTarget([dispatchResult.emergency_location.latitude, dispatchResult.emergency_location.longitude]);
    }
  }, [selectedEmergency, selectedAmbulance, dispatchResult]);

  // Locate Me handler: triggers high accuracy GPS and flies to coordinates
  const handleLocateMe = async () => {
    const loc = await detectLiveLocation();
    if (loc) {
      setFlyTarget([loc.latitude, loc.longitude]);
    }
  };

  // Coordinates for polyline routing
  const assignedAmb = dispatchResult?.assigned_ambulance;
  const emergencyLoc = dispatchResult?.emergency_location;
  const targetHosp = dispatchResult?.recommended_hospital;

  // Polyline 1: Ambulance -> Emergency Location
  const dispatchRoutePositions: [number, number][] =
    assignedAmb && emergencyLoc
      ? [
          [assignedAmb.current_location.latitude, assignedAmb.current_location.longitude],
          [emergencyLoc.latitude, emergencyLoc.longitude]
        ]
      : [];

  // Polyline 2: Emergency Location -> Target Hospital
  const hospitalRoutePositions: [number, number][] =
    emergencyLoc && targetHosp
      ? [
          [emergencyLoc.latitude, emergencyLoc.longitude],
          [targetHosp.location.latitude, targetHosp.location.longitude]
        ]
      : [];

  const handleMapClick = (lat: number, lng: number) => {
    setCustomDispatchLocation(lat, lng);
    if (onDispatchTriggered) {
      onDispatchTriggered(lat, lng, `Mira Road Radar Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  const filteredAmbulances = ambulances.filter(a => {
    if (!showAmbulances) return false;
    if (onlyAvailableAmbulances && a.status !== 'available') return false;
    return true;
  });

  const availableAmbulances = ambulances.filter(a => a.status === 'available');

  const hotspots = [
    { name: 'Shanti Park', lat: 19.2890, lng: 72.8610 },
    { name: 'Station East', lat: 19.2815, lng: 72.8558 },
    { name: 'Kashimira WE Hwy', lat: 19.2718, lng: 72.8752 },
    { name: 'Kanakia Hub', lat: 19.2867, lng: 72.8715 },
    { name: 'Silver Park', lat: 19.2942, lng: 72.8635 }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* MAP CONTROLS & LAYER BAR                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-white text-xs sm:text-sm">
            Mira Road CAD Operations Radar (19.2815°N, 72.8558°E)
          </span>
        </div>

        {/* Layer Visibility Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowEmergencies(!showEmergencies)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              showEmergencies
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Calls ({emergencyRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAmbulances(!showAmbulances)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              showAmbulances
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Siren className="w-3 h-3" />
            <span>Fleet ({ambulances.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyAvailableAmbulances(!onlyAvailableAmbulances)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              onlyAvailableAmbulances
                ? 'bg-emerald-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Only Avail ({availableAmbulances.length})
          </button>

          <button
            type="button"
            onClick={() => setShowHospitals(!showHospitals)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              showHospitals
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Hospitals ({hospitals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLiveLocation(!showLiveLocation)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              showLiveLocation
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Live Incident / User GPS Pin"
          >
            <MapPin className="w-3 h-3" />
            <span>Live Pin</span>
          </button>
        </div>
      </div>

      {/* Quick Hotspot Jump & Live Geolocation Bar */}
      <div className="px-3.5 py-2 bg-slate-800/90 text-slate-300 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {/* High-Accuracy Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-2.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs active:scale-95 disabled:opacity-50"
            title="Detect device GPS & center map on live location"
          >
            {isLocating ? (
              <RotateCw className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Crosshair className="w-3 h-3 text-sky-200" />
            )}
            <span>Locate Me</span>
          </button>

          {/* Continuous Live Watch Toggle */}
          <button
            type="button"
            onClick={toggleLiveLocationWatch}
            className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 text-[10px] ${
              isWatchActive
                ? 'bg-emerald-400 text-slate-950 font-black animate-pulse'
                : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300'
            }`}
            title="Toggle continuous real-time live telemetry stream"
          >
            <Radio className="w-3 h-3" />
            <span>{isWatchActive ? 'GPS Stream Active' : 'Live Stream'}</span>
          </button>

          <span className="text-slate-500 font-mono text-[10px] shrink-0">|</span>

          <span className="text-slate-400 font-mono font-bold uppercase text-[10px] shrink-0">
            Pan:
          </span>
          {hotspots.map((hs) => (
            <button
              key={hs.name}
              type="button"
              onClick={() => setFlyTarget([hs.lat, hs.lng])}
              className="px-2 py-0.5 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white font-medium cursor-pointer transition-colors shrink-0"
            >
              {hs.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFlyTarget(MIRA_ROAD_CENTER)}
            className="px-2 py-0.5 rounded-md bg-blue-900/60 hover:bg-blue-800 text-sky-200 font-bold cursor-pointer transition-colors shrink-0"
          >
            Reset Center
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-mono hidden md:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>Click radar to reposition dispatch fix</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEAFLET MAP CANVAS                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full h-[460px] md:h-[540px] bg-slate-100">
        <MapContainer
          center={MIRA_ROAD_CENTER}
          zoom={14}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
        >
          {/* OpenStreetMap Standard Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Click Handler */}
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Smooth FlyTo Controller */}
          <MapFlyToController target={flyTarget} />

          {/* -------------------------------------------------------------- */}
          {/* 1. INCOMING EMERGENCY REQUESTS (Mira Road 108 Calls)           */}
          {/* -------------------------------------------------------------- */}
          {showEmergencies &&
            emergencyRequests.map((req) => {
              const isSelected = selectedEmergency?.id === req.id;
              const icon = createEmergencyRequestIcon(req, isSelected);

              // Calculate nearest available ambulance for this request
              let nearestUnit: { amb: Ambulance; dist: number; eta: number } | null = null;
              if (availableAmbulances.length > 0) {
                const sorted = [...availableAmbulances].map(a => {
                  const dist = calculateHaversineKm(
                    a.current_location.latitude,
                    a.current_location.longitude,
                    req.location.latitude,
                    req.location.longitude
                  );
                  const eta = Math.max(2, Math.round(dist * 2.2));
                  return { amb: a, dist, eta };
                }).sort((a, b) => a.dist - b.dist);
                nearestUnit = sorted[0];
              }

              return (
                <Marker
                  key={req.id}
                  position={[req.location.latitude, req.location.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      if (onSelectEmergency) onSelectEmergency(req);
                    }
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-2 space-y-2 text-xs min-w-[240px]">
                      {/* Popup Header */}
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              req.priority.includes('P1') ? 'bg-rose-600 animate-ping' : 'bg-amber-500'
                            }`}
                          />
                          <strong className="text-slate-900 font-bold text-xs">{req.id}</strong>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            req.priority.includes('P1')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </div>

                      {/* Incident Details */}
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{req.emergencyType}</div>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.location.landmark}</span>
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Caller: <strong>{req.callerName}</strong> ({req.callerPhone})
                        </p>
                        {req.notes && (
                          <p className="text-slate-600 text-[10px] italic bg-slate-50 p-1 rounded mt-1">
                            &ldquo;{req.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Nearest Unit Calculation Preview */}
                      {req.status === 'pending' && nearestUnit && (
                        <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                          <span className="font-bold block">
                            Nearest: {nearestUnit.amb.vehicle_number} ({nearestUnit.amb.driver_name})
                          </span>
                          <span className="text-[10px] text-emerald-700">
                            Distance: {nearestUnit.dist} km • ETA: ~{nearestUnit.eta} mins
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onAssignEmergency) {
                              onAssignEmergency(req.id, nearestUnit?.amb.id);
                            } else if (onDispatchTriggered) {
                              onDispatchTriggered(
                                req.location.latitude,
                                req.location.longitude,
                                req.location.landmark
                              );
                            }
                          }}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Auto-Dispatch Nearest Unit</span>
                        </button>
                      ) : (
                        <div className="p-1 bg-blue-50 border border-blue-200 text-blue-900 rounded text-[11px] font-bold text-center">
                          Assigned to Unit {req.assignedAmbulancePlate || 'Dispatched'}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* -------------------------------------------------------------- */}
          {/* 2. FLEET AMBULANCE MARKERS                                     */}
          {/* -------------------------------------------------------------- */}
          {filteredAmbulances.map((amb) => {
            const isAssigned = assignedAmb?.id === amb.id;
            const icon = createAmbulanceIcon(amb.status, isAssigned, amb.vehicle_number);

            return (
              <Marker
                key={amb.id}
                position={[amb.current_location.latitude, amb.current_location.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectAmbulance) onSelectAmbulance(amb);
                  }
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1.5 space-y-1.5 text-xs min-w-[210px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <strong className="text-slate-900 font-mono text-sm">{amb.vehicle_number}</strong>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                          amb.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {amb.status}
                      </span>
                    </div>

                    <p className="text-slate-700 font-bold">{amb.type}</p>
                    <p className="text-slate-500 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{amb.current_location.landmark}</span>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Crew: <strong>{amb.driver_name}</strong> ({amb.contact})
                    </p>
                    <p className="text-slate-400 text-[10px] font-mono">
                      Base: {amb.base_station} • Fuel: {amb.fuel_level || '85%'}
                    </p>

                    {isAssigned && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-1.5 rounded text-[11px] font-bold">
                        Dispatched on Active Mission • ETA: ~{amb.estimated_eta_minutes || amb.eta_minutes || 4} mins
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* -------------------------------------------------------------- */}
          {/* 3. MIRA ROAD HOSPITALS                                         */}
          {/* -------------------------------------------------------------- */}
          {showHospitals &&
            hospitals.map((hosp) => {
              const isTarget = targetHosp?.id === hosp.id;
              const icon = createHospitalIcon(isTarget, hosp.icu_beds_available);

              return (
                <Marker
                  key={hosp.id}
                  position={[hosp.location.latitude, hosp.location.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-1.5 text-xs min-w-[220px] space-y-1">
                      <strong className="text-rose-700 block font-bold text-sm leading-tight">
                        {hosp.name}
                      </strong>
                      <p className="text-slate-600 text-[11px]">{hosp.address}</p>
                      <div className="flex items-center justify-between text-[11px] font-bold py-1 border-t border-b">
                        <span className="text-emerald-700">ICU Beds: {hosp.icu_beds_available}</span>
                        <span className="text-slate-600">Gen Beds: {hosp.general_beds_available || 18}</span>
                      </div>
                      <p className="text-slate-500 text-[10px]">Hotline: {hosp.emergency_contact}</p>
                      {isTarget && (
                        <span className="inline-block mt-1 bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          Designated Receiving Hospital
                        </span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* -------------------------------------------------------------- */}
          {/* 4. ACTIVE EMERGENCY DISPATCH PIN (Single Mission)              */}
          {/* -------------------------------------------------------------- */}
          {emergencyLoc && (
            <Marker
              position={[emergencyLoc.latitude, emergencyLoc.longitude]}
              icon={createEmergencyRequestIcon(
                {
                  id: 'ACTIVE-DISPATCH',
                  callerName: dispatchResult?.patient_name || 'Emergency Victim',
                  callerPhone: '108',
                  location: {
                    latitude: emergencyLoc.latitude,
                    longitude: emergencyLoc.longitude,
                    landmark: 'Incident Scene'
                  },
                  emergencyType: dispatchResult?.emergency_type || 'Active Distress',
                  priority: 'Critical (P1)',
                  timestamp: 'Active',
                  receivedAtMs: Date.now(),
                  status: 'assigned'
                },
                true
              )}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-rose-700 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Dispatched Emergency Incident</span>
                  </div>
                  <p className="text-slate-700 font-medium">
                    Type: {dispatchResult.emergency_type}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Victim: {dispatchResult.patient_name}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* -------------------------------------------------------------- */}
          {/* 5. USER CURRENT LIVE LOCATION FIX & ACCURACY RADAR             */}
          {/* -------------------------------------------------------------- */}
          {showLiveLocation && userCurrentLocation && (
            <>
              <Circle
                center={[userCurrentLocation.latitude, userCurrentLocation.longitude]}
                radius={userCurrentLocation.accuracyMeters || 25}
                pathOptions={{
                  color: '#0284c7',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.16,
                  weight: 1.5,
                  dashArray: '3, 3'
                }}
              />
              <Marker
                position={[userCurrentLocation.latitude, userCurrentLocation.longitude]}
                icon={createCurrentLocationIcon(userCurrentLocation.isLiveGPS)}
                zIndexOffset={1000}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-2 text-xs min-w-[240px]">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                        <Crosshair className="w-4 h-4 text-blue-600" />
                        <span>Current Dispatch Anchor</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                        userCurrentLocation.isLiveGPS ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {userCurrentLocation.isLiveGPS ? 'LIVE GPS' : 'BASELINE'}
                      </span>
                    </div>

                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {userCurrentLocation.landmark}
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                        {userCurrentLocation.latitude.toFixed(4)}°N, {userCurrentLocation.longitude.toFixed(4)}°E (±{userCurrentLocation.accuracyMeters || 15}m accuracy)
                      </div>
                      {userCurrentLocation.sector && (
                        <div className="text-slate-600 text-[11px] mt-0.5">
                          Operational Sector: <strong>{userCurrentLocation.sector}</strong>
                        </div>
                      )}
                      {userCurrentLocation.isProjected && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1 rounded mt-1">
                          Live device GPS fix mapped to Mira Road CAD coverage zone.
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onDispatchTriggered) {
                            onDispatchTriggered(
                              userCurrentLocation.latitude,
                              userCurrentLocation.longitude,
                              userCurrentLocation.landmark
                            );
                          }
                        }}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Dispatch Nearest Ambulance Here</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* -------------------------------------------------------------- */}
          {/* 6. ACTIVE ROUTING POLYLINES (Ambulance -> Scene -> Hospital)   */}
          {/* -------------------------------------------------------------- */}
          {dispatchRoutePositions.length === 2 && (
            <Polyline
              positions={dispatchRoutePositions}
              color="#2563EB"
              weight={5}
              dashArray="8, 8"
              opacity={0.9}
            />
          )}

          {hospitalRoutePositions.length === 2 && (
            <Polyline
              positions={hospitalRoutePositions}
              color="#DC2626"
              weight={4}
              dashArray="6, 6"
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
              <span>Calculating Nearest Available Unit & Route...</span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM LEGEND & ACTIVE ROUTE BANNER                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Available Unit ({availableAmbulances.length})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Busy / In-Transit ({ambulances.length - availableAmbulances.length})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping" />
            <span>Critical P1 Call</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <span>Urgent P2 Call</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
            <span>Hospital (ICU)</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-blue-900">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block ring-2 ring-blue-300" />
            <span>Live Fix: {userCurrentLocation?.sector || 'GPS Active'}</span>
          </span>
        </div>

        {dispatchResult && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1 rounded-xl text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Assigned: {dispatchResult.assigned_ambulance.vehicle_number} &rarr; Incident (~{dispatchResult.assigned_ambulance.estimated_eta_minutes || 4} mins)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
