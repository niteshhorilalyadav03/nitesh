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

    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_name TEXT,
      target_user_id TEXT,
      details TEXT
    );
  `);

  // Seed default users if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (countRow.count === 0) {
    seedInitialUsers();
  } else {
    syncUsersJsonFromDb();
  }
}

// Initial 5 core users
const SEED_USERS: UserProfile[] = [
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
    emtLevel: 'Advanced Life Support (ALS) Paramedic',
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
    cadShift: 'Morning (06:00 - 14:00)',
    cadStationSector: 'Mira Road East EOC Sector 1',
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

function seedInitialUsers() {
  for (const user of SEED_USERS) {
    insertUserInDb(user);
  }
  syncUsersJsonFromDb();
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
  logAuditAction('USER_CREATED', 'System Admin / Registration', user.id, `User ${user.name} (${user.role}) added to database`);

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
      password = ?,
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
    merged.phone || '',
    merged.password || null,
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

  return {
    engine: 'SQLite 3 (Node:sqlite DatabaseSync)',
    dbPath: DB_PATH,
    totalUsers: userCount,
    totalAuditLogs: auditCount,
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
