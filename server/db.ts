import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { UserProfile, UserRole } from '../src/types';

// Path for SQLite database and data directory
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'lifeline.sqlite');
const USERS_JSON_PATH = path.join(DATA_DIR, 'users.json');

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);

export interface EmergencyRecord {
  id: string;
  caller_name: string;
  caller_phone: string;
  emergency_type: string;
  priority: string;
  latitude: number;
  longitude: number;
  landmark: string;
  status: string; // 'pending' | 'assigned' | 'at-scene' | 'transporting' | 'completed' | 'cancelled'
  assigned_ambulance_id?: string | null;
  assigned_ambulance_plate?: string | null;
  driver_name?: string | null;
  driver_contact?: string | null;
  target_hospital_id?: string | null;
  target_hospital_name?: string | null;
  eta_minutes?: number | null;
  distance_km?: number | null;
  vitals_json?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Create tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      phone TEXT NOT NULL,
      password TEXT,
      is_active INTEGER DEFAULT 1,
      avatar TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      assigned_vehicle_id TEXT,
      assigned_vehicle_number TEXT,
      license_number TEXT,
      base_station TEXT,
      shift_status TEXT,
      emt_level TEXT,
      blood_type TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      allergies TEXT,
      medical_notes TEXT,
      default_address TEXT,
      clearance_level TEXT,
      can_manage_fleet INTEGER DEFAULT 0,
      can_manage_users INTEGER DEFAULT 0,
      admin_secret_key TEXT,
      operator_code TEXT,
      terminal_number TEXT,
      radio_channel TEXT,
      cad_shift TEXT,
      cad_station_sector TEXT,
      affiliated_hospital_id TEXT,
      affiliated_hospital_name TEXT,
      department TEXT,
      emergency_contact_extension TEXT,
      staff_id TEXT,
      extra_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS emergencies (
      id TEXT PRIMARY KEY,
      caller_name TEXT NOT NULL,
      caller_phone TEXT NOT NULL,
      emergency_type TEXT NOT NULL,
      priority TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      landmark TEXT,
      status TEXT NOT NULL,
      assigned_ambulance_id TEXT,
      assigned_ambulance_plate TEXT,
      driver_name TEXT,
      driver_contact TEXT,
      target_hospital_id TEXT,
      target_hospital_name TEXT,
      eta_minutes INTEGER,
      distance_km REAL,
      vitals_json TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);
    CREATE INDEX IF NOT EXISTS idx_emergencies_created ON emergencies(created_at);

    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_name TEXT,
      target_user_id TEXT,
      details TEXT
    );
  `);

  // Seed default users if fewer than 10
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (countRow.count < 10) {
    seedInitialUsers();
  } else {
    syncUsersJsonFromDb();
  }

  // Seed default emergencies if fewer than 15
  const emergencyCount = db.prepare('SELECT COUNT(*) as count FROM emergencies').get() as { count: number };
  if (emergencyCount.count < 15) {
    seedInitialEmergencies();
  }
}

// Comprehensive dataset of 26 realistic users across Mira Road (Pincode 401107)
export const SEED_USERS: UserProfile[] = [
  // --------------------------------------------------------------------------
  // 1. CITIZENS (7 Users)
  // --------------------------------------------------------------------------
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
    medicalNotes: 'Mild asthma, carries inhaler. Hypertension treated with Amlodipine 5mg.',
    defaultAddress: 'Flat 402, Shanti Park Sector 5, Mira Road East',
    createdAt: '2025-02-12',
    isActive: true
  },
  {
    id: 'USR-CIT-02',
    name: 'Rahul Patil',
    email: 'rahul.patil@gmail.com',
    role: 'Citizen',
    phone: '9820556789',
    bloodType: 'B Positive (B+)',
    emergencyContactName: 'Sunita Patil (Mother)',
    emergencyContactPhone: '9820556780',
    allergies: 'None recorded',
    medicalNotes: 'Type 2 Diabetes Mellitus, monitored via continuous glucose sensor.',
    defaultAddress: 'B-301, Kanakia Beverly Park, Mira Road East',
    createdAt: '2025-02-14',
    isActive: true
  },
  {
    id: 'USR-CIT-03',
    name: 'Sunita Deshmukh',
    email: 'sunita.deshmukh@yahoo.com',
    role: 'Citizen',
    phone: '9819443210',
    bloodType: 'A Positive (A+)',
    emergencyContactName: 'Anil Deshmukh (Son)',
    emergencyContactPhone: '9819443219',
    allergies: 'Aspirin, NSAIDs',
    medicalNotes: 'Coronary artery disease, drug-eluting stent placed in 2023. Carries Sorbitrate.',
    defaultAddress: 'Row House 12, Srishti Sector 1, Mira Road East',
    createdAt: '2025-02-15',
    isActive: true
  },
  {
    id: 'USR-CIT-04',
    name: 'Amit Verma',
    email: 'amit.verma@outlook.com',
    role: 'Citizen',
    phone: '9867112233',
    bloodType: 'AB Positive (AB+)',
    emergencyContactName: 'Pooja Verma (Wife)',
    emergencyContactPhone: '9867112230',
    allergies: 'Peanuts, Shellfish, Contrast dye',
    medicalNotes: 'Severe anaphylactic allergies, carries portable auto-injector EpiPen.',
    defaultAddress: 'Flat 604, Poonam Sagar Complex, Mira Road East',
    createdAt: '2025-02-16',
    isActive: true
  },
  {
    id: 'USR-CIT-05',
    name: 'Farida Merchant',
    email: 'farida.merchant@gmail.com',
    role: 'Citizen',
    phone: '9821889900',
    bloodType: 'O Negative (O-)',
    emergencyContactName: 'Zubair Merchant (Brother)',
    emergencyContactPhone: '9821889901',
    allergies: 'Dust mites, Pollen, Ibuprofen',
    medicalNotes: 'Universal red cell donor. Chronic bronchial asthma treated with Budesonide.',
    defaultAddress: 'A-102, Silver Park Sector 3, Mira Road East',
    createdAt: '2025-02-18',
    isActive: true
  },
  {
    id: 'USR-CIT-06',
    name: 'Vikram Rane',
    email: 'vikram.rane@rediffmail.com',
    role: 'Citizen',
    phone: '9870334455',
    bloodType: 'A Negative (A-)',
    emergencyContactName: 'Kavita Rane (Spouse)',
    emergencyContactPhone: '9870334450',
    allergies: 'Ciprofloxacin',
    medicalNotes: 'Stage 2 renal insufficiency. Nephrology care team: Apex Multispeciality.',
    defaultAddress: 'Flat 204, Sheetal Nagar, Mira Road East',
    createdAt: '2025-02-19',
    isActive: true
  },
  {
    id: 'USR-CIT-07',
    name: 'Priya Kulkarni',
    email: 'priya.kulkarni@gmail.com',
    role: 'Citizen',
    phone: '9820998811',
    bloodType: 'B Negative (B-)',
    emergencyContactName: 'Aditya Kulkarni (Husband)',
    emergencyContactPhone: '9820998810',
    allergies: 'Amoxicillin, Latex',
    medicalNotes: 'High-risk maternity profile (28 weeks gestation). Assigned to Bhaktivedanta OB/GYN.',
    defaultAddress: 'C-501, Jangid Enclave, Mira Bhayandar Road',
    createdAt: '2025-02-20',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // 2. AMBULANCE OPERATORS / DRIVERS (6 Users)
  // --------------------------------------------------------------------------
  {
    id: 'USR-OPR-01',
    name: 'Ramesh Pawar',
    email: 'operator.ramesh@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820112345',
    assignedVehicleId: 'AMB-001',
    assignedVehicleNumber: 'MH-04-AZ-1024',
    licenseNumber: 'MH-04-2018-009841',
    baseStation: 'Mira Road Railway Station Hub',
    shiftStatus: 'on-duty',
    emtLevel: 'Advanced Life Support (ALS) Paramedic',
    createdAt: '2025-02-01',
    isActive: true
  },
  {
    id: 'USR-OPR-02',
    name: 'Sunil Jadhav',
    email: 'sunil.jadhav@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820123456',
    assignedVehicleId: 'AMB-002',
    assignedVehicleNumber: 'MH-04-AZ-2048',
    licenseNumber: 'MH-04-2019-014522',
    baseStation: 'Kanakia Police Station Post',
    shiftStatus: 'on-duty',
    emtLevel: 'Advanced Life Support (ALS) Paramedic',
    createdAt: '2025-02-03',
    isActive: true
  },
  {
    id: 'USR-OPR-03',
    name: 'Ganesh Shinde',
    email: 'ganesh.shinde@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820134567',
    assignedVehicleId: 'AMB-003',
    assignedVehicleNumber: 'MH-04-BX-3310',
    licenseNumber: 'MH-04-2020-023194',
    baseStation: 'Western Express Highway Junction',
    shiftStatus: 'on-duty',
    emtLevel: 'Basic (BLS)',
    createdAt: '2025-02-05',
    isActive: true
  },
  {
    id: 'USR-OPR-04',
    name: 'Imran Khan',
    email: 'imran.khan@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820145678',
    assignedVehicleId: 'AMB-004',
    assignedVehicleNumber: 'MH-04-CY-4501',
    licenseNumber: 'MH-04-2017-005612',
    baseStation: 'Srishti Sector 1 Stand',
    shiftStatus: 'on-duty',
    emtLevel: 'Advanced Life Support (ALS) Paramedic',
    createdAt: '2025-02-07',
    isActive: true
  },
  {
    id: 'USR-OPR-05',
    name: 'Mahendra Solanki',
    email: 'mahendra.solanki@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820156789',
    assignedVehicleId: 'AMB-005',
    assignedVehicleNumber: 'MH-04-DZ-5612',
    licenseNumber: 'MH-04-2021-031890',
    baseStation: 'Silver Park Circle Post',
    shiftStatus: 'off-duty',
    emtLevel: 'Basic (BLS)',
    createdAt: '2025-02-08',
    isActive: true
  },
  {
    id: 'USR-OPR-06',
    name: 'Deepak More',
    email: 'deepak.more@lifeline-ems.gov.in',
    role: 'Ambulance Operator',
    phone: '9820167890',
    assignedVehicleId: 'AMB-006',
    assignedVehicleNumber: 'MH-04-EF-6723',
    licenseNumber: 'MH-04-2016-004311',
    baseStation: 'Golden Nest Station Post',
    shiftStatus: 'on-duty',
    emtLevel: 'Advanced Life Support (ALS) Paramedic',
    createdAt: '2025-02-09',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // 3. HEALTHCARE COORDINATORS / EMERGENCY PHYSICIANS (5 Users)
  // --------------------------------------------------------------------------
  {
    id: 'USR-HLT-01',
    name: 'Dr. Ananya Roy, MD',
    email: 'health.ananya@bhaktivedanta-hospital.org',
    role: 'Healthcare Coordinator',
    phone: '9820199887',
    affiliatedHospitalId: 'HOSP-001',
    affiliatedHospitalName: 'Bhaktivedanta Hospital & Research Institute',
    department: 'Emergency Medicine & Trauma ICU',
    emergencyContactExtension: 'EXT-108',
    staffId: 'BH-TRM-101',
    createdAt: '2025-01-20',
    isActive: true
  },
  {
    id: 'USR-HLT-02',
    name: 'Dr. Sanjay Kulkarni, MS',
    email: 'dr.kulkarni@apex-hospital.in',
    role: 'Healthcare Coordinator',
    phone: '9820201122',
    affiliatedHospitalId: 'HOSP-002',
    affiliatedHospitalName: 'Apex Multispeciality Hospital',
    department: 'Critical Care & Orthopedic Trauma',
    emergencyContactExtension: 'EXT-201',
    staffId: 'APX-CC-204',
    createdAt: '2025-01-22',
    isActive: true
  },
  {
    id: 'USR-HLT-03',
    name: 'Dr. Farhan Ansari, MD',
    email: 'dr.ansari@wockhardt-hospitals.com',
    role: 'Healthcare Coordinator',
    phone: '9820212233',
    affiliatedHospitalId: 'HOSP-003',
    affiliatedHospitalName: 'Wockhardt Hospital Emergency Wing',
    department: 'Interventional Cardiology & CCU',
    emergencyContactExtension: 'EXT-305',
    staffId: 'WCK-CARD-09',
    createdAt: '2025-01-24',
    isActive: true
  },
  {
    id: 'USR-HLT-04',
    name: 'Dr. Neha Singhania, DNB',
    email: 'dr.singhania@thunga-hospital.org',
    role: 'Healthcare Coordinator',
    phone: '9820223344',
    affiliatedHospitalId: 'HOSP-004',
    affiliatedHospitalName: 'Thunga Hospital Emergency Unit',
    department: 'Neuro Trauma & Acute Stroke Care',
    emergencyContactExtension: 'EXT-402',
    staffId: 'TNG-NEURO-14',
    createdAt: '2025-01-25',
    isActive: true
  },
  {
    id: 'USR-HLT-05',
    name: 'Dr. Robert D\'Souza, MS',
    email: 'dr.robert@karuna-hospital.in',
    role: 'Healthcare Coordinator',
    phone: '9820234455',
    affiliatedHospitalId: 'HOSP-005',
    affiliatedHospitalName: 'Karuna Hospital Trauma Center',
    department: 'Pediatric Resuscitation & Burns Unit',
    emergencyContactExtension: 'EXT-510',
    staffId: 'KRN-RES-33',
    createdAt: '2025-01-28',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // 4. EMERGENCY COORDINATORS / CAD DISPATCHERS (5 Users)
  // --------------------------------------------------------------------------
  {
    id: 'USR-CRD-01',
    name: 'Officer Jason Fernandes',
    email: 'coordinator.jason@lifeline-ems.gov.in',
    role: 'Emergency Coordinator',
    phone: '9820133445',
    operatorCode: 'EOC-7704',
    terminalNumber: 'TERMINAL-04',
    radioChannel: 'EMS-FREQ-154.25 MHz',
    cadShift: 'Morning (06:00 - 14:00)',
    cadStationSector: 'Mira Road East EOC Sector 1',
    createdAt: '2025-01-15',
    isActive: true
  },
  {
    id: 'USR-CRD-02',
    name: 'Pradeep Gaikwad',
    email: 'pradeep.gaikwad@lifeline-ems.gov.in',
    role: 'Emergency Coordinator',
    phone: '9820245566',
    operatorCode: 'EOC-7701',
    terminalNumber: 'TERMINAL-01',
    radioChannel: 'EMS-FREQ-154.25 MHz',
    cadShift: 'Morning (06:00 - 14:00)',
    cadStationSector: 'Western Express Highway CAD Sector',
    createdAt: '2025-01-18',
    isActive: true
  },
  {
    id: 'USR-CRD-03',
    name: 'Kavita Joshi',
    email: 'kavita.joshi@lifeline-ems.gov.in',
    role: 'Emergency Coordinator',
    phone: '9820256677',
    operatorCode: 'EOC-7702',
    terminalNumber: 'TERMINAL-02',
    radioChannel: 'EMS-FREQ-155.15 MHz',
    cadShift: 'Evening (14:00 - 22:00)',
    cadStationSector: 'Mira Bhayandar Central Sector',
    createdAt: '2025-01-20',
    isActive: true
  },
  {
    id: 'USR-CRD-04',
    name: 'Anand Tiwari',
    email: 'anand.tiwari@lifeline-ems.gov.in',
    role: 'Emergency Coordinator',
    phone: '9820267788',
    operatorCode: 'EOC-7703',
    terminalNumber: 'TERMINAL-03',
    radioChannel: 'EMS-FREQ-154.85 MHz',
    cadShift: 'Evening (14:00 - 22:00)',
    cadStationSector: 'Srishti-Kanakia Sector CAD',
    createdAt: '2025-01-22',
    isActive: true
  },
  {
    id: 'USR-CRD-05',
    name: 'Rehana Shaikh',
    email: 'rehana.shaikh@lifeline-ems.gov.in',
    role: 'Emergency Coordinator',
    phone: '9820278899',
    operatorCode: 'EOC-7705',
    terminalNumber: 'TERMINAL-05',
    radioChannel: 'EMS-FREQ-156.05 MHz',
    cadShift: 'Night Watch (22:00 - 06:00)',
    cadStationSector: 'Overnight Emergency CAD Desk',
    createdAt: '2025-01-25',
    isActive: true
  },

  // --------------------------------------------------------------------------
  // 5. PLATFORM ADMINISTRATORS (3 Users)
  // --------------------------------------------------------------------------
  {
    id: 'USR-ADM-01',
    name: 'Sarah Jenkins',
    email: 'admin.sarah@lifeline-ems.gov.in',
    role: 'Platform Administrator',
    phone: '9820011223',
    password: 'emergency108',
    clearanceLevel: 'Super Admin',
    canManageFleet: true,
    canManageUsers: true,
    adminSecretKey: 'EMS-ROOT-2025',
    createdAt: '2025-01-10',
    isActive: true
  },
  {
    id: 'USR-ADM-02',
    name: 'Col. Vikram Rathore (Retd.)',
    email: 'col.rathore@lifeline-ems.gov.in',
    role: 'Platform Administrator',
    phone: '9820022334',
    password: 'emergency108',
    clearanceLevel: 'Fleet Manager',
    canManageFleet: true,
    canManageUsers: false,
    adminSecretKey: 'EMS-ROOT-2025',
    createdAt: '2025-01-12',
    isActive: true
  },
  {
    id: 'USR-ADM-03',
    name: 'Devendra Mehta',
    email: 'devendra.mehta@lifeline-ems.gov.in',
    role: 'Platform Administrator',
    phone: '9820033445',
    password: 'emergency108',
    clearanceLevel: 'System Auditor',
    canManageFleet: true,
    canManageUsers: true,
    adminSecretKey: 'EMS-ROOT-2025',
    createdAt: '2025-01-14',
    isActive: true
  }
];

function seedInitialUsers() {
  for (const user of SEED_USERS) {
    const existing = db.prepare('SELECT id FROM users WHERE id = ? OR email = ?').get(user.id, user.email);
    if (!existing) {
      insertUserInDb(user);
    }
  }
  syncUsersJsonFromDb();
}

function seedInitialEmergencies() {
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  const seedEmergencies: EmergencyRecord[] = [
    {
      id: 'EMG-8815',
      caller_name: 'Sunita Deshmukh',
      caller_phone: '9819443210',
      emergency_type: 'Suspected Cardiac Arrhythmia & Chest Tightness',
      priority: 'Critical (P1)',
      latitude: 19.2905,
      longitude: 72.8628,
      landmark: 'Srishti Complex, Sector 1',
      status: 'dispatched',
      assigned_ambulance_id: 'AMB-001',
      assigned_ambulance_plate: 'MH-04-AZ-1024',
      driver_name: 'Ramesh Pawar',
      driver_contact: '9820112345',
      target_hospital_id: 'HOSP-001',
      target_hospital_name: 'Bhaktivedanta Hospital & Research Institute',
      eta_minutes: 3,
      distance_km: 1.2,
      vitals_json: JSON.stringify({ bloodPressure: '145/95', pulseRate: 110, spo2: 95, gcsScore: 15 }),
      notes: 'Prior cardiac stent. Sublingual Sorbitrate taken. ALS siren en route.',
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'EMG-8812',
      caller_name: 'Rahul Patil',
      caller_phone: '9820556789',
      emergency_type: 'Acute Diabetic Hypoglycemia & Fainting',
      priority: 'Urgent (P2)',
      latitude: 19.2867,
      longitude: 72.8715,
      landmark: 'Kanakia Beverly Park, Sector 3',
      status: 'assigned',
      assigned_ambulance_id: 'AMB-002',
      assigned_ambulance_plate: 'MH-04-AZ-2048',
      driver_name: 'Sunil Jadhav',
      driver_contact: '9820123456',
      target_hospital_id: 'HOSP-002',
      target_hospital_name: 'Apex Multispeciality Hospital',
      eta_minutes: 4,
      distance_km: 1.6,
      vitals_json: JSON.stringify({ bloodPressure: '110/70', pulseRate: 92, spo2: 97, gcsScore: 14 }),
      notes: 'Patient conscious but disoriented. Paramedic administering oral glucose gel.',
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'EMG-8809',
      caller_name: 'Amit Verma',
      caller_phone: '9867112233',
      emergency_type: 'Severe Anaphylactic Shock / Peanut Exposure',
      priority: 'Critical (P1)',
      latitude: 19.2942,
      longitude: 72.8635,
      landmark: 'Silver Park, Poonam Sagar Complex',
      status: 'completed',
      assigned_ambulance_id: 'AMB-004',
      assigned_ambulance_plate: 'MH-04-CY-4501',
      driver_name: 'Imran Khan',
      driver_contact: '9820145678',
      target_hospital_id: 'HOSP-001',
      target_hospital_name: 'Bhaktivedanta Hospital & Research Institute',
      eta_minutes: 2,
      distance_km: 1.1,
      vitals_json: JSON.stringify({ bloodPressure: '90/60', pulseRate: 125, spo2: 91, gcsScore: 13 }),
      notes: 'Intramuscular Epinephrine 0.3mg auto-injected in transit. Patient stabilized in Resuscitation Bay 1.',
      created_at: new Date(Date.now() - 3 * ONE_HOUR).toISOString(),
      updated_at: new Date(Date.now() - 2 * ONE_HOUR).toISOString()
    },
    {
      id: 'EMG-8804',
      caller_name: 'Farida Merchant',
      caller_phone: '9821889900',
      emergency_type: 'Acute Bronchospasm & Respiratory Exhaustion',
      priority: 'Urgent (P2)',
      latitude: 19.2915,
      longitude: 72.8665,
      landmark: 'Jangid Complex, Silver Park Road',
      status: 'completed',
      assigned_ambulance_id: 'AMB-003',
      assigned_ambulance_plate: 'MH-04-BX-3310',
      driver_name: 'Ganesh Shinde',
      driver_contact: '9820134567',
      target_hospital_id: 'HOSP-003',
      target_hospital_name: 'Wockhardt Hospital Emergency Wing',
      eta_minutes: 5,
      distance_km: 2.2,
      vitals_json: JSON.stringify({ bloodPressure: '135/88', pulseRate: 104, spo2: 94, gcsScore: 15 }),
      notes: 'Duolin nebulization with 6L oxygen delivery via non-rebreather mask. Air entry improved.',
      created_at: new Date(Date.now() - 7 * ONE_HOUR).toISOString(),
      updated_at: new Date(Date.now() - 6 * ONE_HOUR).toISOString()
    },
    {
      id: 'EMG-8798',
      caller_name: 'Vikram Rane',
      caller_phone: '9870334455',
      emergency_type: 'Severe Nephrolithiasis & Acute Flank Pain',
      priority: 'Urgent (P2)',
      latitude: 19.2835,
      longitude: 72.8600,
      landmark: 'Sheetal Nagar, Near MTNL Exchange',
      status: 'completed',
      assigned_ambulance_id: 'AMB-005',
      assigned_ambulance_plate: 'MH-04-DZ-5612',
      driver_name: 'Mahendra Solanki',
      driver_contact: '9820156789',
      target_hospital_id: 'HOSP-002',
      target_hospital_name: 'Apex Multispeciality Hospital',
      eta_minutes: 4,
      distance_km: 1.7,
      vitals_json: JSON.stringify({ bloodPressure: '150/90', pulseRate: 98, spo2: 98, gcsScore: 15 }),
      notes: 'Intravenous analgesia given under medical direction. Handover to Uro-Trauma team complete.',
      created_at: new Date(Date.now() - 1 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 1 * ONE_DAY + 45 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8791',
      caller_name: 'Priya Kulkarni',
      caller_phone: '9820998811',
      emergency_type: 'Preterm Labor Contractions & Ruptured Membranes',
      priority: 'Critical (P1)',
      latitude: 19.2915,
      longitude: 72.8665,
      landmark: 'Jangid Complex, Silver Park Road',
      status: 'completed',
      assigned_ambulance_id: 'AMB-001',
      assigned_ambulance_plate: 'MH-04-AZ-1024',
      driver_name: 'Ramesh Pawar',
      driver_contact: '9820112345',
      target_hospital_id: 'HOSP-001',
      target_hospital_name: 'Bhaktivedanta Hospital & Research Institute',
      eta_minutes: 3,
      distance_km: 1.4,
      vitals_json: JSON.stringify({ bloodPressure: '128/82', pulseRate: 90, spo2: 99, gcsScore: 15 }),
      notes: 'Fetal heart tones monitored via Doppler. Direct admission to Labor & Delivery Unit.',
      created_at: new Date(Date.now() - 1 * ONE_DAY - 6 * ONE_HOUR).toISOString(),
      updated_at: new Date(Date.now() - 1 * ONE_DAY - 5 * ONE_HOUR).toISOString()
    },
    {
      id: 'EMG-8785',
      caller_name: 'Rajeshwar Tiwari',
      caller_phone: '9820771122',
      emergency_type: 'Multi-Vehicle Highway Collision & Lower Extremity Trauma',
      priority: 'Critical (P1)',
      latitude: 19.2718,
      longitude: 72.8752,
      landmark: 'Western Express Highway Junction, Kashimira',
      status: 'completed',
      assigned_ambulance_id: 'AMB-002',
      assigned_ambulance_plate: 'MH-04-AZ-2048',
      driver_name: 'Sunil Jadhav',
      driver_contact: '9820123456',
      target_hospital_id: 'HOSP-005',
      target_hospital_name: 'Karuna Hospital Trauma Center',
      eta_minutes: 6,
      distance_km: 2.8,
      vitals_json: JSON.stringify({ bloodPressure: '105/65', pulseRate: 115, spo2: 96, gcsScore: 14 }),
      notes: 'Hare traction splint applied to right femur. High-flow oxygen. Trauma surgery alerted.',
      created_at: new Date(Date.now() - 2 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 2 * ONE_DAY + 50 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8774',
      caller_name: 'Meera Sharma',
      caller_phone: '9892088776',
      emergency_type: 'Malignant Hypertensive Urgency (BP 210/125)',
      priority: 'Critical (P1)',
      latitude: 19.2890,
      longitude: 72.8610,
      landmark: 'Shanti Park, Sector 5 (Near Jain Temple)',
      status: 'completed',
      assigned_ambulance_id: 'AMB-001',
      assigned_ambulance_plate: 'MH-04-AZ-1024',
      driver_name: 'Ramesh Pawar',
      driver_contact: '9820112345',
      target_hospital_id: 'HOSP-001',
      target_hospital_name: 'Bhaktivedanta Hospital & Research Institute',
      eta_minutes: 3,
      distance_km: 1.2,
      vitals_json: JSON.stringify({ bloodPressure: '210/125', pulseRate: 88, spo2: 97, gcsScore: 15 }),
      notes: 'Severe occipital throbbing. IV Labetalol titrated in trauma bay under Dr. Ananya Roy.',
      created_at: new Date(Date.now() - 3 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 3 * ONE_DAY + 35 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8762',
      caller_name: 'Harish Mehta',
      caller_phone: '9820883344',
      emergency_type: 'Kitchen Deep Scald Thermal Burns (Grade 2)',
      priority: 'Urgent (P2)',
      latitude: 19.2985,
      longitude: 72.8532,
      landmark: 'Golden Nest Circle, Bhayander-Mira Link Rd',
      status: 'completed',
      assigned_ambulance_id: 'AMB-006',
      assigned_ambulance_plate: 'MH-04-EF-6723',
      driver_name: 'Deepak More',
      driver_contact: '9820167890',
      target_hospital_id: 'HOSP-004',
      target_hospital_name: 'Thunga Hospital Emergency Unit',
      eta_minutes: 5,
      distance_km: 2.3,
      vitals_json: JSON.stringify({ bloodPressure: '130/85', pulseRate: 94, spo2: 98, gcsScore: 15 }),
      notes: 'Sterile saline dressing applied. Analgesic protocol initiated. Handover to Plastic Surgery Bay.',
      created_at: new Date(Date.now() - 4 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 4 * ONE_DAY + 40 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8750',
      caller_name: 'Seema Agarwal',
      caller_phone: '9820119933',
      emergency_type: 'Vasovagal Syncope on Railway Foot Overbridge',
      priority: 'Standard (P3)',
      latitude: 19.2815,
      longitude: 72.8558,
      landmark: 'Mira Road Railway Station (East Plaza)',
      status: 'completed',
      assigned_ambulance_id: 'AMB-001',
      assigned_ambulance_plate: 'MH-04-AZ-1024',
      driver_name: 'Ramesh Pawar',
      driver_contact: '9820112345',
      target_hospital_id: 'HOSP-001',
      target_hospital_name: 'Bhaktivedanta Hospital & Research Institute',
      eta_minutes: 2,
      distance_km: 0.6,
      vitals_json: JSON.stringify({ bloodPressure: '100/68', pulseRate: 64, spo2: 99, gcsScore: 15 }),
      notes: 'Patient regained full consciousness after leg elevation. ECG normal sinus rhythm.',
      created_at: new Date(Date.now() - 5 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 5 * ONE_DAY + 30 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8742',
      caller_name: 'Arvind Joshi',
      caller_phone: '9820664411',
      emergency_type: 'Acute Stroke Alert / Left Hemiparesis (FAST Positive)',
      priority: 'Critical (P1)',
      latitude: 19.2930,
      longitude: 72.8710,
      landmark: 'Beverly Park, Near GCC International Club',
      status: 'completed',
      assigned_ambulance_id: 'AMB-003',
      assigned_ambulance_plate: 'MH-04-BX-3310',
      driver_name: 'Ganesh Shinde',
      driver_contact: '9820134567',
      target_hospital_id: 'HOSP-003',
      target_hospital_name: 'Wockhardt Hospital Emergency Wing',
      eta_minutes: 4,
      distance_km: 1.9,
      vitals_json: JSON.stringify({ bloodPressure: '168/102', pulseRate: 86, spo2: 96, gcsScore: 13 }),
      notes: 'Stroke code activated in transit. CT Brain angiography ready upon arrival. Symptom onset 35m.',
      created_at: new Date(Date.now() - 6 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 6 * ONE_DAY + 42 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8735',
      caller_name: 'Pooja Nair',
      caller_phone: '9820577881',
      emergency_type: 'Elderly Domestic Fall with Femoral Neck Fracture',
      priority: 'Urgent (P2)',
      latitude: 19.2890,
      longitude: 72.8610,
      landmark: 'Shanti Park, Sector 5 (Near Jain Temple)',
      status: 'completed',
      assigned_ambulance_id: 'AMB-002',
      assigned_ambulance_plate: 'MH-04-AZ-2048',
      driver_name: 'Sunil Jadhav',
      driver_contact: '9820123456',
      target_hospital_id: 'HOSP-002',
      target_hospital_name: 'Apex Multispeciality Hospital',
      eta_minutes: 3,
      distance_km: 1.3,
      vitals_json: JSON.stringify({ bloodPressure: '138/84', pulseRate: 90, spo2: 98, gcsScore: 15 }),
      notes: 'Immobilized on scoop stretcher. Handover to Ortho trauma ICU Dr. Sanjay Kulkarni.',
      created_at: new Date(Date.now() - 7 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 7 * ONE_DAY + 35 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8720',
      caller_name: 'Nilesh Gupta',
      caller_phone: '9820448822',
      emergency_type: 'False Alarm / Patient Self-Stabilized Prior to Unit Arrival',
      priority: 'Standard (P3)',
      latitude: 19.2912,
      longitude: 72.8632,
      landmark: 'Srishti Complex, Near Bhaktivedanta Hospital',
      status: 'cancelled',
      assigned_ambulance_id: 'AMB-004',
      assigned_ambulance_plate: 'MH-04-CY-4501',
      driver_name: 'Imran Khan',
      driver_contact: '9820145678',
      target_hospital_id: 'HOSP-001',
      target_hospital_name: 'Bhaktivedanta Hospital & Research Institute',
      eta_minutes: 1,
      distance_km: 0.5,
      vitals_json: null,
      notes: 'Caller phoned CAD dispatch stating palpitations subsided spontaneously. Stand down ratified.',
      created_at: new Date(Date.now() - 8 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 8 * ONE_DAY + 10 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8710',
      caller_name: 'Zoya Sheikh',
      caller_phone: '9820337711',
      emergency_type: 'Acute Gastroenteritis & Hypovolemic Dehydration',
      priority: 'Urgent (P2)',
      latitude: 19.2942,
      longitude: 72.8635,
      landmark: 'Silver Park, Poonam Sagar Complex',
      status: 'completed',
      assigned_ambulance_id: 'AMB-005',
      assigned_ambulance_plate: 'MH-04-DZ-5612',
      driver_name: 'Mahendra Solanki',
      driver_contact: '9820156789',
      target_hospital_id: 'HOSP-005',
      target_hospital_name: 'Karuna Hospital Trauma Center',
      eta_minutes: 4,
      distance_km: 1.8,
      vitals_json: JSON.stringify({ bloodPressure: '95/62', pulseRate: 110, spo2: 99, gcsScore: 15 }),
      notes: 'IV Normal Saline 500mL infused. Handover to internal medicine emergency wing.',
      created_at: new Date(Date.now() - 10 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 10 * ONE_DAY + 45 * 60 * 1000).toISOString()
    },
    {
      id: 'EMG-8695',
      caller_name: 'Ashok Chougule',
      caller_phone: '9820225544',
      emergency_type: 'Industrial Machine Hand Crush & Hemorrhage Control',
      priority: 'Critical (P1)',
      latitude: 19.2785,
      longitude: 72.8680,
      landmark: 'Hatkesh Udyog Nagar, Kashimira Road',
      status: 'completed',
      assigned_ambulance_id: 'AMB-003',
      assigned_ambulance_plate: 'MH-04-BX-3310',
      driver_name: 'Ganesh Shinde',
      driver_contact: '9820134567',
      target_hospital_id: 'HOSP-002',
      target_hospital_name: 'Apex Multispeciality Hospital',
      eta_minutes: 4,
      distance_km: 1.9,
      vitals_json: JSON.stringify({ bloodPressure: '115/75', pulseRate: 108, spo2: 97, gcsScore: 15 }),
      notes: 'Arterial tourniquet placed. Direct transfer to Emergency Plastic Micro-vascular OT.',
      created_at: new Date(Date.now() - 12 * ONE_DAY).toISOString(),
      updated_at: new Date(Date.now() - 12 * ONE_DAY + 38 * 60 * 1000).toISOString()
    }
  ];

  for (const emg of seedEmergencies) {
    const existing = db.prepare('SELECT id FROM emergencies WHERE id = ?').get(emg.id);
    if (!existing) {
      insertEmergencyInDb(emg);
    }
  }
}

function rowToUserProfile(row: any): UserProfile {
  if (!row) return null as any;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    phone: row.phone,
    password: row.password || undefined,
    isActive: row.is_active === 1,
    avatar: row.avatar || undefined,
    createdAt: row.created_at,
    assignedVehicleId: row.assigned_vehicle_id || undefined,
    assignedVehicleNumber: row.assigned_vehicle_number || undefined,
    licenseNumber: row.license_number || undefined,
    baseStation: row.base_station || undefined,
    shiftStatus: row.shift_status || undefined,
    emtLevel: row.emt_level || undefined,
    bloodType: row.blood_type || undefined,
    emergencyContactName: row.emergency_contact_name || undefined,
    emergencyContactPhone: row.emergency_contact_phone || undefined,
    allergies: row.allergies || undefined,
    medicalNotes: row.medical_notes || undefined,
    defaultAddress: row.default_address || undefined,
    clearanceLevel: row.clearance_level || undefined,
    canManageFleet: row.can_manage_fleet === 1,
    canManageUsers: row.can_manage_users === 1,
    adminSecretKey: row.admin_secret_key || undefined,
    operatorCode: row.operator_code || undefined,
    terminalNumber: row.terminal_number || undefined,
    radioChannel: row.radio_channel || undefined,
    cadShift: row.cad_shift || undefined,
    cadStationSector: row.cad_station_sector || undefined,
    affiliatedHospitalId: row.affiliated_hospital_id || undefined,
    affiliatedHospitalName: row.affiliated_hospital_name || undefined,
    department: row.department || undefined,
    emergencyContactExtension: row.emergency_contact_extension || undefined,
    staffId: row.staff_id || undefined
  };
}

export function getAllUsersFromDb(): UserProfile[] {
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC, id DESC');
  const rows = stmt.all() as any[];
  return rows.map(rowToUserProfile);
}

export function getUserByIdFromDb(id: string): UserProfile | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id) as any;
  return row ? rowToUserProfile(row) : null;
}

export function getUserByEmailFromDb(email: string): UserProfile | null {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
  const row = stmt.get(email) as any;
  return row ? rowToUserProfile(row) : null;
}

export function insertUserInDb(user: UserProfile): UserProfile {
  const now = new Date().toISOString();
  const createdAt = user.createdAt || now.split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO users (
      id, name, email, role, phone, password, is_active, avatar, created_at, updated_at,
      assigned_vehicle_id, assigned_vehicle_number, license_number, base_station, shift_status, emt_level,
      blood_type, emergency_contact_name, emergency_contact_phone, allergies, medical_notes, default_address,
      clearance_level, can_manage_fleet, can_manage_users, admin_secret_key,
      operator_code, terminal_number, radio_channel, cad_shift, cad_station_sector,
      affiliated_hospital_id, affiliated_hospital_name, department, emergency_contact_extension, staff_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    user.id,
    user.name,
    user.email,
    user.role,
    user.phone || '',
    user.password || null,
    user.isActive !== false ? 1 : 0,
    user.avatar || null,
    createdAt,
    now,
    user.assignedVehicleId || null,
    user.assignedVehicleNumber || null,
    user.licenseNumber || null,
    user.baseStation || null,
    user.shiftStatus || null,
    user.emtLevel || null,
    user.bloodType || null,
    user.emergencyContactName || null,
    user.emergencyContactPhone || null,
    user.allergies || null,
    user.medicalNotes || null,
    user.defaultAddress || null,
    user.clearanceLevel || null,
    user.canManageFleet ? 1 : 0,
    user.canManageUsers ? 1 : 0,
    user.adminSecretKey || null,
    user.operatorCode || null,
    user.terminalNumber || null,
    user.radioChannel || null,
    user.cadShift || null,
    user.cadStationSector || null,
    user.affiliatedHospitalId || null,
    user.affiliatedHospitalName || null,
    user.department || null,
    user.emergencyContactExtension || null,
    user.staffId || null
  );

  syncUsersJsonFromDb();
  logAuditAction('USER_CREATED', 'System', user.id, `User ${user.name} (${user.role}) persisted to SQLite`);

  return getUserByIdFromDb(user.id)!;
}

export function updateUserInDb(id: string, updates: Partial<UserProfile>): UserProfile | null {
  const existing = getUserByIdFromDb(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE users SET
      name = ?,
      email = ?,
      role = ?,
      phone = ?,
      is_active = ?,
      updated_at = ?,
      assigned_vehicle_id = ?,
      assigned_vehicle_number = ?,
      license_number = ?,
      base_station = ?,
      shift_status = ?,
      emt_level = ?,
      blood_type = ?,
      emergency_contact_name = ?,
      emergency_contact_phone = ?,
      allergies = ?,
      medical_notes = ?,
      default_address = ?,
      clearance_level = ?,
      can_manage_fleet = ?,
      can_manage_users = ?,
      admin_secret_key = ?,
      operator_code = ?,
      terminal_number = ?,
      radio_channel = ?,
      cad_shift = ?,
      cad_station_sector = ?,
      affiliated_hospital_id = ?,
      affiliated_hospital_name = ?,
      department = ?,
      emergency_contact_extension = ?,
      staff_id = ?
    WHERE id = ?
  `);

  stmt.run(
    merged.name,
    merged.email,
    merged.role,
    merged.phone,
    merged.isActive !== false ? 1 : 0,
    now,
    merged.assignedVehicleId || null,
    merged.assignedVehicleNumber || null,
    merged.licenseNumber || null,
    merged.baseStation || null,
    merged.shiftStatus || null,
    merged.emtLevel || null,
    merged.bloodType || null,
    merged.emergencyContactName || null,
    merged.emergencyContactPhone || null,
    merged.allergies || null,
    merged.medicalNotes || null,
    merged.defaultAddress || null,
    merged.clearanceLevel || null,
    merged.canManageFleet ? 1 : 0,
    merged.canManageUsers ? 1 : 0,
    merged.adminSecretKey || null,
    merged.operatorCode || null,
    merged.terminalNumber || null,
    merged.radioChannel || null,
    merged.cadShift || null,
    merged.cadStationSector || null,
    merged.affiliatedHospitalId || null,
    merged.affiliatedHospitalName || null,
    merged.department || null,
    merged.emergencyContactExtension || null,
    merged.staffId || null,
    id
  );

  syncUsersJsonFromDb();
  logAuditAction('USER_UPDATED', 'Admin', id, `User ${merged.name} updated in database`);

  return getUserByIdFromDb(id);
}

export function deleteUserFromDb(id: string): boolean {
  const existing = getUserByIdFromDb(id);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);

  syncUsersJsonFromDb();
  logAuditAction('USER_DELETED', 'Admin', id, `User ${existing.name} (${existing.role}) deleted from database`);

  return true;
}

// --------------------------------------------------------------------------
// EMERGENCY CRUD & REALTIME TELEMETRY HELPERS
// --------------------------------------------------------------------------
export function getAllEmergenciesFromDb(): EmergencyRecord[] {
  const stmt = db.prepare('SELECT * FROM emergencies ORDER BY created_at DESC');
  return stmt.all() as unknown as EmergencyRecord[];
}

export function getEmergencyByIdFromDb(id: string): EmergencyRecord | null {
  const stmt = db.prepare('SELECT * FROM emergencies WHERE id = ?');
  const row = stmt.get(id) as unknown as EmergencyRecord | undefined;
  return row || null;
}

export function insertEmergencyInDb(emg: EmergencyRecord): EmergencyRecord {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO emergencies (
      id, caller_name, caller_phone, emergency_type, priority,
      latitude, longitude, landmark, status,
      assigned_ambulance_id, assigned_ambulance_plate, driver_name, driver_contact,
      target_hospital_id, target_hospital_name, eta_minutes, distance_km,
      vitals_json, notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  stmt.run(
    emg.id,
    emg.caller_name,
    emg.caller_phone,
    emg.emergency_type,
    emg.priority || 'Critical (P1)',
    emg.latitude,
    emg.longitude,
    emg.landmark || 'Mira Road GPS Landmark',
    emg.status || 'pending',
    emg.assigned_ambulance_id || null,
    emg.assigned_ambulance_plate || null,
    emg.driver_name || null,
    emg.driver_contact || null,
    emg.target_hospital_id || null,
    emg.target_hospital_name || null,
    emg.eta_minutes || null,
    emg.distance_km || null,
    emg.vitals_json || null,
    emg.notes || null,
    emg.created_at || now,
    now
  );

  logAuditAction('EMERGENCY_CREATED', emg.caller_name, emg.id, `${emg.emergency_type} at ${emg.landmark}`);
  return getEmergencyByIdFromDb(emg.id)!;
}

export function updateEmergencyInDb(id: string, updates: Partial<EmergencyRecord>): EmergencyRecord | null {
  const existing = getEmergencyByIdFromDb(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE emergencies SET
      status = ?,
      assigned_ambulance_id = ?,
      assigned_ambulance_plate = ?,
      driver_name = ?,
      driver_contact = ?,
      target_hospital_id = ?,
      target_hospital_name = ?,
      eta_minutes = ?,
      distance_km = ?,
      vitals_json = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    merged.status,
    merged.assigned_ambulance_id || null,
    merged.assigned_ambulance_plate || null,
    merged.driver_name || null,
    merged.driver_contact || null,
    merged.target_hospital_id || null,
    merged.target_hospital_name || null,
    merged.eta_minutes !== undefined ? merged.eta_minutes : null,
    merged.distance_km !== undefined ? merged.distance_km : null,
    merged.vitals_json || null,
    merged.notes || null,
    now,
    id
  );

  logAuditAction('EMERGENCY_UPDATED', 'Dispatcher/Driver', id, `Status updated to ${merged.status}`);
  return getEmergencyByIdFromDb(id);
}

export function deleteEmergencyFromDb(id: string): boolean {
  const existing = getEmergencyByIdFromDb(id);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM emergencies WHERE id = ?');
  stmt.run(id);
  return true;
}

function logAuditAction(action: string, actor: string, targetId: string, details: string) {
  try {
    const stmt = db.prepare(`
      INSERT INTO system_audit_logs (id, timestamp, action, actor_name, target_user_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(`LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, new Date().toISOString(), action, actor, targetId, details);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function getDatabaseStats() {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const auditCount = (db.prepare('SELECT COUNT(*) as c FROM system_audit_logs').get() as any).c;
  const roleBreakdown = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all() as any[];
  const emergencyCount = (db.prepare('SELECT COUNT(*) as c FROM emergencies').get() as any).c;
  const activeEmergencies = (db.prepare("SELECT COUNT(*) as c FROM emergencies WHERE status NOT IN ('completed', 'cancelled')").get() as any).c;

  return {
    engine: 'SQLite 3 (Node:sqlite DatabaseSync)',
    dbPath: DB_PATH,
    totalUsers: userCount,
    totalAuditLogs: auditCount,
    totalEmergencies: emergencyCount,
    activeEmergencies,
    roleBreakdown: roleBreakdown.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {} as Record<string, number>),
    lastSync: new Date().toISOString()
  };
}

function syncUsersJsonFromDb() {
  try {
    const users = getAllUsersFromDb();
    fs.writeFileSync(USERS_JSON_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing users.json backup:', err);
  }
}
