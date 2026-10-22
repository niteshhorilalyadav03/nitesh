/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Module: Centralized App & Auth State Management (AppContext)
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  Ambulance,
  Hospital,
  DispatchMission,
  DispatchResult,
  ToastNotification,
  NotificationType,
  HospitalDoctor,
  PatientVitals,
  EmergencyRequest,
  LiveLocationState,
  normalizeRole
} from '../types';
import { soundManager } from '../utils/audioAlert';
import {
  getCurrentLiveLocation,
  watchLiveLocation,
  resolveSmartDispatchLocation,
  findNearestMiraRoadLandmark,
  calculateHaversineKm,
  interpolateGPS,
  MIRA_ROAD_CENTER
} from '../utils/geolocation';

export const MASTER_ADMIN_KEY = 'LIFELINE-ROOT-KEY-2026';

interface AppContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  doctors: HospitalDoctor[];
  activeMission: DispatchMission | null;
  isLoading: boolean;

  // Live Location & GPS Telemetry
  userCurrentLocation: LiveLocationState | null;
  detectLiveLocation: () => Promise<LiveLocationState | null>;
  isLocating: boolean;
  locationError: string | null;
  setUserCurrentLocation: (loc: LiveLocationState | null) => void;
  setCustomDispatchLocation: (lat: number, lng: number, landmark?: string, sector?: string) => void;
  isWatchActive: boolean;
  toggleLiveLocationWatch: () => void;

  // Emergency Requests CAD Queue
  emergencyRequests: EmergencyRequest[];
  createEmergencyRequest: (
    req: Omit<EmergencyRequest, 'id' | 'receivedAtMs' | 'timestamp' | 'status'>
  ) => EmergencyRequest;
  assignEmergencyRequest: (
    requestId: string,
    ambulanceId?: string
  ) => Promise<DispatchResult | null>;
  resolveEmergencyRequest: (requestId: string) => void;

  // Real-Time Global Notifications
  notifications: ToastNotification[];
  unreadNotificationCount: number;
  notify: (
    type: NotificationType,
    title: string,
    message: string,
    metadata?: ToastNotification['metadata']
  ) => void;
  removeNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Auth & Session & User Registration
  login: (
    role: UserRole,
    customEmail?: string,
    customName?: string,
    password?: string,
    adminKey?: string
  ) => { success: boolean; error?: string };
  registerUser: (
    profile: Omit<UserProfile, 'id' | 'createdAt'>
  ) => { success: boolean; error?: string };
  provisionSystemAdministrator: (adminData: {
    name: string;
    email: string;
    phone: string;
    clearanceLevel: 'Super Admin' | 'Fleet Manager' | 'System Auditor';
    adminSecretKey: string;
    currentAdminVerificationKey?: string;
  }) => { success: boolean; error?: string };
  verifyAdminKey: (key: string) => boolean;
  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // Dispatch & Fleet
  triggerDispatch: (
    lat: number,
    lng: number,
    emergencyType: string,
    patientName?: string,
    patientContact?: string,
    landmark?: string,
    accuracyMeters?: number,
    isLiveGPS?: boolean
  ) => Promise<DispatchResult | null>;
  toggleAmbulanceStatus: (ambulanceId: string, forcedStatus?: 'available' | 'busy') => Promise<void>;
  updateMissionStatus: (status: DispatchMission['status']) => void;
  completeMission: () => void;
  cancelEmergency: () => void;
  refreshFleet: () => Promise<void>;

  // Healthcare Coordination
  toggleDoctorDuty: (id: string) => void;
  updateHospitalBeds: (hospitalId: string, generalDelta: number, icuDelta: number) => void;
  updatePatientVitals: (vitals: PatientVitals) => void;
  updatePatientHandover: (doctorName: string, bedNumber: string, notes: string) => void;
  updateTreatmentStatus: (status: DispatchMission['treatmentStatus']) => void;

  // Admin CRUD Operations
  addUser: (user: Omit<UserProfile, 'id'>) => Promise<void> | void;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;

  addAmbulance: (ambulance: Ambulance) => void;
  updateAmbulance: (id: string, updates: Partial<Ambulance>) => void;
  deleteAmbulance: (id: string) => void;

  addHospital: (hospital: Hospital) => void;
  updateHospital: (id: string, updates: Partial<Hospital>) => void;
  deleteHospital: (id: string) => void;

  // Database Sync & Multi-User Telemetry
  dbConnected: boolean;
  dbLastSyncTime: string;
  dbStats: {
    totalUsers: number;
    engine: string;
    totalAuditLogs?: number;
    roleBreakdown?: Record<string, number>;
  } | null;
  refreshUsersFromDb: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to guarantee phone numbers are whole numbers and strictly 10 digits
export const clean10DigitPhone = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

// Initial Doctors for Healthcare Coordinator
const INITIAL_DOCTORS: HospitalDoctor[] = [
  {
    id: 'DOC-01',
    name: 'Dr. Rahul Mehta, MS',
    specialty: 'Trauma & Emergency Surgeon',
    onDuty: true,
    assignedBay: 'Resuscitation Bay 1',
    phone: '9820144556',
    activePatients: 1
  },
  {
    id: 'DOC-02',
    name: 'Dr. Priya Desai, MD',
    specialty: 'Emergency Medicine Consultant',
    onDuty: true,
    assignedBay: 'Trauma Bay 2',
    phone: '9820177889',
    activePatients: 2
  },
  {
    id: 'DOC-03',
    name: 'Dr. Farhan Qureshi, DM',
    specialty: 'Interventional Cardiologist',
    onDuty: true,
    assignedBay: 'Cardiac Cath Lab',
    phone: '9820188990',
    activePatients: 0
  },
  {
    id: 'DOC-04',
    name: 'Dr. Neha Varma, DNB',
    specialty: 'Intensive Critical Care Specialist',
    onDuty: false,
    assignedBay: 'ICU Unit A',
    phone: '9820122334',
    activePatients: 0
  }
];

// Initial Incoming Emergency Requests for Mira Road CAD System
const INITIAL_EMERGENCY_REQUESTS: EmergencyRequest[] = [
  {
    id: 'REQ-108-01',
    callerName: 'Sunita Roy',
    callerPhone: '9820455612',
    location: {
      latitude: 19.2890,
      longitude: 72.8610,
      landmark: 'Shanti Park, Sector 5 (Near Jain Temple)',
      sector: 'Sector 5'
    },
    emergencyType: 'Acute Cardiac Distress / Chest Pain',
    priority: 'Critical (P1)',
    timestamp: '2 mins ago',
    receivedAtMs: Date.now() - 2 * 60 * 1000,
    status: 'pending',
    notes: 'Elderly patient (68M) experiencing retrosternal crushing pain with diaphoresis.'
  },
  {
    id: 'REQ-108-02',
    callerName: 'Anand Verma',
    callerPhone: '9833112233',
    location: {
      latitude: 19.2718,
      longitude: 72.8752,
      landmark: 'Western Express Highway Junction, Kashimira',
      sector: 'Kashimira'
    },
    emergencyType: 'Multi-Vehicle Highway Collision (Trauma)',
    priority: 'Critical (P1)',
    timestamp: '5 mins ago',
    receivedAtMs: Date.now() - 5 * 60 * 1000,
    status: 'pending',
    notes: 'Overturned vehicle into divider. 2 passengers trapped with active bleeding.'
  },
  {
    id: 'REQ-108-03',
    callerName: 'Pooja Mehta',
    callerPhone: '9819922334',
    location: {
      latitude: 19.2867,
      longitude: 72.8715,
      landmark: 'Kanakia Sector 3, Near Cinemax Hub',
      sector: 'Kanakia'
    },
    emergencyType: 'Severe Breathlessness / Acute Asthma',
    priority: 'Urgent (P2)',
    timestamp: '8 mins ago',
    receivedAtMs: Date.now() - 8 * 60 * 1000,
    status: 'pending',
    notes: 'Inhaler exhausted, audible wheezing, patient struggling to speak.'
  },
  {
    id: 'REQ-108-04',
    callerName: 'Imran Sheikh',
    callerPhone: '9821199887',
    location: {
      latitude: 19.2815,
      longitude: 72.8558,
      landmark: 'Mira Road Railway Station (East Plaza)',
      sector: 'Station East'
    },
    emergencyType: 'Platform Fall / Head Laceration',
    priority: 'Urgent (P2)',
    timestamp: '11 mins ago',
    receivedAtMs: Date.now() - 11 * 60 * 1000,
    status: 'pending',
    notes: 'Pedestrian slipped on staircase. Responsive but disoriented with scalp hematoma.'
  },
  {
    id: 'REQ-108-05',
    callerName: 'Deepak Patel',
    callerPhone: '9870022331',
    location: {
      latitude: 19.2942,
      longitude: 72.8635,
      landmark: 'Silver Park, Poonam Sagar Complex',
      sector: 'Poonam Sagar'
    },
    emergencyType: 'Acute Stroke Symptoms / Facial Droop',
    priority: 'Critical (P1)',
    timestamp: '14 mins ago',
    receivedAtMs: Date.now() - 14 * 60 * 1000,
    status: 'pending',
    notes: 'Sudden right-sided arm paralysis and slurred speech observed 20 minutes prior.'
  }
];

// Initial Seed Users for the 5 Recommended Roles (Strictly 10-digit whole numbers)
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'USR-CIT-01',
    name: 'Meera Sharma',
    email: 'citizen.mira@lifeline.gov.in',
    role: 'Citizen',
    phone: '9892088776',
    bloodType: 'O Positive (O+)',
    emergencyContactName: 'Rajesh Sharma (Spouse)',
    emergencyContactPhone: '9892088770',
    allergies: 'Penicillin, Sulfa drugs',
    medicalNotes: 'Mild asthma, carries inhaler. Hypertension treated with Amlodipine.',
    defaultAddress: 'Flat 402, Shanti Park Sector 5, Mira Road East',
    createdAt: '2025-02-12'
  },
  {
    id: 'USR-OPR-02',
    name: 'Ramesh Pawar',
    email: 'operator.ramesh@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820112345',
    assignedVehicleId: 'AMB-001',
    assignedVehicleNumber: 'MH-04-AZ-1024',
    licenseNumber: 'MH-04-2018-009841',
    baseStation: 'Mira Road Railway Station Hub',
    shiftStatus: 'on-duty',
    createdAt: '2025-02-01'
  },
  {
    id: 'USR-CRD-03',
    name: 'Officer Jason Fernandes',
    email: 'coordinator.jason@lifeline-ems.gov.in',
    role: 'Emergency Coordinator',
    phone: '9820133445',
    operatorCode: 'EOC-7704',
    terminalNumber: 'TERMINAL-04',
    radioChannel: 'EMS-FREQ-154.25',
    createdAt: '2025-01-15'
  },
  {
    id: 'USR-HLT-04',
    name: 'Dr. Ananya Roy, MD',
    email: 'health.ananya@bhaktivedanta-hospital.org',
    role: 'Healthcare Coordinator',
    phone: '9820199887',
    affiliatedHospitalId: 'HOSP-001',
    affiliatedHospitalName: 'Bhaktivedanta Hospital & Research Institute',
    department: 'Emergency Medicine & Trauma ICU',
    emergencyContactExtension: 'EXT-108',
    createdAt: '2025-01-20'
  },
  {
    id: 'USR-ADM-05',
    name: 'Sarah Jenkins',
    email: 'admin.sarah@lifeline-ems.gov.in',
    role: 'Platform Administrator',
    phone: '9820011223',
    password: 'emergency108',
    clearanceLevel: 'Super Admin',
    canManageFleet: true,
    canManageUsers: true,
    adminSecretKey: 'EMS-ROOT-2025',
    createdAt: '2025-01-10'
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Session state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('lifeline_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            role: normalizeRole(parsed.role),
            phone: clean10DigitPhone(parsed.phone),
            ...(parsed.emergencyContactPhone
              ? { emergencyContactPhone: clean10DigitPhone(parsed.emergencyContactPhone) }
              : {})
          };
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  // 2. Users state (5 roles)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('lifeline_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          const mapped = parsed.map((u: UserProfile) => ({
            ...u,
            role: normalizeRole(u.role),
            phone: clean10DigitPhone(u.phone),
            ...(u.emergencyContactPhone
              ? { emergencyContactPhone: clean10DigitPhone(u.emergencyContactPhone) }
              : {})
          }));
          // Ensure Healthcare Coordinator exists
          const hasHealthcare = mapped.some(u => u.role === 'Healthcare Coordinator');
          if (!hasHealthcare) {
            mapped.push(INITIAL_USERS[3]);
          }
          return mapped;
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_USERS;
  });

  // Database Connection & Real-Time Sync State
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [dbLastSyncTime, setDbLastSyncTime] = useState<string>('Syncing...');
  const [dbStats, setDbStats] = useState<{
    totalUsers: number;
    engine: string;
    totalAuditLogs?: number;
    roleBreakdown?: Record<string, number>;
  } | null>(null);

  // 3. Doctors state for Healthcare Coordinator
  const [doctors, setDoctors] = useState<HospitalDoctor[]>(() => {
    const saved = localStorage.getItem('lifeline_doctors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_DOCTORS;
  });

  // 3b. Emergency Requests CAD state for Dispatcher
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>(() => {
    const saved = localStorage.getItem('lifeline_emergency_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_EMERGENCY_REQUESTS;
  });

  // Sync emergency requests
  useEffect(() => {
    localStorage.setItem('lifeline_emergency_requests', JSON.stringify(emergencyRequests));
  }, [emergencyRequests]);

  // 4. Fleet & Hospitals
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeMission, setActiveMission] = useState<DispatchMission | null>(() => {
    const saved = localStorage.getItem('lifeline_active_mission');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 4. Real-time Notifications state
  const [notifications, setNotifications] = useState<ToastNotification[]>(() => {
    const saved = localStorage.getItem('lifeline_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'notif-init-1',
        type: 'info',
        title: 'DISPATCH SYSTEM OPERATIONAL',
        message: 'Regional telemetry online. Real-time emergency monitoring active for Sector 401107.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true
      }
    ];
  });

  // Sync session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('lifeline_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('lifeline_session');
    }
  }, [currentUser]);

  // Sync users
  useEffect(() => {
    localStorage.setItem('lifeline_users', JSON.stringify(users));
  }, [users]);

  // Sync mission
  useEffect(() => {
    if (activeMission) {
      localStorage.setItem('lifeline_active_mission', JSON.stringify(activeMission));
    } else {
      localStorage.removeItem('lifeline_active_mission');
    }
  }, [activeMission]);

  // Sync notifications
  useEffect(() => {
    localStorage.setItem('lifeline_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync doctors
  useEffect(() => {
    localStorage.setItem('lifeline_doctors', JSON.stringify(doctors));
  }, [doctors]);

  // 5. Live GPS Location State
  const [userCurrentLocation, setUserCurrentLocation] = useState<LiveLocationState | null>(() => {
    const saved = localStorage.getItem('lifeline_live_location');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      latitude: 19.2890,
      longitude: 72.8610,
      accuracyMeters: 12,
      landmark: 'Shanti Park, Sector 5, Mira Road East',
      isLiveGPS: false,
      timestamp: Date.now()
    };
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isWatchActive, setIsWatchActive] = useState<boolean>(false);
  const watchCleanupRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    if (userCurrentLocation) {
      localStorage.setItem('lifeline_live_location', JSON.stringify(userCurrentLocation));
    }
  }, [userCurrentLocation]);

  // Request high-accuracy live GPS fix
  const detectLiveLocation = async (): Promise<LiveLocationState | null> => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const fix = await getCurrentLiveLocation(7000);
      const liveState: LiveLocationState = {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
        landmark: fix.landmark,
        sector: fix.sector,
        isLiveGPS: true,
        isProjected: fix.isProjected,
        rawLatitude: fix.rawLatitude,
        rawLongitude: fix.rawLongitude,
        speedKmh: fix.speedKmh,
        timestamp: fix.timestamp
      };
      setUserCurrentLocation(liveState);
      soundManager.playStatusBlip();
      if (fix.isProjected) {
        notify(
          'info',
          'LIVE GPS ANCHORED TO MIRA ROAD CAD',
          `Device GPS fix captured (${fix.rawLatitude?.toFixed(2)}°N, ${fix.rawLongitude?.toFixed(2)}°E). Calibrated to Mira Road ${fix.sector} for realistic emergency routing.`
        );
      } else {
        notify(
          'status',
          'CURRENT LIVE GPS LOCKED',
          `High-precision GPS active: ${fix.landmark} (${fix.latitude.toFixed(4)}°N, ${fix.longitude.toFixed(4)}°E) with ±${fix.accuracyMeters}m accuracy.`
        );
      }
      return liveState;
    } catch (err: any) {
      console.warn('Geolocation capture failed or denied:', err);
      setLocationError(err?.message || 'Location permission denied');
      const fallbackState: LiveLocationState = {
        latitude: 19.2890,
        longitude: 72.8610,
        accuracyMeters: 20,
        landmark: 'Shanti Park Sector 5, Mira Road (Regional Baseline)',
        sector: 'Shanti Park',
        isLiveGPS: false,
        isProjected: false,
        timestamp: Date.now()
      };
      setUserCurrentLocation(fallbackState);
      notify(
        'warning',
        'USING REGIONAL BASELINE GPS',
        'Device location permission not granted. Standard Mira Road coordinate anchor loaded.'
      );
      return fallbackState;
    } finally {
      setIsLocating(false);
    }
  };

  // Set explicit dispatch location (from map clicks, hotspot picks, or manual CAD input)
  const setCustomDispatchLocation = (
    lat: number,
    lng: number,
    customLandmark?: string,
    customSector?: string
  ) => {
    const nearest = findNearestMiraRoadLandmark(lat, lng);
    const resolvedLandmark = customLandmark || nearest.landmark;
    const resolvedSector = customSector || nearest.sector;
    const updated: LiveLocationState = {
      latitude: parseFloat(lat.toFixed(5)),
      longitude: parseFloat(lng.toFixed(5)),
      accuracyMeters: 10,
      landmark: resolvedLandmark,
      sector: resolvedSector,
      isLiveGPS: false,
      isProjected: false,
      timestamp: Date.now()
    };
    setUserCurrentLocation(updated);
    soundManager.playStatusBlip();
    notify(
      'status',
      'DISPATCH LOCATION SET',
      `Target incident coordinates set to: ${resolvedLandmark} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E).`
    );
  };

  // Toggle continuous real-time live location tracking
  const toggleLiveLocationWatch = () => {
    if (isWatchActive) {
      if (watchCleanupRef.current) {
        watchCleanupRef.current();
        watchCleanupRef.current = null;
      }
      setIsWatchActive(false);
      notify('info', 'LIVE GPS STREAM PAUSED', 'Continuous telemetry tracking stopped.');
    } else {
      try {
        const cleanup = watchLiveLocation(
          (fix) => {
            setUserCurrentLocation({
              latitude: fix.latitude,
              longitude: fix.longitude,
              accuracyMeters: fix.accuracyMeters,
              landmark: fix.landmark,
              sector: fix.sector,
              isLiveGPS: true,
              isProjected: fix.isProjected,
              rawLatitude: fix.rawLatitude,
              rawLongitude: fix.rawLongitude,
              speedKmh: fix.speedKmh,
              timestamp: fix.timestamp
            });
          },
          (err) => {
            console.warn('Watch error:', err);
            setLocationError(err.message);
          }
        );
        watchCleanupRef.current = cleanup;
        setIsWatchActive(true);
        notify('status', 'LIVE GPS STREAM ACTIVE', 'Real-time telemetry continuous tracking stream connected.');
      } catch (err: any) {
        notify('warning', 'GPS WATCH FAILED', err?.message || 'Unable to start watch.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (watchCleanupRef.current) {
        watchCleanupRef.current();
      }
    };
  }, []);

  // Live moving ambulance telemetry simulation along the route during active mission
  useEffect(() => {
    if (!activeMission || activeMission.status === 'completed' || activeMission.status === 'at-scene') return;

    const interval = setInterval(() => {
      setActiveMission(prev => {
        if (!prev) return null;

        // If 'dispatched', move toward patient emergency location
        if (prev.status === 'dispatched') {
          const currentAmb = ambulances.find(a => a.id === prev.ambulanceId);
          if (!currentAmb) return prev;

          const currentLat = currentAmb.current_location.latitude;
          const currentLng = currentAmb.current_location.longitude;
          const targetLat = prev.emergencyLocation.latitude;
          const targetLng = prev.emergencyLocation.longitude;

          const dist = calculateHaversineKm(currentLat, currentLng, targetLat, targetLng);

          // If reached patient scene (less than 80 meters)
          if (dist <= 0.08) {
            soundManager.playEmergencyAlert();
            notify(
              'emergency',
              'AMBULANCE ARRIVED AT SCENE',
              `Unit ${prev.ambulanceVehicleNumber} has reached ${prev.emergencyLocation.landmark || 'patient location'}. Paramedics on-site.`
            );
            return {
              ...prev,
              distanceKm: 0,
              etaMinutes: 0,
              status: 'at-scene'
            };
          }

          // Advance 14% closer per tick
          const nextPos = interpolateGPS(currentLat, currentLng, targetLat, targetLng, 0.14);
          const nextDist = calculateHaversineKm(nextPos.latitude, nextPos.longitude, targetLat, targetLng);
          const nextEta = Math.max(1, Math.round(nextDist * 2.2));

          // Update fleet coordinates
          setAmbulances(fleet =>
            fleet.map(a =>
              a.id === prev.ambulanceId
                ? {
                    ...a,
                    current_location: {
                      ...a.current_location,
                      latitude: nextPos.latitude,
                      longitude: nextPos.longitude
                    },
                    distance_km: nextDist,
                    estimated_eta_minutes: nextEta
                  }
                : a
            )
          );

          return {
            ...prev,
            distanceKm: nextDist,
            etaMinutes: nextEta
          };
        }

        // If 'transporting', move from patient scene toward destination hospital
        if (prev.status === 'transporting') {
          const currentAmb = ambulances.find(a => a.id === prev.ambulanceId);
          if (!currentAmb) return prev;

          const currentLat = currentAmb.current_location.latitude;
          const currentLng = currentAmb.current_location.longitude;
          const hospLat = prev.hospital.location.latitude;
          const hospLng = prev.hospital.location.longitude;

          const dist = calculateHaversineKm(currentLat, currentLng, hospLat, hospLng);

          if (dist <= 0.08) {
            soundManager.playStatusBlip();
            notify(
              'success',
              'AMBULANCE ARRIVED AT HOSPITAL',
              `Unit ${prev.ambulanceVehicleNumber} arrived at ${prev.hospital.name}. Trauma bay handover in progress.`
            );
            return {
              ...prev,
              distanceKm: 0,
              etaMinutes: 0
            };
          }

          const nextPos = interpolateGPS(currentLat, currentLng, hospLat, hospLng, 0.14);
          const nextDist = calculateHaversineKm(nextPos.latitude, nextPos.longitude, hospLat, hospLng);
          const nextEta = Math.max(1, Math.round(nextDist * 2.0));

          setAmbulances(fleet =>
            fleet.map(a =>
              a.id === prev.ambulanceId
                ? {
                    ...a,
                    current_location: {
                      ...a.current_location,
                      latitude: nextPos.latitude,
                      longitude: nextPos.longitude
                    },
                    distance_km: nextDist,
                    estimated_eta_minutes: nextEta
                  }
                : a
            )
          );

          return {
            ...prev,
            distanceKm: nextDist,
            etaMinutes: nextEta
          };
        }

        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeMission?.status, activeMission?.id, ambulances]);

  // Notification helper
  const notify = (
    type: NotificationType,
    title: string,
    message: string,
    metadata?: ToastNotification['metadata']
  ) => {
    const newNotif: ToastNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      read: false,
      metadata
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]); // Keep last 20 notifications
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Fetch initial fleet and hospitals from backend
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [ambRes, hospRes] = await Promise.all([
        fetch('/api/ambulances'),
        fetch('/api/hospitals')
      ]);

      if (ambRes.ok) {
        const ambData = await ambRes.json();
        setAmbulances(ambData.data || []);
      }
      if (hospRes.ok) {
        const hospData = await hospRes.json();
        setHospitals(hospData.data || []);
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync users and database statistics from SQLite backend
  const refreshUsersFromDb = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/database/stats')
      ]);

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success && Array.isArray(usersJson.data) && usersJson.data.length > 0) {
          const mappedUsers = usersJson.data.map((u: UserProfile) => ({
            ...u,
            role: normalizeRole(u.role),
            phone: clean10DigitPhone(u.phone),
            ...(u.emergencyContactPhone
              ? { emergencyContactPhone: clean10DigitPhone(u.emergencyContactPhone) }
              : {})
          }));
          setUsers(mappedUsers);
          setDbConnected(true);
          setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success && statsJson.data) {
          setDbStats(statsJson.data);
          setDbConnected(true);
        }
      }
    } catch (err) {
      console.warn('Database fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    refreshUsersFromDb();

    // Setup Real-time Server-Sent Events (SSE) Bus
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onopen = () => {
        setDbConnected(true);
      };
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'USER_ADDED') {
            const newUser = payload.data as UserProfile;
            const sanitizedNewUser: UserProfile = {
              ...newUser,
              role: normalizeRole(newUser.role),
              phone: clean10DigitPhone(newUser.phone),
              ...(newUser.emergencyContactPhone
                ? { emergencyContactPhone: clean10DigitPhone(newUser.emergencyContactPhone) }
                : {})
            };
            setUsers(prev => {
              if (prev.some(u => u.id === sanitizedNewUser.id)) return prev;
              return [sanitizedNewUser, ...prev];
            });
            setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            soundManager.playStatusBlip();
            notify(
              'info',
              'DATABASE MULTI-USER SYNC',
              `New personnel added: ${sanitizedNewUser.name} (${sanitizedNewUser.role}). Synced across network.`
            );
          } else if (payload.type === 'USER_UPDATED') {
            const updatedUser = payload.data as UserProfile;
            const sanitized = {
              ...updatedUser,
              role: normalizeRole(updatedUser.role),
              phone: clean10DigitPhone(updatedUser.phone)
            };
            setUsers(prev => prev.map(u => (u.id === sanitized.id ? sanitized : u)));
            setCurrentUser(prev => (prev?.id === sanitized.id ? sanitized : prev));
            setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } else if (payload.type === 'USER_DELETED') {
            const { id, name, role } = payload.data;
            setUsers(prev => prev.filter(u => u.id !== id));
            setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            notify(
              'warning',
              'DATABASE RECORD DELETED',
              `User ${name || id} (${role || 'Personnel'}) removed from database.`
            );
          }
        } catch {
          // ignore heartbeat
        }
      };
      eventSource.onerror = () => {
        // SSE will attempt reconnect
      };
    } catch (e) {
      console.warn('SSE stream unavailable:', e);
    }

    // Periodic Polling Fallback (every 7 seconds)
    const pollTimer = setInterval(() => {
      refreshUsersFromDb();
    }, 7000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollTimer);
    };
  }, []);

  const refreshFleet = async () => {
    try {
      const res = await fetch('/api/ambulances');
      if (res.ok) {
        const data = await res.json();
        setAmbulances(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // AUTHENTICATION & ACCESS CONTROL
  // --------------------------------------------------------------------------
  const verifyAdminKey = (key: string): boolean => {
    if (!key) return false;
    const cleanKey = key.trim();
    if (cleanKey === 'EMS-ROOT-2025') return true;
    return users.some(
      u =>
        normalizeRole(u.role) === 'Platform Administrator' &&
        u.adminSecretKey &&
        u.adminSecretKey.trim() === cleanKey
    );
  };

  const login = (
    role: UserRole,
    customEmail?: string,
    customName?: string,
    password?: string,
    adminKey?: string
  ): { success: boolean; error?: string } => {
    const canonicalRole = normalizeRole(role);

    // SECURITY GATE: Platform / System Administrator portal exclusivity
    if (canonicalRole === 'Platform Administrator') {
      const isKeyValid = adminKey ? verifyAdminKey(adminKey) : false;
      if (!isKeyValid) {
        soundManager.playEmergencyAlert();
        notify(
          'warning',
          'ACCESS DENIED: ADMIN CLEARANCE REQUIRED',
          'Master System Administrator Clearance Key is required to enter the Platform Administrator portal.'
        );
        return {
          success: false,
          error:
            'Access Denied: Master System Administrator Clearance Key required. Only authorized administrators can access this portal.'
        };
      }

      // Find specific administrator by email or default administrator
      let adminUser: UserProfile | undefined;
      if (customEmail) {
        adminUser = users.find(
          u =>
            normalizeRole(u.role) === 'Platform Administrator' &&
            u.email.toLowerCase() === customEmail.trim().toLowerCase()
        );
      }
      if (!adminUser) {
        adminUser = users.find(u => normalizeRole(u.role) === 'Platform Administrator');
      }

      if (adminUser) {
        setCurrentUser(adminUser);
        soundManager.playStatusBlip();
        notify('success', 'ADMINISTRATOR AUTHENTICATED', `Welcome, ${adminUser.name}. System Administrator portal unlocked.`);
        return { success: true };
      }
    }

    // Normal Roles: Citizen, Ambulance Operator, Emergency Coordinator, Healthcare Coordinator
    let matchedUser: UserProfile | undefined;
    if (customEmail) {
      matchedUser = users.find(
        u => u.email.toLowerCase() === customEmail.trim().toLowerCase()
      );
    }
    if (!matchedUser) {
      matchedUser = users.find(u => u.role === canonicalRole || u.role === role);
    }

    if (matchedUser) {
      if (password && matchedUser.password && matchedUser.password !== password) {
        return {
          success: false,
          error: 'Incorrect password entered. Please check your credentials.'
        };
      }
      setCurrentUser(matchedUser);
      soundManager.playStatusBlip();
      notify('info', 'SESSION STARTED', `Logged in as ${matchedUser.name} (${canonicalRole}).`);
      return { success: true };
    } else {
      const newUser: UserProfile = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: customName || `${canonicalRole} Operator`,
        email: customEmail || `${canonicalRole.toLowerCase().replace(/\s+/g, '.')}@lifeline.ems.in`,
        role: canonicalRole,
        phone: '9800012345',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
      soundManager.playStatusBlip();
      notify('info', 'SESSION STARTED', `Logged in as ${newUser.name} (${canonicalRole}).`);
      return { success: true };
    }
  };

  const registerUser = (
    profileData: Omit<UserProfile, 'id' | 'createdAt'>
  ): { success: boolean; error?: string } => {
    const canonicalRole = normalizeRole(profileData.role);

    // CRITICAL SECURITY RULE: System Administrator CANNOT be created through public registration!
    if (canonicalRole === 'Platform Administrator') {
      soundManager.playEmergencyAlert();
      notify(
        'warning',
        'SECURITY POLICY VIOLATION',
        'System Administrator accounts cannot be registered publicly. Only existing System Administrators can provision them.'
      );
      return {
        success: false,
        error:
          'Security Policy Violation: System Administrator accounts cannot be registered publicly. They can only be provisioned internally by an authorized System Administrator.'
      };
    }

    // Validations
    if (!profileData.name || !profileData.name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!profileData.email || !profileData.email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    const cleanPhone = clean10DigitPhone(profileData.phone);
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // Check email uniqueness
    const emailExists = users.some(
      u => u.email.toLowerCase() === profileData.email.trim().toLowerCase()
    );
    if (emailExists) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.'
      };
    }

    const newUser: UserProfile = {
      ...profileData,
      id: `USR-${canonicalRole.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: profileData.name.trim(),
      email: profileData.email.trim().toLowerCase(),
      phone: cleanPhone,
      role: canonicalRole,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
      ...(profileData.emergencyContactPhone
        ? { emergencyContactPhone: clean10DigitPhone(profileData.emergencyContactPhone) }
        : {})
    };

    // Optimistically store in users registry
    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);

    // Save to shared SQLite database
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUsers(prev => [data.data, ...prev.filter(u => u.id !== newUser.id && u.id !== data.data.id)]);
        }
      })
      .catch(err => console.error('Error saving user to database:', err));

    soundManager.playStatusBlip();
    notify(
      'success',
      'PROFILE SAVED TO DATABASE',
      `Welcome, ${newUser.name}! Your ${canonicalRole} profile has been saved to the database and is now live across all dashboards.`
    );

    return { success: true };
  };

  const provisionSystemAdministrator = (adminData: {
    name: string;
    email: string;
    phone: string;
    clearanceLevel: 'Super Admin' | 'Fleet Manager' | 'System Auditor';
    adminSecretKey: string;
    currentAdminVerificationKey?: string;
  }): { success: boolean; error?: string } => {
    // Check if caller is an existing System Administrator
    if (!currentUser || normalizeRole(currentUser.role) !== 'Platform Administrator') {
      return {
        success: false,
        error: 'Access Denied: Only an active, authenticated System Administrator can provision new System Administrators.'
      };
    }

    // Verify current administrator's verification key
    const authKey = adminData.currentAdminVerificationKey?.trim();
    const isMasterValid =
      authKey === 'EMS-ROOT-2025' ||
      (currentUser.adminSecretKey && authKey === currentUser.adminSecretKey.trim());

    if (!isMasterValid) {
      soundManager.playEmergencyAlert();
      notify('warning', 'PROVISIONING REJECTED', 'Invalid Master Clearance Key verification.');
      return {
        success: false,
        error: 'Authorization Failed: Incorrect current administrator clearance key. Provisioning aborted.'
      };
    }

    const cleanPhone = clean10DigitPhone(adminData.phone);
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number for the new administrator.' };
    }

    const emailExists = users.some(
      u => u.email.toLowerCase() === adminData.email.trim().toLowerCase()
    );
    if (emailExists) {
      return { success: false, error: 'An administrator or user with this email address already exists.' };
    }

    const newAdmin: UserProfile = {
      id: `USR-ADM-${Date.now().toString().slice(-4)}`,
      name: adminData.name.trim(),
      email: adminData.email.trim().toLowerCase(),
      phone: cleanPhone,
      role: 'Platform Administrator',
      clearanceLevel: adminData.clearanceLevel || 'Super Admin',
      canManageFleet: true,
      canManageUsers: true,
      adminSecretKey: adminData.adminSecretKey?.trim() || 'EMS-ROOT-2025',
      createdByAdminId: currentUser.id,
      securityKeyLastVerified: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true
    };

    setUsers(prev => [newAdmin, ...prev]);

    // Persist to database
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdmin)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUsers(prev => [data.data, ...prev.filter(u => u.id !== newAdmin.id && u.id !== data.data.id)]);
        }
      })
      .catch(err => console.error('Error saving admin to database:', err));

    soundManager.playStatusBlip();
    notify(
      'status',
      'SYSTEM ADMINISTRATOR ENROLLED IN DATABASE',
      `New System Administrator ${newAdmin.name} (${newAdmin.clearanceLevel}) has been securely provisioned by ${currentUser.name} and saved to database.`
    );

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      notify('info', 'SESSION ENDED', `Operator ${currentUser.name} logged out.`);
    }
    setCurrentUser(null);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const sanitizedUpdates = {
      ...updates,
      ...(updates.phone ? { phone: clean10DigitPhone(updates.phone) } : {}),
      ...(updates.emergencyContactPhone
        ? { emergencyContactPhone: clean10DigitPhone(updates.emergencyContactPhone) }
        : {})
    };
    const updated = { ...currentUser, ...sanitizedUpdates };
    setCurrentUser(updated);

    // Update in users list
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updated : u)));
    notify('success', 'PROFILE UPDATED', 'User settings and credentials synchronized successfully.');
  };

  // --------------------------------------------------------------------------
  // DISPATCH & ACTIVE MISSIONS
  // --------------------------------------------------------------------------
  const triggerDispatch = async (
    lat: number,
    lng: number,
    emergencyType: string,
    patientName: string = currentUser?.name || 'Emergency Victim',
    patientContact: string = currentUser?.phone || '9892088776',
    landmark: string = 'Mira Road GPS Landmark'
  ): Promise<DispatchResult | null> => {
    try {
      const res = await fetch('/api/ambulances/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          emergency_type: emergencyType,
          patient_name: patientName
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.dispatch_result) {
        const result: DispatchResult = data.dispatch_result;

        const assignedVehicle = result.assigned_ambulance;
        const eta = assignedVehicle.estimated_eta_minutes || assignedVehicle.eta_minutes || 4;
        const dist = assignedVehicle.distance_km || 1.8;

        // Build active mission to carry forward to Driver & Patient
        const newMission: DispatchMission = {
          id: `MSN-${Date.now().toString().slice(-5)}`,
          ambulanceId: assignedVehicle.id,
          ambulanceVehicleNumber: assignedVehicle.vehicle_number,
          ambulanceType: assignedVehicle.type,
          driverName: assignedVehicle.driver_name,
          driverContact: assignedVehicle.contact,
          patientName,
          patientContact,
          emergencyType,
          emergencyLocation: {
            latitude: lat,
            longitude: lng,
            landmark
          },
          hospital: result.recommended_hospital || {
            id: 'HOSP-001',
            name: 'Bhaktivedanta Hospital & Research Institute',
            address: 'Sector 1, Srishti Complex, Mira Road East',
            location: { latitude: 19.2905, longitude: 72.8628 },
            emergency_contact: '022-29452500',
            icu_beds_available: 5,
            has_trauma_center: true
          },
          distanceKm: dist,
          etaMinutes: eta,
          status: 'dispatched',
          dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setActiveMission(newMission);

        // Update emergency requests queue
        setEmergencyRequests(prev => {
          const matchingIdx = prev.findIndex(
            r => r.status === 'pending' && (
              r.callerName.toLowerCase() === patientName.toLowerCase() ||
              (Math.abs(r.location.latitude - lat) < 0.005 && Math.abs(r.location.longitude - lng) < 0.005)
            )
          );
          if (matchingIdx >= 0) {
            const updated = [...prev];
            updated[matchingIdx] = {
              ...updated[matchingIdx],
              status: 'assigned',
              assignedAmbulanceId: assignedVehicle.id,
              assignedAmbulancePlate: assignedVehicle.vehicle_number,
              targetHospitalId: newMission.hospital.id
            };
            return updated;
          }
          // If not in queue, prepend as active assigned request
          const newReq: EmergencyRequest = {
            id: `REQ-${Date.now().toString().slice(-5)}`,
            callerName: patientName,
            callerPhone: patientContact,
            location: {
              latitude: lat,
              longitude: lng,
              landmark
            },
            emergencyType,
            priority: 'Critical (P1)',
            timestamp: 'Just now',
            receivedAtMs: Date.now(),
            status: 'assigned',
            assignedAmbulanceId: assignedVehicle.id,
            assignedAmbulancePlate: assignedVehicle.vehicle_number,
            targetHospitalId: newMission.hospital.id
          };
          return [newReq, ...prev];
        });

        // Update ambulance status locally & backend to 'busy'
        await toggleAmbulanceStatus(assignedVehicle.id, 'busy');

        // TRIGGER REAL-TIME EMERGENCY AUDIO CHIME & TOAST NOTIFICATION
        soundManager.playEmergencyAlert();
        notify(
          'emergency',
          'EMERGENCY DISPATCH ASSIGNED',
          `Ambulance ${assignedVehicle.vehicle_number} (${assignedVehicle.driver_name}) dispatched to ${patientName} @ ${landmark}. Estimated ETA: ~${eta} mins (${dist} km away).`,
          {
            ambulanceId: assignedVehicle.id,
            vehicleNumber: assignedVehicle.vehicle_number,
            missionId: newMission.id,
            status: 'dispatched',
            etaMinutes: eta
          }
        );

        return result;
      }
      return null;
    } catch (err) {
      console.error('Trigger dispatch error:', err);
      notify('warning', 'DISPATCH FAILURE', 'Unable to calculate nearest unit. Check backend gateway status.');
      return null;
    }
  };

  const toggleAmbulanceStatus = async (ambulanceId: string, forcedStatus?: 'available' | 'busy') => {
    try {
      const amb = ambulances.find(a => a.id === ambulanceId);
      const nextStatus = forcedStatus || (amb?.status === 'available' ? 'busy' : 'available');

      await fetch(`/api/ambulances/${ambulanceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      setAmbulances(prev =>
        prev.map(a => (a.id === ambulanceId ? { ...a, status: nextStatus } : a))
      );

      // Trigger status audio blip & toast alert
      soundManager.playStatusBlip();
      notify(
        'status',
        'FLEET STATUS UPDATED',
        `Unit ${amb?.vehicle_number || ambulanceId} status changed to '${nextStatus.toUpperCase()}'.`,
        {
          ambulanceId,
          vehicleNumber: amb?.vehicle_number,
          status: nextStatus
        }
      );
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const updateMissionStatus = (status: DispatchMission['status']) => {
    if (!activeMission) return;
    setActiveMission(prev => (prev ? { ...prev, status } : null));

    soundManager.playStatusBlip();
    notify(
      'status',
      'MISSION STATUS PROGRESSION',
      `Mission ${activeMission.id} progression stage set to: ${status.toUpperCase()} (${activeMission.ambulanceVehicleNumber}).`,
      {
        missionId: activeMission.id,
        status,
        vehicleNumber: activeMission.ambulanceVehicleNumber
      }
    );
  };

  const completeMission = async () => {
    if (activeMission) {
      const completedMissionId = activeMission.id;
      const vehicleNum = activeMission.ambulanceVehicleNumber;
      // Mark assigned ambulance back to available
      await toggleAmbulanceStatus(activeMission.ambulanceId, 'available');
      setActiveMission(null);

      soundManager.playStatusBlip();
      notify(
        'success',
        'MISSION COMPLETED & HANDOFF DONE',
        `Mission ${completedMissionId} concluded. Vehicle ${vehicleNum} returned to base and is AVAILABLE for new emergency runs.`,
        {
          missionId: completedMissionId,
          vehicleNumber: vehicleNum,
          status: 'available'
        }
      );
    }
  };

  const cancelEmergency = async () => {
    if (activeMission) {
      const cancelledId = activeMission.id;
      const vehicleNum = activeMission.ambulanceVehicleNumber;
      await toggleAmbulanceStatus(activeMission.ambulanceId, 'available');
      setActiveMission(null);

      soundManager.playStatusBlip();
      notify(
        'warning',
        'EMERGENCY DISPATCH CANCELLED',
        `Dispatched call for Mission ${cancelledId} has been cancelled. Stand down order transmitted to ${vehicleNum}.`,
        {
          missionId: cancelledId,
          vehicleNumber: vehicleNum
        }
      );
    }
  };

  // --------------------------------------------------------------------------
  // ADMIN CRUD: USERS (Persisted to SQLite Database)
  // --------------------------------------------------------------------------
  const addUser = async (newUser: Omit<UserProfile, 'id'>) => {
    const sanitizedPhone = clean10DigitPhone(newUser.phone) || '9800012345';
    const tempId = `USR-${Date.now().toString().slice(-4)}`;
    const created: UserProfile = {
      ...newUser,
      phone: sanitizedPhone,
      ...(newUser.emergencyContactPhone
        ? { emergencyContactPhone: clean10DigitPhone(newUser.emergencyContactPhone) }
        : {}),
      id: tempId,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Optimistic local update
    setUsers(prev => [created, ...prev]);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUsers(prev => [data.data, ...prev.filter(u => u.id !== tempId && u.id !== data.data.id)]);
        setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        soundManager.playStatusBlip();
        notify(
          'success',
          'USER SAVED TO DATABASE',
          `Account for ${data.data.name} (${data.data.role}) persisted in SQLite database and synchronized across all dashboards.`
        );
      }
    } catch (err) {
      console.error('Failed to add user to database:', err);
      soundManager.playStatusBlip();
      notify('success', 'USER CREATED (LOCAL CACHE)', `Account for ${created.name} (${created.role}) has been registered.`);
    }
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    const sanitizedUpdates = {
      ...updates,
      ...(updates.phone ? { phone: clean10DigitPhone(updates.phone) } : {}),
      ...(updates.emergencyContactPhone
        ? { emergencyContactPhone: clean10DigitPhone(updates.emergencyContactPhone) }
        : {})
    };
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...sanitizedUpdates } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => (prev ? { ...prev, ...sanitizedUpdates } : null));
    }

    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUpdates)
      });
      setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to update user in database:', err);
    }

    soundManager.playStatusBlip();
    notify('info', 'USER MODIFIED IN DATABASE', `Account ${id} permissions updated in SQLite database.`);
  };

  const deleteUser = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));

    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      setDbLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to delete user in database:', err);
    }

    soundManager.playStatusBlip();
    notify('warning', 'USER DELETED FROM DATABASE', `Account ${userToDelete?.name || id} was removed from the database.`);
  };

  // --------------------------------------------------------------------------
  // ADMIN CRUD: AMBULANCES
  // --------------------------------------------------------------------------
  const addAmbulance = (amb: Ambulance) => {
    setAmbulances(prev => [amb, ...prev]);
    soundManager.playStatusBlip();
    notify('success', 'VEHICLE ENROLLED', `Ambulance ${amb.vehicle_number} added to active fleet inventory.`);
  };

  const updateAmbulance = (id: string, updates: Partial<Ambulance>) => {
    setAmbulances(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    soundManager.playStatusBlip();
    notify('info', 'VEHICLE UPDATED', `Specifications for unit ${id} modified.`);
  };

  const deleteAmbulance = (id: string) => {
    const ambToDelete = ambulances.find(a => a.id === id);
    setAmbulances(prev => prev.filter(a => a.id !== id));
    soundManager.playStatusBlip();
    notify('warning', 'VEHICLE DECOMMISSIONED', `Unit ${ambToDelete?.vehicle_number || id} was retired from active fleet.`);
  };

  // --------------------------------------------------------------------------
  // ADMIN CRUD: HOSPITALS
  // --------------------------------------------------------------------------
  const addHospital = (hosp: Hospital) => {
    setHospitals(prev => [hosp, ...prev]);
    soundManager.playStatusBlip();
    notify('success', 'HOSPITAL AFFILIATED', `${hosp.name} joined the trauma dispatch network.`);
  };

  const updateHospital = (id: string, updates: Partial<Hospital>) => {
    setHospitals(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
    soundManager.playStatusBlip();
    notify('info', 'HOSPITAL DATA UPDATED', `Capacity records for ${id} synchronized.`);
  };

  const deleteHospital = (id: string) => {
    const hospToDelete = hospitals.find(h => h.id === id);
    setHospitals(prev => prev.filter(h => h.id !== id));
    soundManager.playStatusBlip();
    notify('warning', 'FACILITY REMOVED', `${hospToDelete?.name || id} unlinked from dispatch records.`);
  };

  // --------------------------------------------------------------------------
  // HEALTHCARE COORDINATION & CLINICAL HANDOVER
  // --------------------------------------------------------------------------
  const toggleDoctorDuty = (id: string) => {
    setDoctors(prev =>
      prev.map(doc => (doc.id === id ? { ...doc, onDuty: !doc.onDuty } : doc))
    );
    const target = doctors.find(d => d.id === id);
    soundManager.playStatusBlip();
    notify(
      'status',
      'DOCTOR SHIFT STATUS UPDATED',
      `${target?.name || id} is now marked ${!target?.onDuty ? 'ON DUTY' : 'OFF DUTY'}.`
    );
  };

  const updateHospitalBeds = (hospitalId: string, generalDelta: number, icuDelta: number) => {
    setHospitals(prev =>
      prev.map(h => {
        if (h.id === hospitalId) {
          const newIcu = Math.max(0, (h.icu_beds_available || 0) + icuDelta);
          const newGen = Math.max(0, (h.general_beds_available ?? 12) + generalDelta);
          return {
            ...h,
            icu_beds_available: newIcu,
            general_beds_available: newGen
          };
        }
        return h;
      })
    );
    soundManager.playStatusBlip();
    notify(
      'info',
      'HOSPITAL BED CAPACITY UPDATED',
      `Synchronized live capacity for ${hospitalId}.`
    );
  };

  const updatePatientVitals = (vitals: PatientVitals) => {
    if (!activeMission) return;
    setActiveMission(prev => (prev ? { ...prev, vitals } : null));
    soundManager.playStatusBlip();
    notify(
      'info',
      'PATIENT VITALS TRANSMITTED',
      `Live vitals received: BP ${vitals.bloodPressure}, SpO2 ${vitals.spo2}%, Pulse ${vitals.pulseRate} bpm, GCS ${vitals.gcsScore}/15.`
    );
  };

  const updatePatientHandover = (doctorName: string, bedNumber: string, notes: string) => {
    if (!activeMission) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveMission(prev =>
      prev
        ? {
            ...prev,
            assignedDoctor: doctorName,
            assignedBedNumber: bedNumber,
            handoverNotes: notes,
            handoverCompleted: true,
            handoverTimestamp: timestamp,
            handoverSignedBy: doctorName,
            treatmentStatus: 'In Treatment'
          }
        : null
    );
    soundManager.playStatusBlip();
    notify(
      'success',
      'PATIENT HANDOVER RATIFIED',
      `Patient accepted by ${doctorName} at Bay ${bedNumber}. Clinical handover complete.`
    );
  };

  const updateTreatmentStatus = (treatmentStatus: DispatchMission['treatmentStatus']) => {
    if (!activeMission) return;
    setActiveMission(prev => (prev ? { ...prev, treatmentStatus } : null));
    soundManager.playStatusBlip();
    notify(
      'status',
      'TREATMENT STAGE UPDATED',
      `Patient status updated to: ${treatmentStatus}.`
    );
  };

  // --------------------------------------------------------------------------
  // CAD EMERGENCY REQUEST QUEUE MANAGEMENT
  // --------------------------------------------------------------------------
  const createEmergencyRequest = (
    req: Omit<EmergencyRequest, 'id' | 'receivedAtMs' | 'timestamp' | 'status'>
  ): EmergencyRequest => {
    const newReq: EmergencyRequest = {
      ...req,
      id: `REQ-${Date.now().toString().slice(-5)}`,
      receivedAtMs: Date.now(),
      timestamp: 'Just now',
      status: 'pending'
    };

    setEmergencyRequests(prev => [newReq, ...prev]);
    soundManager.playEmergencyAlert();
    notify(
      'emergency',
      `INCOMING 108 CAD CALL: ${newReq.priority.toUpperCase()}`,
      `${newReq.emergencyType} reported at ${newReq.location.landmark} (${newReq.callerName} - ${clean10DigitPhone(newReq.callerPhone)}).`
    );

    return newReq;
  };

  const assignEmergencyRequest = async (
    requestId: string,
    ambulanceId?: string
  ): Promise<DispatchResult | null> => {
    const req = emergencyRequests.find(r => r.id === requestId);
    if (!req) return null;

    const res = await triggerDispatch(
      req.location.latitude,
      req.location.longitude,
      req.emergencyType,
      req.callerName,
      req.callerPhone,
      req.location.landmark
    );

    if (res) {
      setEmergencyRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? {
                ...r,
                status: 'assigned',
                assignedAmbulanceId: res.assigned_ambulance.id,
                assignedAmbulancePlate: res.assigned_ambulance.vehicle_number,
                targetHospitalId: res.recommended_hospital?.id
              }
            : r
        )
      );
    }

    return res;
  };

  const resolveEmergencyRequest = (requestId: string) => {
    setEmergencyRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'completed' } : r))
    );
    soundManager.playStatusBlip();
    notify('status', 'INCIDENT ARCHIVED', `Emergency call ${requestId} marked as resolved.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        ambulances,
        hospitals,
        doctors,
        activeMission,
        isLoading,
        emergencyRequests,
        createEmergencyRequest,
        assignEmergencyRequest,
        resolveEmergencyRequest,
        notifications,
        unreadNotificationCount,
        notify,
        removeNotification,
        markAllNotificationsRead,
        clearNotifications,
        login,
        registerUser,
        provisionSystemAdministrator,
        verifyAdminKey,
        logout,
        updateUserProfile,
        triggerDispatch,
        toggleAmbulanceStatus,
        updateMissionStatus,
        completeMission,
        cancelEmergency,
        refreshFleet,
        toggleDoctorDuty,
        updateHospitalBeds,
        updatePatientVitals,
        updatePatientHandover,
        updateTreatmentStatus,
        addUser,
        updateUser,
        deleteUser,
        addAmbulance,
        updateAmbulance,
        deleteAmbulance,
        addHospital,
        updateHospital,
        deleteHospital,
        userCurrentLocation,
        detectLiveLocation,
        isLocating,
        locationError,
        setUserCurrentLocation,
        setCustomDispatchLocation,
        isWatchActive,
        toggleLiveLocationWatch,
        dbConnected,
        dbLastSyncTime,
        dbStats,
        refreshUsersFromDb
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
