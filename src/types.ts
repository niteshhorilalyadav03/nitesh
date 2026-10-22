export type UserRole =
  | 'Citizen'
  | 'Ambulance Operator'
  | 'Emergency Coordinator'
  | 'Healthcare Coordinator'
  | 'Platform Administrator'
  | 'Admin'
  | 'Dispatcher'
  | 'Driver'
  | 'Patient'
  | 'Ambulance Driver'
  | 'Hospital Administrator'
  | 'System Administrator';

export const PRIMARY_ROLES: UserRole[] = [
  'Citizen',
  'Ambulance Operator',
  'Emergency Coordinator',
  'Healthcare Coordinator',
  'Platform Administrator'
];

export const normalizeRole = (role?: string): UserRole => {
  if (!role) return 'Citizen';
  if (role === 'Admin' || role === 'System Administrator') return 'Platform Administrator';
  if (role === 'Dispatcher') return 'Emergency Coordinator';
  if (role === 'Driver' || role === 'Ambulance Driver') return 'Ambulance Operator';
  if (role === 'Patient') return 'Citizen';
  if (role === 'Hospital Administrator') return 'Healthcare Coordinator';
  return role as UserRole;
};

export const ROLE_DISPLAY_NAMES: Record<
  UserRole,
  { title: string; vivaAlias: string; category: string; description: string }
> = {
  'Citizen': {
    title: 'Citizen',
    vivaAlias: 'Patient',
    category: 'Public Distress',
    description: '1-tap SOS, ambulance request & live tracking, medical profile & history'
  },
  'Ambulance Operator': {
    title: 'Ambulance Operator',
    vivaAlias: 'Ambulance Driver',
    category: 'Fleet & Crew',
    description: 'Accept dispatches, GPS telemetry, patient vitals & hospital handover'
  },
  'Emergency Coordinator': {
    title: 'Emergency Coordinator',
    vivaAlias: 'Dispatcher',
    category: 'Control Room CAD',
    description: 'Monitor emergencies, CAD ambulance assignment, hospital routing & incident triage'
  },
  'Healthcare Coordinator': {
    title: 'Healthcare Coordinator',
    vivaAlias: 'Hospital Administrator',
    category: 'Emergency Department',
    description: 'ICU & bed availability, emergency doctors on-duty, incoming alerts & handover'
  },
  'Platform Administrator': {
    title: 'Platform Administrator',
    vivaAlias: 'System Administrator',
    category: 'System Governance',
    description: 'Manage users, ambulances, hospitals, analytics, audit logs & system config'
  },
  'Admin': {
    title: 'Platform Administrator',
    vivaAlias: 'System Administrator',
    category: 'System Governance',
    description: 'Manage users, ambulances, hospitals, analytics, audit logs & system config'
  },
  'Dispatcher': {
    title: 'Emergency Coordinator',
    vivaAlias: 'Dispatcher',
    category: 'Control Room CAD',
    description: 'Monitor emergencies, CAD ambulance assignment, hospital routing & incident triage'
  },
  'Driver': {
    title: 'Ambulance Operator',
    vivaAlias: 'Ambulance Driver',
    category: 'Fleet & Crew',
    description: 'Accept dispatches, GPS telemetry, patient vitals & hospital handover'
  },
  'Patient': {
    title: 'Citizen',
    vivaAlias: 'Patient',
    category: 'Public Distress',
    description: '1-tap SOS, ambulance request & live tracking, medical profile & history'
  },
  'Ambulance Driver': {
    title: 'Ambulance Operator',
    vivaAlias: 'Ambulance Driver',
    category: 'Fleet & Crew',
    description: 'Accept dispatches, GPS telemetry, patient vitals & hospital handover'
  },
  'Hospital Administrator': {
    title: 'Healthcare Coordinator',
    vivaAlias: 'Hospital Administrator',
    category: 'Emergency Department',
    description: 'ICU & bed availability, emergency doctors on-duty, incoming alerts & handover'
  },
  'System Administrator': {
    title: 'Platform Administrator',
    vivaAlias: 'System Administrator',
    category: 'System Governance',
    description: 'Manage users, ambulances, hospitals, analytics, audit logs & system config'
  }
};

export interface HospitalDoctor {
  id: string;
  name: string;
  specialty: string;
  onDuty: boolean;
  assignedBay?: string;
  phone: string;
  activePatients: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  password?: string;
  isActive?: boolean;
  avatar?: string;
  createdAt?: string;

  // Ambulance Operator specific fields
  assignedVehicleId?: string;
  assignedVehicleNumber?: string;
  licenseNumber?: string;
  baseStation?: string;
  shiftStatus?: 'on-duty' | 'off-duty';
  emtLevel?: 'Basic (BLS)' | 'Intermediate' | 'Advanced Life Support (ALS) Paramedic';

  // Citizen specific fields
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  medicalNotes?: string;
  defaultAddress?: string;

  // Platform Administrator specific fields
  clearanceLevel?: 'Super Admin' | 'Fleet Manager' | 'System Auditor';
  canManageFleet?: boolean;
  canManageUsers?: boolean;
  adminSecretKey?: string;
  createdByAdminId?: string;
  securityKeyLastVerified?: string;

  // Emergency Coordinator specific fields
  operatorCode?: string;
  terminalNumber?: string;
  radioChannel?: string;
  cadShift?: 'Morning (06:00 - 14:00)' | 'Evening (14:00 - 22:00)' | 'Night Watch (22:00 - 06:00)';
  cadStationSector?: string;

  // Healthcare Coordinator specific fields
  affiliatedHospitalId?: string;
  affiliatedHospitalName?: string;
  department?: string;
  emergencyContactExtension?: string;
  staffId?: string;
}

export interface AmbulanceLocation {
  latitude: number;
  longitude: number;
  landmark: string;
}

export interface Ambulance {
  id: string;
  vehicle_number: string;
  driver_name: string;
  contact: string;
  status: 'available' | 'busy';
  current_location: AmbulanceLocation;
  type: string;
  equipment: string[];
  base_station: string;
  fuel_level?: string;
  distance_km?: number;
  estimated_eta_minutes?: number;
  eta_minutes?: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  emergency_contact: string;
  icu_beds_available: number;
  total_icu_beds?: number;
  general_beds_available?: number;
  total_general_beds?: number;
  has_trauma_center: boolean;
  distance_km?: number;
  emergencyBaysTotal?: number;
  emergencyBaysOccupied?: number;
}

export interface PatientVitals {
  bloodPressure: string;
  pulseRate: number;
  spo2: number;
  temperature: string;
  gcsScore: number;
  recordedAt: string;
}

export interface DispatchMission {
  id: string;
  ambulanceId: string;
  ambulanceVehicleNumber: string;
  ambulanceType: string;
  driverName: string;
  driverContact: string;
  patientName: string;
  patientContact: string;
  emergencyType: string;
  emergencyLocation: {
    latitude: number;
    longitude: number;
    landmark?: string;
  };
  hospital: Hospital;
  distanceKm: number;
  etaMinutes: number;
  status: 'dispatched' | 'at-scene' | 'transporting' | 'completed';
  dispatchedAt: string;

  // Healthcare Coordination & Handover workflow extensions
  vitals?: PatientVitals;
  triagePriority?: 'Red (Immediate)' | 'Yellow (Urgent)' | 'Green (Delayed)';
  assignedDoctor?: string;
  assignedBedNumber?: string;
  treatmentStatus?: 'En Route' | 'Triage Arrived' | 'In Treatment' | 'Admitted ICU' | 'Stabilized' | 'Discharged';
  handoverNotes?: string;
  handoverCompleted?: boolean;
  handoverTimestamp?: string;
  handoverSignedBy?: string;
}

export interface DispatchResult {
  emergency_location: {
    latitude: number;
    longitude: number;
  };
  patient_name: string;
  emergency_type: string;
  assigned_ambulance: Ambulance;
  recommended_hospital: Hospital | null;
  other_available_units: Array<{
    id: string;
    vehicle_number: string;
    distance_km: number;
    eta_minutes: number;
  }>;
}

export interface LiveLocationState {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  landmark: string;
  sector?: string;
  isLiveGPS: boolean;
  isProjected?: boolean;
  rawLatitude?: number;
  rawLongitude?: number;
  speedKmh?: number | null;
  timestamp: number;
}

export interface EmergencyRequest {
  id: string;
  callerName: string;
  callerPhone: string;
  location: {
    latitude: number;
    longitude: number;
    landmark: string;
    sector?: string;
    accuracyMeters?: number;
    isLiveGPS?: boolean;
  };
  emergencyType: string;
  priority: 'Critical (P1)' | 'Urgent (P2)' | 'Standard (P3)';
  timestamp: string;
  receivedAtMs: number;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  assignedAmbulanceId?: string;
  assignedAmbulancePlate?: string;
  targetHospitalId?: string;
  notes?: string;
  vitalsReported?: string;
}

export type NotificationType = 'emergency' | 'status' | 'success' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  metadata?: {
    ambulanceId?: string;
    vehicleNumber?: string;
    missionId?: string;
    status?: string;
    etaMinutes?: number;
  };
}
