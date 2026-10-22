/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: AdminDash.tsx (Master Administrative Control Panel & CRUD Hub)
 * Refined: Multi-Table Categorized User Directory (Citizens, Operators, Hospitals, Dispatchers, Admins)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp, clean10DigitPhone } from '../context/AppContext';
import { UserProfile, UserRole, Ambulance, Hospital, normalizeRole } from '../types';
import {
  Shield,
  Users,
  Siren,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Radio,
  Fuel,
  Activity,
  X,
  Save,
  Check,
  Database,
  RefreshCw,
  HeartPulse,
  Phone,
  PhoneCall,
  KeyRound,
  Eye,
  EyeOff,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Sparkles,
  MapPin,
  Clock,
  Filter
} from 'lucide-react';

export const AdminDash: React.FC = () => {
  const {
    users,
    ambulances,
    hospitals,
    addUser,
    updateUser,
    deleteUser,
    addAmbulance,
    updateAmbulance,
    deleteAmbulance,
    addHospital,
    updateHospital,
    deleteHospital,
    dbConnected,
    dbLastSyncTime,
    dbStats,
    refreshUsersFromDb
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'fleet' | 'hospitals'>('users');
  const [userTableSubTab, setUserTableSubTab] = useState<
    'all' | 'Citizen' | 'Ambulance Operator' | 'Healthcare Coordinator' | 'Emergency Coordinator' | 'Platform Administrator'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);

  // User form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Emergency Coordinator');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [userPhoneError, setUserPhoneError] = useState<string | null>(null);

  // Role-specific fields for new user
  const [newUserBloodType, setNewUserBloodType] = useState('O Positive (O+)');
  const [newUserEmergencyContact, setNewUserEmergencyContact] = useState('');
  const [newUserEmergencyPhone, setNewUserEmergencyPhone] = useState('');
  const [newUserEmergencyPhoneError, setNewUserEmergencyPhoneError] = useState<string | null>(null);
  const [newUserAddress, setNewUserAddress] = useState('Mira Road East, Sector 5');
  const [newUserMedicalNotes, setNewUserMedicalNotes] = useState('');
  const [newUserAllergies, setNewUserAllergies] = useState('');

  const [newUserVehicleNumber, setNewUserVehicleNumber] = useState('MH-04-AZ-1024');
  const [newUserEmtLevel, setNewUserEmtLevel] = useState<'Basic (BLS)' | 'Intermediate' | 'Advanced Life Support (ALS) Paramedic'>('Advanced Life Support (ALS) Paramedic');
  const [newUserBaseStation, setNewUserBaseStation] = useState('Mira Road Base Hub');

  const [newUserHospitalName, setNewUserHospitalName] = useState('Bhaktivedanta Hospital');
  const [newUserDepartment, setNewUserDepartment] = useState('Emergency Medicine');
  const [newUserStaffId, setNewUserStaffId] = useState('HOSP-STAFF-108');
  const [newUserExtension, setNewUserExtension] = useState('EXT-108');

  const [newUserOperatorCode, setNewUserOperatorCode] = useState('CAD-4011');
  const [newUserTerminalNumber, setNewUserTerminalNumber] = useState('TERMINAL-CAD-01');
  const [newUserRadioChannel, setNewUserRadioChannel] = useState('EMS-154.25 MHz');
  const [newUserCadShift, setNewUserCadShift] = useState<'Morning (06:00 - 14:00)' | 'Evening (14:00 - 22:00)' | 'Night Watch (22:00 - 06:00)'>('Morning (06:00 - 14:00)');

  const [newUserClearanceLevel, setNewUserClearanceLevel] = useState<'Super Admin' | 'Fleet Manager' | 'System Auditor'>('Super Admin');
  const [newUserAdminSecretKey, setNewUserAdminSecretKey] = useState('EMS-ROOT-2025');

  // Edit user modal state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('Emergency Coordinator');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);

  // Edit user role-specific fields
  const [editUserBloodType, setEditUserBloodType] = useState('O Positive (O+)');
  const [editUserEmergencyContact, setEditUserEmergencyContact] = useState('');
  const [editUserEmergencyPhone, setEditUserEmergencyPhone] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserMedicalNotes, setEditUserMedicalNotes] = useState('');
  const [editUserVehicleNumber, setEditUserVehicleNumber] = useState('');
  const [editUserEmtLevel, setEditUserEmtLevel] = useState<'Basic (BLS)' | 'Intermediate' | 'Advanced Life Support (ALS) Paramedic'>('Advanced Life Support (ALS) Paramedic');
  const [editUserBaseStation, setEditUserBaseStation] = useState('');
  const [editUserHospitalName, setEditUserHospitalName] = useState('');
  const [editUserDepartment, setEditUserDepartment] = useState('');
  const [editUserStaffId, setEditUserStaffId] = useState('');
  const [editUserExtension, setEditUserExtension] = useState('');
  const [editUserOperatorCode, setEditUserOperatorCode] = useState('');
  const [editUserTerminalNumber, setEditUserTerminalNumber] = useState('');
  const [editUserRadioChannel, setEditUserRadioChannel] = useState('');
  const [editUserClearanceLevel, setEditUserClearanceLevel] = useState<'Super Admin' | 'Fleet Manager' | 'System Auditor'>('Super Admin');
  const [editUserAdminSecretKey, setEditUserAdminSecretKey] = useState('');

  // Key visibility toggles
  const [showSecretKeys, setShowSecretKeys] = useState<Record<string, boolean>>({});

  // Ambulance form state
  const [newPlate, setNewPlate] = useState('MH-04-XX-0000');
  const [newDriver, setNewDriver] = useState('');
  const [newContact, setNewContact] = useState('');
  const [ambulanceContactError, setAmbulanceContactError] = useState<string | null>(null);
  const [newType, setNewType] = useState('Advanced Life Support');
  const [newLandmark, setNewLandmark] = useState('Mira Road Base Hub');
  const [newLat, setNewLat] = useState('19.2815');
  const [newLon, setNewLon] = useState('72.8558');

  // Hospital form state
  const [newHospName, setNewHospName] = useState('');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospHotline, setNewHospHotline] = useState('022-');
  const [newHospBeds, setNewHospBeds] = useState(6);
  const [newHospTrauma, setNewHospTrauma] = useState(true);

  // Notification alert
  const [alertNote, setAlertNote] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setAlertNote(msg);
    setTimeout(() => setAlertNote(null), 3500);
  };

  // Input sanitizer: only whole numbers (0-9) and max 10 digits
  const handlePhoneInputChange = (
    val: string,
    setter: (val: string) => void,
    errorSetter: (err: string | null) => void
  ) => {
    const wholeNumbersOnly = val.replace(/\D/g, '').slice(0, 10);
    setter(wholeNumbersOnly);
    errorSetter(null);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/[0-9]/.test(e.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  };

  // Open modal directly pre-configured for a specific role
  const handleOpenAddUserForRole = (role: UserRole) => {
    setNewUserRole(role);
    setUserPhoneError(null);
    setNewUserEmergencyPhoneError(null);
    setShowUserModal(true);
  };

  // Toggle secret key visibility
  const toggleKeyVisibility = (userId: string) => {
    setShowSecretKeys(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Handlers
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    // Enforce strictly 10 digits whole numbers
    const cleanPhone = clean10DigitPhone(newUserPhone);
    if (cleanPhone.length !== 10) {
      setUserPhoneError('Phone number must be strictly 10 whole digits.');
      return;
    }

    let cleanEmergencyPhone: string | undefined = undefined;
    if (newUserRole === 'Citizen' && newUserEmergencyPhone) {
      cleanEmergencyPhone = clean10DigitPhone(newUserEmergencyPhone);
      if (cleanEmergencyPhone.length !== 10) {
        setNewUserEmergencyPhoneError('Emergency contact phone must be strictly 10 whole digits.');
        return;
      }
    }

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      phone: cleanPhone,
      isActive: true,
      ...(newUserRole === 'Citizen'
        ? {
            bloodType: newUserBloodType,
            emergencyContactName: newUserEmergencyContact.trim() || 'Family Emergency Contact',
            emergencyContactPhone: cleanEmergencyPhone || cleanPhone,
            defaultAddress: newUserAddress.trim() || 'Mira Road East',
            allergies: newUserAllergies.trim() || 'None reported',
            medicalNotes: newUserMedicalNotes.trim() || 'Regular checkup'
          }
        : {}),
      ...(newUserRole === 'Ambulance Operator'
        ? {
            assignedVehicleNumber: newUserVehicleNumber.trim() || 'MH-04-AZ-1024',
            emtLevel: newUserEmtLevel,
            baseStation: newUserBaseStation.trim() || 'Mira Road Station Plaza Hub',
            shiftStatus: 'on-duty'
          }
        : {}),
      ...(newUserRole === 'Healthcare Coordinator'
        ? {
            affiliatedHospitalName: newUserHospitalName || 'Bhaktivedanta Hospital',
            department: newUserDepartment.trim() || 'Emergency Medicine',
            staffId: newUserStaffId.trim() || 'HOSP-STAFF-108',
            emergencyContactExtension: newUserExtension.trim() || 'EXT-108'
          }
        : {}),
      ...(newUserRole === 'Emergency Coordinator'
        ? {
            operatorCode: newUserOperatorCode.trim() || `CAD-${Math.floor(1000 + Math.random() * 9000)}`,
            terminalNumber: newUserTerminalNumber.trim() || 'TERMINAL-CAD-01',
            radioChannel: newUserRadioChannel.trim() || 'EMS-154.25 MHz',
            cadShift: newUserCadShift
          }
        : {}),
      ...(newUserRole === 'Platform Administrator'
        ? {
            clearanceLevel: newUserClearanceLevel,
            canManageFleet: true,
            canManageUsers: true,
            adminSecretKey: newUserAdminSecretKey.trim() || 'EMS-ROOT-2025'
          }
        : {})
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setUserPhoneError(null);
    setNewUserEmergencyPhoneError(null);
    setShowUserModal(false);
    showAlert(`User ${newUserName} successfully added as ${newUserRole} into SQLite database.`);
  };

  const handleStartEditUser = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(normalizeRole(user.role));
    setEditUserPhone((user.phone || '').replace(/\D/g, '').slice(0, 10));
    setEditPhoneError(null);

    // Populate role fields
    setEditUserBloodType(user.bloodType || 'O Positive (O+)');
    setEditUserEmergencyContact(user.emergencyContactName || '');
    setEditUserEmergencyPhone((user.emergencyContactPhone || '').replace(/\D/g, '').slice(0, 10));
    setEditUserAddress(user.defaultAddress || '');
    setEditUserMedicalNotes(user.medicalNotes || '');

    setEditUserVehicleNumber(user.assignedVehicleNumber || 'MH-04-AZ-1024');
    setEditUserEmtLevel(user.emtLevel || 'Advanced Life Support (ALS) Paramedic');
    setEditUserBaseStation(user.baseStation || 'Mira Road Base Hub');

    setEditUserHospitalName(user.affiliatedHospitalName || 'Bhaktivedanta Hospital');
    setEditUserDepartment(user.department || 'Emergency Medicine');
    setEditUserStaffId(user.staffId || 'HOSP-STAFF-108');
    setEditUserExtension(user.emergencyContactExtension || 'EXT-108');

    setEditUserOperatorCode(user.operatorCode || 'CAD-4011');
    setEditUserTerminalNumber(user.terminalNumber || 'TERMINAL-CAD-01');
    setEditUserRadioChannel(user.radioChannel || 'EMS-154.25 MHz');

    setEditUserClearanceLevel(user.clearanceLevel || 'Super Admin');
    setEditUserAdminSecretKey(user.adminSecretKey || 'EMS-ROOT-2025');

    setShowEditUserModal(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editUserName.trim() || !editUserEmail.trim()) return;

    const cleanPhone = clean10DigitPhone(editUserPhone);
    if (cleanPhone.length !== 10) {
      setEditPhoneError('Phone number must be only whole numbers and exactly 10 digits.');
      return;
    }

    updateUser(editingUserId, {
      name: editUserName.trim(),
      email: editUserEmail.trim(),
      role: editUserRole,
      phone: cleanPhone,
      ...(editUserRole === 'Citizen'
        ? {
            bloodType: editUserBloodType,
            emergencyContactName: editUserEmergencyContact.trim(),
            emergencyContactPhone: clean10DigitPhone(editUserEmergencyPhone) || cleanPhone,
            defaultAddress: editUserAddress.trim(),
            medicalNotes: editUserMedicalNotes.trim()
          }
        : {}),
      ...(editUserRole === 'Ambulance Operator'
        ? {
            assignedVehicleNumber: editUserVehicleNumber.trim(),
            emtLevel: editUserEmtLevel,
            baseStation: editUserBaseStation.trim()
          }
        : {}),
      ...(editUserRole === 'Healthcare Coordinator'
        ? {
            affiliatedHospitalName: editUserHospitalName,
            department: editUserDepartment.trim(),
            staffId: editUserStaffId.trim(),
            emergencyContactExtension: editUserExtension.trim()
          }
        : {}),
      ...(editUserRole === 'Emergency Coordinator'
        ? {
            operatorCode: editUserOperatorCode.trim(),
            terminalNumber: editUserTerminalNumber.trim(),
            radioChannel: editUserRadioChannel.trim()
          }
        : {}),
      ...(editUserRole === 'Platform Administrator'
        ? {
            clearanceLevel: editUserClearanceLevel,
            adminSecretKey: editUserAdminSecretKey.trim() || 'EMS-ROOT-2025'
          }
        : {})
    });

    setShowEditUserModal(false);
    setEditingUserId(null);
    showAlert(`User ${editUserName} updated successfully in SQLite database.`);
  };

  const handleToggleDuty = (user: UserProfile) => {
    const nextStatus = user.shiftStatus === 'off-duty' ? 'on-duty' : 'off-duty';
    updateUser(user.id, { shiftStatus: nextStatus });
    showAlert(`${user.name} is now marked ${nextStatus}.`);
  };

  const handleCreateAmbulance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newDriver) return;

    if (newContact && !/^\d{10}$/.test(newContact)) {
      setAmbulanceContactError('Driver contact phone must be only whole numbers and exactly 10 digits.');
      return;
    }

    const newId = `AMB-00${ambulances.length + 1}`;
    addAmbulance({
      id: newId,
      vehicle_number: newPlate,
      driver_name: newDriver,
      contact: newContact || '9820112345',
      status: 'available',
      current_location: {
        latitude: parseFloat(newLat) || 19.2815,
        longitude: parseFloat(newLon) || 72.8558,
        landmark: newLandmark
      },
      type: newType,
      equipment: ['Oxygen Cylinder', 'First Aid', 'Defibrillator'],
      base_station: newLandmark,
      fuel_level: '95%'
    });

    setNewPlate('');
    setNewDriver('');
    setNewContact('');
    setAmbulanceContactError(null);
    setShowAmbulanceModal(false);
    showAlert(`Ambulance unit ${newPlate} registered.`);
  };

  const handleCreateHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName) return;

    const newId = `HOSP-00${hospitals.length + 1}`;
    addHospital({
      id: newId,
      name: newHospName,
      address: newHospAddress || 'Mira Road East, Thane 401107',
      location: { latitude: 19.285, longitude: 72.86 },
      emergency_contact: newHospHotline,
      icu_beds_available: Number(newHospBeds),
      has_trauma_center: newHospTrauma
    });

    setNewHospName('');
    setNewHospAddress('');
    setShowHospitalModal(false);
    showAlert(`Hospital ${newHospName} added to dispatch network.`);
  };

  // Grouped users lists for separate tables
  const filterBySearch = (u: UserProfile) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.assignedVehicleNumber && u.assignedVehicleNumber.toLowerCase().includes(q)) ||
      (u.affiliatedHospitalName && u.affiliatedHospitalName.toLowerCase().includes(q)) ||
      (u.operatorCode && u.operatorCode.toLowerCase().includes(q)) ||
      (u.bloodType && u.bloodType.toLowerCase().includes(q))
    );
  };

  const citizenUsers = users.filter(u => (normalizeRole(u.role) === 'Citizen') && filterBySearch(u));
  const operatorUsers = users.filter(u => (normalizeRole(u.role) === 'Ambulance Operator') && filterBySearch(u));
  const hospitalUsers = users.filter(u => (normalizeRole(u.role) === 'Healthcare Coordinator') && filterBySearch(u));
  const dispatcherUsers = users.filter(u => (normalizeRole(u.role) === 'Emergency Coordinator') && filterBySearch(u));
  const adminUsers = users.filter(u => (normalizeRole(u.role) === 'Platform Administrator') && filterBySearch(u));

  const availableUnits = ambulances.filter(a => a.status === 'available').length;
  const totalBeds = hospitals.reduce((acc, h) => acc + (h.icu_beds_available || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Admin Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500">System Users</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
            <p className="text-[11px] text-slate-400">Across 5 distinct roles</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500">Fleet Units</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{ambulances.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">{availableUnits} Available</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Siren className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500">Hospital Centers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{hospitals.length}</p>
            <p className="text-[11px] text-slate-400">Partner Facilities</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500">ICU Bed Reserve</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{totalBeds}</p>
            <p className="text-[11px] text-slate-400">Total Available Beds</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertNote && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertNote}</span>
          </div>
          <button onClick={() => setAlertNote(null)} className="font-bold text-emerald-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Live SQLite Database Status & Multi-User Sync Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-indigo-500/30 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {dbConnected ? 'SQLITE PERSISTENT DATABASE CONNECTED' : 'DATABASE CONNECTING...'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Storage: /data/lifeline.sqlite (Node SQLite Driver)
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              Multi-Role Categorized User Tables & Real-Time Sync
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Each user category (Citizens, Ambulance Operators, Healthcare Coordinators, CAD Dispatchers, and Administrators) is segregated into dedicated domain-specific tables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 font-medium">Database Store</p>
            <p className="text-sm font-black text-indigo-200">
              {users.length} Users Enrolled
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Last Sync: {dbLastSyncTime}
            </p>
          </div>
          <button
            onClick={() => refreshUsersFromDb()}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Force refresh database records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync DB</span>
          </button>
        </div>
      </div>

      {/* Main Master Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation & Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-[#0D253F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Accounts ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'fleet' ? 'bg-[#0D253F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Ambulance Fleet ({ambulances.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hospitals')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'hospitals' ? 'bg-[#0D253F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital Facilities ({hospitals.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across tables..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'users' && (
              <button
                onClick={() => {
                  setNewUserRole('Citizen');
                  setShowUserModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            )}

            {activeTab === 'fleet' && (
              <button
                onClick={() => setShowAmbulanceModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ambulance</span>
              </button>
            )}

            {activeTab === 'hospitals' && (
              <button
                onClick={() => setShowHospitalModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hospital</span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: USERS SECTION WITH DEDICATED SEPARATE TABLES                */}
        {/* ================================================================== */}
        {activeTab === 'users' && (
          <div className="p-4 sm:p-5 space-y-6">
            {/* Quick 5-Role Table View Switcher & KPI Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUserTableSubTab('all')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  userTableSubTab === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs">{users.length}</span>
                </div>
                <div className="mt-1 font-bold text-[11px] truncate">All Tables (Stacked)</div>
              </button>

              <button
                type="button"
                onClick={() => setUserTableSubTab('Citizen')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  userTableSubTab === 'Citizen'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-xs">{users.filter(u => normalizeRole(u.role) === 'Citizen').length}</span>
                </div>
                <div className="mt-1 font-bold text-[11px] truncate">Citizens & Patients</div>
              </button>

              <button
                type="button"
                onClick={() => setUserTableSubTab('Ambulance Operator')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  userTableSubTab === 'Ambulance Operator'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Siren className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs">{users.filter(u => normalizeRole(u.role) === 'Ambulance Operator').length}</span>
                </div>
                <div className="mt-1 font-bold text-[11px] truncate">Ambulance Operators</div>
              </button>

              <button
                type="button"
                onClick={() => setUserTableSubTab('Healthcare Coordinator')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  userTableSubTab === 'Healthcare Coordinator'
                    ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-teal-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-xs">{users.filter(u => normalizeRole(u.role) === 'Healthcare Coordinator').length}</span>
                </div>
                <div className="mt-1 font-bold text-[11px] truncate">Hospital Staff & ER</div>
              </button>

              <button
                type="button"
                onClick={() => setUserTableSubTab('Emergency Coordinator')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  userTableSubTab === 'Emergency Coordinator'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs">{users.filter(u => normalizeRole(u.role) === 'Emergency Coordinator').length}</span>
                </div>
                <div className="mt-1 font-bold text-[11px] truncate">CAD Dispatchers</div>
              </button>

              <button
                type="button"
                onClick={() => setUserTableSubTab('Platform Administrator')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  userTableSubTab === 'Platform Administrator'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-300 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-xs">{users.filter(u => normalizeRole(u.role) === 'Platform Administrator').length}</span>
                </div>
                <div className="mt-1 font-bold text-[11px] truncate">Administrators</div>
              </button>
            </div>

            {/* ============================================================== */}
            {/* SEPARATE TABLE 1: CITIZENS & PATIENTS                          */}
            {/* ============================================================== */}
            {(userTableSubTab === 'all' || userTableSubTab === 'Citizen') && (
              <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/40 border-b border-rose-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Citizens & Patients Table</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {citizenUsers.length} Enrolled
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Public distress reporting callers, emergency contact numbers, blood types, and medical histories
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddUserForRole('Citizen')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Citizen</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-rose-50/40 text-[11px] uppercase font-bold text-slate-500 border-b border-rose-100">
                      <tr>
                        <th className="px-4 py-3">Patient / Citizen</th>
                        <th className="px-4 py-3">Mobile Contact</th>
                        <th className="px-4 py-3">Blood Group</th>
                        <th className="px-4 py-3">Emergency Contact</th>
                        <th className="px-4 py-3">Residential Sector</th>
                        <th className="px-4 py-3">Medical History / Allergies</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {citizenUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                            No citizens found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        citizenUsers.map(user => (
                          <tr key={user.id} className="hover:bg-rose-50/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">{user.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{user.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`tel:${user.phone}`}
                                className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>+91 {user.phone}</span>
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 font-mono">
                                {user.bloodType || 'B Positive (B+)'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800 text-[11px]">
                                {user.emergencyContactName || 'Family Contact'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {user.emergencyContactPhone ? `+91 ${user.emergencyContactPhone}` : `+91 ${user.phone}`}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <span className="truncate block max-w-[160px] text-[11px]">
                                {user.defaultAddress || 'Mira Road Sector 5'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[11px] text-slate-600 truncate block max-w-[180px]">
                                {user.medicalNotes || user.allergies || 'None reported'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Active SOS
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditUser(user)}
                                  title="Edit Citizen Profile"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove citizen ${user.name}?`)) {
                                      deleteUser(user.id);
                                      showAlert(`Citizen ${user.name} removed from SQLite database.`);
                                    }
                                  }}
                                  title="Delete Citizen"
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SEPARATE TABLE 2: AMBULANCE OPERATORS & DRIVERS                */}
            {/* ============================================================== */}
            {(userTableSubTab === 'all' || userTableSubTab === 'Ambulance Operator') && (
              <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      <Siren className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Ambulance Operators & Drivers Table</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {operatorUsers.length} Operators
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Emergency vehicle operators, paramedics, mobile response crew and license assignments
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddUserForRole('Ambulance Operator')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Operator</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-emerald-50/40 text-[11px] uppercase font-bold text-slate-500 border-b border-emerald-100">
                      <tr>
                        <th className="px-4 py-3">Driver / Operator</th>
                        <th className="px-4 py-3">Phone Contact</th>
                        <th className="px-4 py-3">Assigned Vehicle</th>
                        <th className="px-4 py-3">EMT Certification</th>
                        <th className="px-4 py-3">Station Base</th>
                        <th className="px-4 py-3">Shift Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {operatorUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No ambulance operators found.
                          </td>
                        </tr>
                      ) : (
                        operatorUsers.map(user => (
                          <tr key={user.id} className="hover:bg-emerald-50/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">{user.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{user.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`tel:${user.phone}`}
                                className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <PhoneCall className="w-3 h-3 text-emerald-500" />
                                <span>+91 {user.phone}</span>
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                                {user.assignedVehicleNumber || 'MH-04-AZ-1024'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                {user.emtLevel || 'Advanced Life Support (ALS)'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <span className="truncate block max-w-[180px] text-[11px]">
                                {user.baseStation || 'Mira Road Central Station'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => handleToggleDuty(user)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                  user.shiftStatus === 'off-duty'
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                                title="Click to toggle on-duty / off-duty"
                              >
                                {user.shiftStatus === 'off-duty' ? 'Off-Duty' : 'On-Duty • Available'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditUser(user)}
                                  title="Edit Operator Profile"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove operator ${user.name}?`)) {
                                      deleteUser(user.id);
                                      showAlert(`Operator ${user.name} removed from SQLite database.`);
                                    }
                                  }}
                                  title="Delete Operator"
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SEPARATE TABLE 3: HEALTHCARE COORDINATORS & HOSPITAL ER STAFF   */}
            {/* ============================================================== */}
            {(userTableSubTab === 'all' || userTableSubTab === 'Healthcare Coordinator') && (
              <div className="bg-white rounded-2xl border border-teal-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Healthcare Coordinators & Hospital ER Staff Table</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {hospitalUsers.length} Clinicians
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Hospital clinical staff, triage administrators, emergency doctors on-duty & ICU capacity managers
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddUserForRole('Healthcare Coordinator')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Medical Staff</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-teal-50/40 text-[11px] uppercase font-bold text-slate-500 border-b border-teal-100">
                      <tr>
                        <th className="px-4 py-3">Medical Coordinator</th>
                        <th className="px-4 py-3">Phone & Extension</th>
                        <th className="px-4 py-3">Affiliated Hospital</th>
                        <th className="px-4 py-3">Clinical Department</th>
                        <th className="px-4 py-3">Staff Council ID</th>
                        <th className="px-4 py-3">Handover Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hospitalUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No healthcare coordinators found.
                          </td>
                        </tr>
                      ) : (
                        hospitalUsers.map(user => (
                          <tr key={user.id} className="hover:bg-teal-50/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">{user.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{user.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`tel:${user.phone}`}
                                className="font-mono text-teal-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>+91 {user.phone}</span>
                              </a>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Ext: {user.emergencyContactExtension || 'EXT-108'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                                {user.affiliatedHospitalName || 'Bhaktivedanta Hospital'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 border border-teal-200 text-teal-800">
                                {user.department || 'Emergency Medicine & Trauma'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                              {user.staffId || 'HOSP-STAFF-108'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Bed Portal Active
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditUser(user)}
                                  title="Edit Healthcare Staff"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove medical staff ${user.name}?`)) {
                                      deleteUser(user.id);
                                      showAlert(`Medical staff ${user.name} removed from SQLite database.`);
                                    }
                                  }}
                                  title="Delete Staff"
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SEPARATE TABLE 4: EMERGENCY COORDINATORS & CAD DISPATCHERS     */}
            {/* ============================================================== */}
            {(userTableSubTab === 'all' || userTableSubTab === 'Emergency Coordinator') && (
              <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Emergency Coordinators & CAD Dispatchers Table</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {dispatcherUsers.length} Dispatchers
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        CAD control room operators, emergency call loggers, radar controllers and radio frequency managers
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddUserForRole('Emergency Coordinator')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add CAD Dispatcher</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-blue-50/40 text-[11px] uppercase font-bold text-slate-500 border-b border-blue-100">
                      <tr>
                        <th className="px-4 py-3">Dispatcher / Coordinator</th>
                        <th className="px-4 py-3">CAD Operator Code</th>
                        <th className="px-4 py-3">Direct Hotline</th>
                        <th className="px-4 py-3">CAD Workstation</th>
                        <th className="px-4 py-3">Radio Channel</th>
                        <th className="px-4 py-3">CAD Shift</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispatcherUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No dispatchers found.
                          </td>
                        </tr>
                      ) : (
                        dispatcherUsers.map(user => (
                          <tr key={user.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">{user.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{user.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-blue-900 px-2 py-0.5 rounded bg-blue-100 border border-blue-200 text-[11px]">
                                {user.operatorCode || 'CAD-4011'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`tel:${user.phone}`}
                                className="font-mono text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <PhoneCall className="w-3 h-3 text-blue-500" />
                                <span>+91 {user.phone}</span>
                              </a>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700 text-[11px]">
                              {user.terminalNumber || 'TERMINAL-CAD-01'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                📻 {user.radioChannel || 'EMS-154.25 MHz'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {user.cadShift || 'Morning Watch (06:00 - 14:00)'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditUser(user)}
                                  title="Edit Dispatcher"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove dispatcher ${user.name}?`)) {
                                      deleteUser(user.id);
                                      showAlert(`Dispatcher ${user.name} removed from SQLite database.`);
                                    }
                                  }}
                                  title="Delete Dispatcher"
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SEPARATE TABLE 5: PLATFORM & SYSTEM ADMINISTRATORS             */}
            {/* ============================================================== */}
            {(userTableSubTab === 'all' || userTableSubTab === 'Platform Administrator') && (
              <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/40 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Platform & System Administrators Table</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          {adminUsers.length} Root Admins
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        High-security governance accounts, master clearance keyholders and audit logs
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddUserForRole('Platform Administrator')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Provision Administrator</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-purple-50/40 text-[11px] uppercase font-bold text-slate-500 border-b border-purple-100">
                      <tr>
                        <th className="px-4 py-3">Administrator</th>
                        <th className="px-4 py-3">Mobile Contact</th>
                        <th className="px-4 py-3">Clearance Level</th>
                        <th className="px-4 py-3">Master Security Key</th>
                        <th className="px-4 py-3">RBAC Privileges</th>
                        <th className="px-4 py-3">Enrolled At</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No administrators found.
                          </td>
                        </tr>
                      ) : (
                        adminUsers.map(user => {
                          const isKeyVisible = showSecretKeys[user.id];
                          const secretKey = user.adminSecretKey || 'EMS-ROOT-2025';

                          return (
                            <tr key={user.id} className="hover:bg-purple-50/20 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{user.email}</p>
                              </td>
                              <td className="px-4 py-3">
                                <a
                                  href={`tel:${user.phone}`}
                                  className="font-mono text-purple-700 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <Phone className="w-3 h-3 text-purple-500" />
                                  <span>+91 {user.phone}</span>
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                  {user.clearanceLevel || 'Super Admin'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {isKeyVisible ? secretKey : '••••••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleKeyVisibility(user.id)}
                                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                    title={isKeyVisible ? 'Hide Key' : 'Reveal Key'}
                                  >
                                    {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-[10px] text-slate-700 font-semibold">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Fleet
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                    Users
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                                    SQLite
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-[11px] font-mono">
                                {user.createdAt || 'Active'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditUser(user)}
                                    title="Edit Administrator"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (adminUsers.length <= 1) {
                                        showAlert('Cannot delete the last remaining platform administrator.');
                                        return;
                                      }
                                      if (confirm(`Remove administrator ${user.name}?`)) {
                                        deleteUser(user.id);
                                        showAlert(`Administrator ${user.name} removed from SQLite database.`);
                                      }
                                    }}
                                    title="Delete Administrator"
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: AMBULANCES CRUD TABLE                                       */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'fleet' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Plate & ID</th>
                  <th className="px-4 py-3">Driver & Contact</th>
                  <th className="px-4 py-3">Service Tier</th>
                  <th className="px-4 py-3">Station Landmark</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fuel</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ambulances
                  .filter(
                    a =>
                      a.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.type.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(amb => (
                    <tr key={amb.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <strong className="text-slate-900 text-sm block">{amb.vehicle_number}</strong>
                        <span className="text-[10px] text-slate-400">{amb.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{amb.driver_name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{amb.contact}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{amb.type}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-xs">
                        {amb.current_location.landmark}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            const next = amb.status === 'available' ? 'busy' : 'available';
                            updateAmbulance(amb.id, { status: next });
                            showAlert(`Unit ${amb.vehicle_number} status set to ${next}.`);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            amb.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {amb.status} (Toggle)
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {amb.fuel_level || '85%'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Decommission unit ${amb.vehicle_number}?`)) {
                              deleteAmbulance(amb.id);
                              showAlert(`Unit ${amb.vehicle_number} deleted.`);
                            }
                          }}
                          title="Delete ambulance"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: HOSPITALS CRUD TABLE                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'hospitals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Facility Name</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Emergency Hotline</th>
                  <th className="px-4 py-3">ICU Beds Available</th>
                  <th className="px-4 py-3">Trauma Center</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals
                  .filter(
                    h =>
                      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      h.address.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(hosp => (
                    <tr key={hosp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{hosp.name}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{hosp.address}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{hosp.emergency_contact}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = Math.max(0, (hosp.icu_beds_available || 0) - 1);
                              updateHospital(hosp.id, { icu_beds_available: updated });
                            }}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center text-slate-700 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-900 font-mono w-6 text-center">
                            {hosp.icu_beds_available}
                          </span>
                          <button
                            onClick={() => {
                              const updated = (hosp.icu_beds_available || 0) + 1;
                              updateHospital(hosp.id, { icu_beds_available: updated });
                            }}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center text-slate-700 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hosp.has_trauma_center
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {hosp.has_trauma_center ? 'Level 1 Trauma' : 'General Care'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Remove facility ${hosp.name}?`)) {
                              deleteHospital(hosp.id);
                              showAlert(`Facility ${hosp.name} removed.`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL: ADD USER (ROLE-TAILORED FIELDS PERSISTING TO SQLITE)          */}
      {/* ==================================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-splash-in max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Add New System User</h4>
                  <p className="text-[11px] text-slate-500">Persists to SQLite database and broadcasts to all active dashboards</p>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Role Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target User Role Category *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Citizen">Citizen (SOS reporting, medical history & emergency contact)</option>
                  <option value="Ambulance Operator">Ambulance Operator (Paramedic driver, vehicle plate & ALS/BLS)</option>
                  <option value="Healthcare Coordinator">Healthcare Coordinator (Hospital clinician, ICU triage & staff ID)</option>
                  <option value="Emergency Coordinator">Emergency Coordinator (CAD operator, terminal & radio channel)</option>
                  <option value="Platform Administrator">Platform Administrator (Master clearance key & system owner)</option>
                </select>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="e.g. Officer Anita Desai"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="e.g. anita.desai@lifeline.ems.in"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Input with strict 10-digit validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">10-Digit Mobile Number *</label>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                      newUserPhone.length === 10
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : newUserPhone.length > 0
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {newUserPhone.length === 10 ? '✓ 10 Digits Valid' : `${newUserPhone.length}/10 digits`}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    value={newUserPhone}
                    onChange={e => handlePhoneInputChange(e.target.value, setNewUserPhone, setUserPhoneError)}
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="9820012345 (10 digits)"
                    className={`w-full border rounded-xl pl-12 pr-3 py-2.5 text-xs font-mono tracking-wider focus:outline-none focus:ring-2 ${
                      userPhoneError
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                        : newUserPhone.length === 10
                        ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {userPhoneError && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {userPhoneError}
                  </p>
                )}
              </div>

              {/* ROLE SPECIFIC FIELDS: Citizen */}
              {newUserRole === 'Citizen' && (
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    <span>Citizen Medical Profile Fields</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                      <select
                        value={newUserBloodType}
                        onChange={e => setNewUserBloodType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option>O Positive (O+)</option>
                        <option>O Negative (O-)</option>
                        <option>A Positive (A+)</option>
                        <option>A Negative (A-)</option>
                        <option>B Positive (B+)</option>
                        <option>B Negative (B-)</option>
                        <option>AB Positive (AB+)</option>
                        <option>AB Negative (AB-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Residential Sector / Area</label>
                      <input
                        type="text"
                        value={newUserAddress}
                        onChange={e => setNewUserAddress(e.target.value)}
                        placeholder="Mira Road East, Sector 5"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Emergency Contact Person</label>
                      <input
                        type="text"
                        value={newUserEmergencyContact}
                        onChange={e => setNewUserEmergencyContact(e.target.value)}
                        placeholder="e.g. Sangeeta (Spouse)"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Emergency Contact Phone (10-digit)</label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={newUserEmergencyPhone}
                        onChange={e => handlePhoneInputChange(e.target.value, setNewUserEmergencyPhone, setNewUserEmergencyPhoneError)}
                        placeholder="9820551122"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                      {newUserEmergencyPhoneError && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{newUserEmergencyPhoneError}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Medical History / Known Allergies</label>
                    <input
                      type="text"
                      value={newUserMedicalNotes}
                      onChange={e => setNewUserMedicalNotes(e.target.value)}
                      placeholder="e.g. Asthma, Penicillin allergy, Diabetes Type-2"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ROLE SPECIFIC FIELDS: Ambulance Operator */}
              {newUserRole === 'Ambulance Operator' && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Siren className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ambulance Driver & Fleet Specs</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Assigned Vehicle Number</label>
                      <input
                        type="text"
                        value={newUserVehicleNumber}
                        onChange={e => setNewUserVehicleNumber(e.target.value)}
                        placeholder="MH-04-AZ-1024"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">EMT Certification Tier</label>
                      <select
                        value={newUserEmtLevel}
                        onChange={e => setNewUserEmtLevel(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option>Advanced Life Support (ALS) Paramedic</option>
                        <option>Intermediate</option>
                        <option>Basic (BLS)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Base Station</label>
                    <input
                      type="text"
                      value={newUserBaseStation}
                      onChange={e => setNewUserBaseStation(e.target.value)}
                      placeholder="Mira Road Station Plaza Hub"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ROLE SPECIFIC FIELDS: Healthcare Coordinator */}
              {newUserRole === 'Healthcare Coordinator' && (
                <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Hospital Affiliation & Ward Credentials</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Affiliated Hospital Center</label>
                      <select
                        value={newUserHospitalName}
                        onChange={e => setNewUserHospitalName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        {hospitals.map(h => (
                          <option key={h.id} value={h.name}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Clinical Department</label>
                      <input
                        type="text"
                        value={newUserDepartment}
                        onChange={e => setNewUserDepartment(e.target.value)}
                        placeholder="Emergency Medicine & Trauma ICU"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Staff / Council Registration ID</label>
                      <input
                        type="text"
                        value={newUserStaffId}
                        onChange={e => setNewUserStaffId(e.target.value)}
                        placeholder="HOSP-STAFF-108"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Hotline Extension</label>
                      <input
                        type="text"
                        value={newUserExtension}
                        onChange={e => setNewUserExtension(e.target.value)}
                        placeholder="EXT-108"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ROLE SPECIFIC FIELDS: Emergency Coordinator */}
              {newUserRole === 'Emergency Coordinator' && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>CAD Control Room Workstation Credentials</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CAD Operator Code</label>
                      <input
                        type="text"
                        value={newUserOperatorCode}
                        onChange={e => setNewUserOperatorCode(e.target.value)}
                        placeholder="CAD-4011"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Terminal Workstation</label>
                      <input
                        type="text"
                        value={newUserTerminalNumber}
                        onChange={e => setNewUserTerminalNumber(e.target.value)}
                        placeholder="TERMINAL-CAD-01"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Radio Frequency Channel</label>
                      <input
                        type="text"
                        value={newUserRadioChannel}
                        onChange={e => setNewUserRadioChannel(e.target.value)}
                        placeholder="EMS-154.25 MHz"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CAD Shift Assignment</label>
                      <select
                        value={newUserCadShift}
                        onChange={e => setNewUserCadShift(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option>Morning (06:00 - 14:00)</option>
                        <option>Evening (14:00 - 22:00)</option>
                        <option>Night Watch (22:00 - 06:00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ROLE SPECIFIC FIELDS: Platform Administrator */}
              {newUserRole === 'Platform Administrator' && (
                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>Administrator Clearance & Master Key</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Clearance Level</label>
                      <select
                        value={newUserClearanceLevel}
                        onChange={e => setNewUserClearanceLevel(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option>Super Admin</option>
                        <option>Fleet Manager</option>
                        <option>System Auditor</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Master Security Access Key</label>
                      <input
                        type="text"
                        value={newUserAdminSecretKey}
                        onChange={e => setNewUserAdminSecretKey(e.target.value)}
                        placeholder="EMS-ROOT-2025"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newUserName.trim() || !newUserEmail.trim() || newUserPhone.length !== 10}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Save to SQLite Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT USER (DOMAIN FIELDS)                                     */}
      {/* ==================================================================== */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-splash-in max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Edit System User</h4>
                  <p className="text-[11px] text-slate-500">Update record in persistent SQLite store</p>
                </div>
              </div>
              <button onClick={() => setShowEditUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">User Role Category</label>
                <select
                  value={editUserRole}
                  onChange={e => setEditUserRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Citizen">Citizen (SOS reporting, medical history & emergency contact)</option>
                  <option value="Ambulance Operator">Ambulance Operator (Paramedic driver, vehicle plate & ALS/BLS)</option>
                  <option value="Healthcare Coordinator">Healthcare Coordinator (Hospital clinician, ICU triage & staff ID)</option>
                  <option value="Emergency Coordinator">Emergency Coordinator (CAD operator, terminal & radio channel)</option>
                  <option value="Platform Administrator">Platform Administrator (Master clearance key & system owner)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={e => setEditUserName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={e => setEditUserEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{editUserPhone.length}/10 digits</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    value={editUserPhone}
                    onChange={e => handlePhoneInputChange(e.target.value, setEditUserPhone, setEditPhoneError)}
                    onKeyDown={handlePhoneKeyDown}
                    className={`w-full border rounded-xl pl-12 pr-3 py-2.5 text-xs font-mono tracking-wider focus:outline-none focus:ring-2 ${
                      editPhoneError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {editPhoneError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{editPhoneError}</p>
                )}
              </div>

              {/* Edit Role Specific Fields */}
              {editUserRole === 'Citizen' && (
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                      <select
                        value={editUserBloodType}
                        onChange={e => setEditUserBloodType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option>O Positive (O+)</option>
                        <option>O Negative (O-)</option>
                        <option>A Positive (A+)</option>
                        <option>A Negative (A-)</option>
                        <option>B Positive (B+)</option>
                        <option>B Negative (B-)</option>
                        <option>AB Positive (AB+)</option>
                        <option>AB Negative (AB-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Address / Sector</label>
                      <input
                        type="text"
                        value={editUserAddress}
                        onChange={e => setEditUserAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Medical Notes / Allergies</label>
                    <input
                      type="text"
                      value={editUserMedicalNotes}
                      onChange={e => setEditUserMedicalNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {editUserRole === 'Ambulance Operator' && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Assigned Vehicle</label>
                      <input
                        type="text"
                        value={editUserVehicleNumber}
                        onChange={e => setEditUserVehicleNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Station Base</label>
                      <input
                        type="text"
                        value={editUserBaseStation}
                        onChange={e => setEditUserBaseStation(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editUserRole === 'Healthcare Coordinator' && (
                <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Hospital Name</label>
                      <input
                        type="text"
                        value={editUserHospitalName}
                        onChange={e => setEditUserHospitalName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={editUserDepartment}
                        onChange={e => setEditUserDepartment(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editUserRole === 'Emergency Coordinator' && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CAD Code</label>
                      <input
                        type="text"
                        value={editUserOperatorCode}
                        onChange={e => setEditUserOperatorCode(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Terminal</label>
                      <input
                        type="text"
                        value={editUserTerminalNumber}
                        onChange={e => setEditUserTerminalNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editUserRole === 'Platform Administrator' && (
                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Master Clearance Key</label>
                    <input
                      type="text"
                      value={editUserAdminSecretKey}
                      onChange={e => setEditUserAdminSecretKey(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD AMBULANCE                                                 */}
      {/* ==================================================================== */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-splash-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-sm text-slate-900">Register New Ambulance</h4>
              <button onClick={() => setShowAmbulanceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAmbulance} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Plate</label>
                  <input
                    type="text"
                    required
                    value={newPlate}
                    onChange={e => setNewPlate(e.target.value)}
                    placeholder="MH-04-XX-1234"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Equipment Tier</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Advanced Life Support">Advanced Life Support (ALS)</option>
                    <option value="Basic">Basic Life Support (BLS)</option>
                    <option value="Neonatal / Pediatric ALS">Neonatal / Pediatric ALS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Driver Name</label>
                <input
                  type="text"
                  required
                  value={newDriver}
                  onChange={e => setNewDriver(e.target.value)}
                  placeholder="e.g. Rajesh Shinde"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Driver Contact Phone</label>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                      newContact.length === 10
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : newContact.length > 0
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {newContact.length === 10 ? '✓ 10 Digits Valid' : `${newContact.length}/10 digits`}
                  </span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={newContact}
                  onChange={e => handlePhoneInputChange(e.target.value, setNewContact, setAmbulanceContactError)}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="e.g. 9820112345 (10 digits)"
                  className={`w-full border rounded-lg p-2 text-xs font-mono tracking-wider focus:outline-none focus:ring-2 ${
                    ambulanceContactError
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                      : newContact.length === 10
                      ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/10'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
                {ambulanceContactError ? (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {ambulanceContactError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Whole numbers only (0-9), exactly 10 digits.
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Base Station / Landmark</label>
                <input
                  type="text"
                  value={newLandmark}
                  onChange={e => setNewLandmark(e.target.value)}
                  placeholder="e.g. Beverly Park Station"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAmbulanceModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD HOSPITAL                                                  */}
      {/* ==================================================================== */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-splash-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-sm text-slate-900">Add Partner Medical Center</h4>
              <button onClick={() => setShowHospitalModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={newHospName}
                  onChange={e => setNewHospName(e.target.value)}
                  placeholder="e.g. Apex Multispeciality Hospital"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Address</label>
                <input
                  type="text"
                  value={newHospAddress}
                  onChange={e => setNewHospAddress(e.target.value)}
                  placeholder="Kanakia Road, Mira Road East, Thane"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Hotline</label>
                  <input
                    type="text"
                    value={newHospHotline}
                    onChange={e => setNewHospHotline(e.target.value)}
                    placeholder="022-28110000"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ICU Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={newHospBeds}
                    onChange={e => setNewHospBeds(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="traumaCheck"
                  checked={newHospTrauma}
                  onChange={e => setNewHospTrauma(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="traumaCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Equipped with Level-1 Trauma Emergency Ward
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHospitalModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
