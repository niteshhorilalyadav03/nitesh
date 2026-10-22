/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: Login.tsx (Enterprise Authentication, Logon Form & RBAC Hub)
 * Optimized for: Smartphone, Tablet, and PC Screens
 * ==============================================================================
 */

import React, { useState } from 'react';
import { LifelineLogo } from './LifelineLogo';
import { UserRole, PRIMARY_ROLES, UserProfile } from '../types';
import { useApp, clean10DigitPhone } from '../context/AppContext';
import {
  Shield,
  Radio,
  Siren,
  HeartPulse,
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  AlertCircle,
  KeyRound,
  RotateCw,
  Workflow,
  UserPlus,
  FileText,
  User,
  Phone,
  AlertTriangle,
  BadgeCheck,
  Key,
  Database,
  Users
} from 'lucide-react';
import { WorkflowArchitectureModal } from './WorkflowArchitectureModal';

interface LoginProps {
  onReplayIntro?: () => void;
  isSplashActive?: boolean;
}

// Public registration roles strictly exclude System Administrator
const REGISTRATION_ROLES: { role: UserRole; title: string; vivaAlias: string; icon: React.ReactNode; desc: string }[] = [
  {
    role: 'Citizen',
    title: 'Citizen',
    vivaAlias: 'Patient',
    icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
    desc: 'Public distress reporting, 1-tap SOS and live ambulance ETA'
  },
  {
    role: 'Ambulance Operator',
    title: 'Ambulance Operator',
    vivaAlias: 'Ambulance Driver',
    icon: <Siren className="w-5 h-5 text-emerald-500" />,
    desc: 'Active driver navigation, patient vitals & hospital transit'
  },
  {
    role: 'Emergency Coordinator',
    title: 'Emergency Coordinator',
    vivaAlias: 'Dispatcher',
    icon: <Radio className="w-5 h-5 text-blue-500" />,
    desc: 'Control room CAD operator, triage & automated fleet routing'
  },
  {
    role: 'Healthcare Coordinator',
    title: 'Healthcare Coordinator',
    vivaAlias: 'Hospital Administrator',
    icon: <Building2 className="w-5 h-5 text-teal-500" />,
    desc: 'Hospital trauma center, ICU bed capacity & clinical handover'
  }
];

export const Login: React.FC<LoginProps> = ({ onReplayIntro, isSplashActive = false }) => {
  const { login, registerUser, ambulances, hospitals, users, dbConnected, dbLastSyncTime } = useApp();

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'fastpass'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Emergency Coordinator');
  const [email, setEmail] = useState('coordinator.jason@lifeline-ems.gov.in');
  const [password, setPassword] = useState('emergency108');
  const [adminKey, setAdminKey] = useState('EMS-ROOT-2025');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  // --------------------------------------------------------------------------
  // REGISTRATION / LOGON DETAILS FORM STATE (Excludes System Administrator)
  // --------------------------------------------------------------------------
  const [regRole, setRegRole] = useState<UserRole>('Citizen');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPhoneError, setRegPhoneError] = useState<string | null>(null);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Role-Specific Profile Fields: Citizen
  const [regBloodType, setRegBloodType] = useState('O Positive (O+)');
  const [regEmergencyContactName, setRegEmergencyContactName] = useState('');
  const [regEmergencyContactPhone, setRegEmergencyContactPhone] = useState('');
  const [regEmergencyPhoneError, setRegEmergencyPhoneError] = useState<string | null>(null);
  const [regAllergies, setRegAllergies] = useState('');
  const [regMedicalNotes, setRegMedicalNotes] = useState('');
  const [regAddress, setRegAddress] = useState('Mira Road East, Sector 5');

  // Role-Specific Profile Fields: Ambulance Operator
  const [regLicenseNumber, setRegLicenseNumber] = useState('MH-04-2022-');
  const [regAssignedVehicle, setRegAssignedVehicle] = useState('MH-04-AZ-1024');
  const [regBaseStation, setRegBaseStation] = useState('Mira Road Railway Station Hub');
  const [regEmtLevel, setRegEmtLevel] = useState<'Basic (BLS)' | 'Intermediate' | 'Advanced Life Support (ALS) Paramedic'>('Basic (BLS)');

  // Role-Specific Profile Fields: Emergency Coordinator
  const [regOperatorCode, setRegOperatorCode] = useState('EOC-4011');
  const [regTerminalNumber, setRegTerminalNumber] = useState('TERMINAL-02');
  const [regRadioChannel, setRegRadioChannel] = useState('EMS-FREQ-154.25');
  const [regCadShift, setRegCadShift] = useState<'Morning (06:00 - 14:00)' | 'Evening (14:00 - 22:00)' | 'Night Watch (22:00 - 06:00)'>('Morning (06:00 - 14:00)');

  // Role-Specific Profile Fields: Healthcare Coordinator
  const [regHospitalName, setRegHospitalName] = useState('Bhaktivedanta Hospital & Research Institute');
  const [regDepartment, setRegDepartment] = useState('Emergency Medicine & Trauma ICU');
  const [regStaffId, setRegStaffId] = useState('HOSP-STAFF-108');
  const [regExtension, setRegExtension] = useState('EXT-108');

  // Detailed profile metadata for the 5 Recommended Professional Roles
  const roleProfiles: Record<
    string,
    {
      title: string;
      vivaAlias: string;
      persona: string;
      badgeId: string;
      email: string;
      desc: string;
      icon: React.ReactNode;
      badgeBg: string;
    }
  > = {
    'Citizen': {
      title: 'Citizen',
      vivaAlias: 'Patient',
      persona: 'Meera Sharma',
      badgeId: 'CITIZEN-01',
      email: 'citizen.mira@lifeline.gov.in',
      desc: '1-tap SOS distress trigger, live ambulance tracking & medical profile',
      icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    'Ambulance Operator': {
      title: 'Ambulance Operator',
      vivaAlias: 'Ambulance Driver',
      persona: 'Ramesh Pawar (Crew Leader)',
      badgeId: 'UNIT-1024',
      email: 'operator.ramesh@lifeline-ems.gov.in',
      desc: 'Navigation HUD, vitals recording, live GPS telemetry & hospital handover',
      icon: <Siren className="w-5 h-5 text-emerald-500" />,
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    'Emergency Coordinator': {
      title: 'Emergency Coordinator',
      vivaAlias: 'Dispatcher ⭐',
      persona: 'Officer Jason Fernandes',
      badgeId: 'EOC-CONTROL-04',
      email: 'coordinator.jason@lifeline-ems.gov.in',
      desc: 'Control room operator: triage radar, fleet assignment & hospital coordination',
      icon: <Radio className="w-5 h-5 text-blue-500" />,
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    'Healthcare Coordinator': {
      title: 'Healthcare Coordinator',
      vivaAlias: 'Hospital Administrator',
      persona: 'Dr. Ananya Roy, MD',
      badgeId: 'HOSP-TRAUMA-01',
      email: 'health.ananya@bhaktivedanta-hospital.org',
      desc: 'Hospital operations: ICU & bed management, doctor coordination & clinical handover',
      icon: <Building2 className="w-5 h-5 text-teal-500" />,
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    'Platform Administrator': {
      title: 'Platform Administrator',
      vivaAlias: 'System Administrator',
      persona: 'Sarah Jenkins',
      badgeId: 'ROOT-ADMIN-01',
      email: 'admin.sarah@lifeline-ems.gov.in',
      desc: 'System owner: manage all users, fleet inventory, hospitals & audit reports',
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(roleProfiles[role].email);
    setPassword('emergency108');
    if (role === 'Platform Administrator' || role === 'System Administrator' || role === 'Admin') {
      setAdminKey('EMS-ROOT-2025');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Phone sanitizer helper
  const handlePhoneInput = (
    val: string,
    setter: (v: string) => void,
    errorSetter: (err: string | null) => void
  ) => {
    const wholeNumbersOnly = val.replace(/\D/g, '').slice(0, 10);
    setter(wholeNumbersOnly);
    if (wholeNumbersOnly.length > 0 && wholeNumbersOnly.length < 10) {
      errorSetter('Mobile number must be exactly 10 digits.');
    } else {
      errorSetter(null);
    }
  };

  const handleExecuteLogin = (roleToLogin: UserRole, emailToUse: string, keyToUse?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(roleToLogin, emailToUse, undefined, password, keyToUse || adminKey);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please check credentials.');
      }
    }, 450);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your official email and password key.');
      return;
    }
    if ((selectedRole === 'Platform Administrator' || selectedRole === 'System Administrator') && !adminKey) {
      setErrorMessage('Master System Administrator Clearance Key is required for administrator portal access.');
      return;
    }
    handleExecuteLogin(selectedRole, email, adminKey);
  };

  // --------------------------------------------------------------------------
  // HANDLE REGISTRATION SUBMIT
  // --------------------------------------------------------------------------
  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Validations
    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const cleanPhone = clean10DigitPhone(regPhone);
    if (cleanPhone.length !== 10) {
      setRegPhoneError('Phone number must be exactly 10 digits (whole numbers only).');
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    // Role-specific validations
    if (regRole === 'Citizen' && regEmergencyContactPhone) {
      const cleanEmPhone = clean10DigitPhone(regEmergencyContactPhone);
      if (cleanEmPhone.length > 0 && cleanEmPhone.length !== 10) {
        setRegEmergencyPhoneError('Emergency contact phone must be exactly 10 digits.');
        setErrorMessage('Emergency contact phone must be exactly 10 digits.');
        return;
      }
    }

    // Security check: Never permit System Administrator creation via public form
    if (regRole === 'Platform Administrator' || regRole === 'System Administrator' || regRole === 'Admin') {
      setErrorMessage('Security Violation: System Administrator accounts cannot be created via public registration.');
      return;
    }

    setIsLoading(true);

    const profileData: Omit<UserProfile, 'id' | 'createdAt'> = {
      name: regName.trim(),
      email: regEmail.trim(),
      phone: cleanPhone,
      password: regPassword,
      role: regRole,
      isActive: true,
      // Citizen
      ...(regRole === 'Citizen'
        ? {
            bloodType: regBloodType,
            emergencyContactName: regEmergencyContactName.trim() || 'Primary Emergency Contact',
            emergencyContactPhone: clean10DigitPhone(regEmergencyContactPhone) || cleanPhone,
            allergies: regAllergies.trim() || 'None reported',
            medicalNotes: regMedicalNotes.trim() || 'None reported',
            defaultAddress: regAddress.trim() || 'Mira Road East'
          }
        : {}),
      // Ambulance Operator
      ...(regRole === 'Ambulance Operator'
        ? {
            licenseNumber: regLicenseNumber.trim() || 'MH-04-2022-0012',
            assignedVehicleNumber: regAssignedVehicle || 'MH-04-AZ-1024',
            baseStation: regBaseStation || 'Mira Road Base Hub',
            emtLevel: regEmtLevel,
            shiftStatus: 'on-duty'
          }
        : {}),
      // Emergency Coordinator
      ...(regRole === 'Emergency Coordinator'
        ? {
            operatorCode: regOperatorCode.trim() || 'EOC-4011',
            terminalNumber: regTerminalNumber.trim() || 'TERMINAL-02',
            radioChannel: regRadioChannel.trim() || 'EMS-FREQ-154.25',
            cadShift: regCadShift
          }
        : {}),
      // Healthcare Coordinator
      ...(regRole === 'Healthcare Coordinator'
        ? {
            affiliatedHospitalName: regHospitalName || 'Bhaktivedanta Hospital',
            department: regDepartment.trim() || 'Emergency Medicine',
            staffId: regStaffId.trim() || 'HOSP-STAFF-108',
            emergencyContactExtension: regExtension.trim() || 'EXT-108'
          }
        : {})
    };

    setTimeout(() => {
      const result = registerUser(profileData);
      setIsLoading(false);
      if (result.success) {
        setSuccessMessage(
          `Profile successfully registered for ${regName}! Your account has been saved and stored in the System Administrator registry.`
        );
        // Clean form
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setErrorMessage(result.error || 'Registration failed. Please check your details.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#071322] flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Background GIS Ambient Radial Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* ================================================================= */}
      {/* MAIN CONTAINER CARD: Responsive Dual-Pane Split Layout             */}
      {/* ================================================================= */}
      <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/40 sm:border-slate-200/90 overflow-hidden relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[640px] animate-card-reveal">
        {/* =============================================================== */}
        {/* LEFT / TOP PANE: BRANDING, LOGO & OPERATIONS METRICS             */}
        {/* =============================================================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B1E36] via-[#0D253F] to-[#081729] text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
          {/* Ambient decorative beacon */}
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header where Logo Settles */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div
                id="login-target-logo"
                className={`inline-flex items-center transition-opacity duration-200 ${
                  isSplashActive
                    ? 'opacity-0 pointer-events-none'
                    : 'opacity-100 animate-settle-glow'
                }`}
              >
                <LifelineLogo
                  size="md"
                  variant="dark"
                  showText={true}
                  subtitle="CAD PORTAL"
                />
              </div>

              {/* Status Pill Badge */}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE • 24/7
              </span>
            </div>

            {/* Headline and Description */}
            <div className="pt-1 sm:pt-2">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold block">
                Emergency Medical Services Network
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5 sm:mt-1 leading-snug">
                Smart Ambulance Dispatch & Fleet Telemetry
              </h2>
              <p className="text-xs text-slate-300 mt-1 sm:mt-2 leading-relaxed hidden sm:block">
                Connecting distress calls with automated Haversine shortest-path routing to the nearest life-support ambulance in seconds.
              </p>
            </div>

            {/* Operational Metrics: Mobile Pill Strip */}
            <div className="sm:hidden pt-1">
              <div className="flex items-center justify-between gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-medium text-slate-300">
                <span className="text-emerald-400 font-bold">● {ambulances.length || 6} Fleet Units</span>
                <span>•</span>
                <span className="text-sky-300 font-bold">● {hospitals.length || 3} Hospitals</span>
                <span>•</span>
                <span className="text-yellow-300 font-bold">~3-5m ETA</span>
              </div>
            </div>

            {/* Tablet & Desktop Rich Telemetry Cards */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-2 gap-2 pt-2 sm:pt-3">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Stationed Fleet
                </span>
                <span className="text-lg sm:text-xl font-black text-white font-mono mt-0.5 block">
                  {ambulances.length || 6} Units
                </span>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ALS & BLS Ready
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Hospital Network
                </span>
                <span className="text-lg sm:text-xl font-black text-white font-mono mt-0.5 block">
                  {hospitals.length || 3} Centers
                </span>
                <span className="text-[9px] sm:text-[10px] text-sky-300 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Trauma Ready
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Target Response
                </span>
                <span className="text-lg sm:text-xl font-black text-yellow-300 font-mono mt-0.5 block">
                  ~3-5 Mins
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 block">
                  Haversine Metric
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Geographic Area
                </span>
                <span className="text-sm sm:text-base font-black text-white font-mono mt-0.5 block truncate">
                  Sector 401107
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 block">
                  Mira Road Regional EOC
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Security & Emergency Helpline */}
          <div className="hidden lg:block pt-5 border-t border-slate-800/80 space-y-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-white block text-xs">Immediate Emergency?</span>
                  <span className="text-[10px] text-rose-300">Directly dial 112 or 108 helpline</span>
                </div>
              </div>
              <span className="font-mono font-bold text-xs bg-rose-900 px-2 py-1 rounded text-white border border-rose-700">
                112 / 108
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit SSL Encrypted Gateway</span>
              </span>
              <span>ISO 27001 EMS Spec</span>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* RIGHT / MAIN PANE: AUTHENTICATION FORM & ROLE SELECTION          */}
        {/* =============================================================== */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
          <div>
            {/* Top Bar: Navigation & Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 mb-4 gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {activeTab === 'signin'
                    ? 'Workstation Sign In'
                    : activeTab === 'register'
                    ? 'New User Registration'
                    : 'Fast Pass Demo'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {activeTab === 'signin'
                    ? 'Sign in to access your assigned dispatch workstation'
                    : activeTab === 'register'
                    ? 'Create account and save your profile to the System Administrator registry'
                    : '1-click access to all 5 roles for evaluation & demonstration'}
                </p>
              </div>

              {/* View Switcher: Standard Login vs Register Form vs 1-Click Fast Pass */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-white text-blue-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'register'
                      ? 'bg-white text-blue-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Register Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('fastpass');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'fastpass'
                      ? 'bg-white text-blue-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Fast Pass</span>
                </button>
              </div>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* TAB 1: STANDARD AUTHENTICATION FORM                         */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'signin' && (
              <div className="space-y-4">
                {/* 1. ROLE SELECTOR BUTTONS (5 Roles) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      1. Select Active Role (5 Roles)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowArchitectureModal(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Workflow className="w-3.5 h-3.5" />
                      <span>5-Role Viva Guide</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {(Object.keys(roleProfiles) as UserRole[]).map((role) => {
                      const isSelected = selectedRole === role;
                      const profile = roleProfiles[role];

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role)}
                          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 sm:h-24 ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              {profile.icon}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                              {role}
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold block truncate">
                              aka {profile.vivaAlias}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Role Purpose Summary */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="truncate">
                      <strong>{selectedRole}:</strong> {roleProfiles[selectedRole].desc}
                    </span>
                  </div>
                </div>

                {/* System Administrator High Security Clearance Alert */}
                {(selectedRole === 'Platform Administrator' || selectedRole === 'System Administrator' || selectedRole === 'Admin') && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield className="w-4 h-4 text-purple-700" />
                      <span>RESTRICTED ACCESS: System Administrator Portal</span>
                    </div>
                    <p className="text-[11px] text-purple-700 leading-snug">
                      Authorized government administrator credentials and Master Clearance Key verification required. Normal personnel are restricted.
                    </p>
                  </div>
                )}

                {/* Fast-Fill Chips from Live SQLite Database for Selected Role */}
                {users.filter(u => u.role === selectedRole || (selectedRole === 'Citizen' && u.role === 'Patient') || (selectedRole === 'Ambulance Operator' && u.role === 'Driver') || (selectedRole === 'Healthcare Coordinator' && u.role === 'Hospital Administrator') || ((selectedRole === 'Platform Administrator' || selectedRole === 'System Administrator') && (u.role === 'Platform Administrator' || u.role === 'System Administrator' || u.role === 'Admin'))).length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-indigo-600" />
                      <span>Live Registered {selectedRole}s in Database:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {users
                        .filter(u => u.role === selectedRole || (selectedRole === 'Citizen' && u.role === 'Patient') || (selectedRole === 'Ambulance Operator' && u.role === 'Driver') || (selectedRole === 'Healthcare Coordinator' && u.role === 'Hospital Administrator') || ((selectedRole === 'Platform Administrator' || selectedRole === 'System Administrator') && (u.role === 'Platform Administrator' || u.role === 'System Administrator' || u.role === 'Admin')))
                        .slice(0, 6)
                        .map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setEmail(u.email);
                              setPassword('emergency108');
                              if (selectedRole === 'Platform Administrator' || selectedRole === 'System Administrator') {
                                setAdminKey('EMS-ROOT-2025');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-[10px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs truncate max-w-[190px]"
                            title={`Select ${u.name} (${u.email})`}
                          >
                            👤 {u.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. CREDENTIALS INPUT FORM */}
                <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      2. Operator ID / Registered Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@lifeline-ems.gov.in"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                        3. Password Access Key
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[10px] sm:text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Default: emergency108
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* System Administrator Master Clearance Key field (shown when Platform Admin is selected) */}
                  {(selectedRole === 'Platform Administrator' || selectedRole === 'System Administrator' || selectedRole === 'Admin') && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] sm:text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-purple-600" />
                          <span>4. Master Admin Clearance Key</span>
                        </label>
                        <span className="text-[10px] text-purple-600 font-mono">Default: EMS-ROOT-2025</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type={showAdminKey ? 'text' : 'password'}
                          required
                          value={adminKey}
                          onChange={(e) => setAdminKey(e.target.value)}
                          placeholder="EMS-ROOT-2025"
                          className="w-full bg-purple-50/50 border border-purple-200 text-purple-950 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-xs font-mono font-bold transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminKey(!showAdminKey)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-400 hover:text-purple-600 cursor-pointer"
                        >
                          {showAdminKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Options: Remember Station & Register Link */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Remember workstation</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      New user? Register profile →
                    </button>
                  </div>

                  {/* Submit CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#0D253F] to-[#1E3A8A] hover:from-[#0B1E36] hover:to-[#172554] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-1"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying {selectedRole} Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Terminal as {selectedRole}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* TAB 2: NEW USER REGISTRATION & LOGON DETAILS FORM            */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'register' && (
              <div className="space-y-4 animate-splash-in">
                {/* Security Governance Callout Banner */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Public Profile Enrollment Protocol</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    You can register below as a Citizen, Ambulance Operator, Emergency Coordinator, or Healthcare Coordinator. All saved profiles are securely archived into the System Administrator portal.
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold border-t border-amber-200/60 pt-1 mt-1">
                    🛡️ System Administrator accounts are restricted by government CAD security and can only be provisioned internally by an existing System Administrator.
                  </p>
                </div>

                <form onSubmit={handleRegistrationSubmit} className="space-y-4 text-xs">
                  {/* Step 1: Select User Role (Excludes System Administrator) */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      1. Select Your Role (Except System Administrator)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {REGISTRATION_ROLES.map((r) => {
                        const isSelected = regRole === r.role;
                        return (
                          <button
                            key={r.role}
                            type="button"
                            onClick={() => setRegRole(r.role)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                                {r.icon}
                              </span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block truncate leading-tight">
                                {r.title}
                              </span>
                              <span className="text-[10px] text-blue-600 font-medium block truncate">
                                aka {r.vivaAlias}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Basic Account Details */}
                  <div className="space-y-3 p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Account Login Credentials</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Required</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="user@lifeline.gov.in"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700">
                            10-Digit Mobile Phone *
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">10 digits</span>
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={regPhone}
                          onChange={(e) => handlePhoneInput(e.target.value, setRegPhone, setRegPhoneError)}
                          placeholder="9820123456"
                          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:outline-none ${
                            regPhoneError ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'
                          }`}
                        />
                        {regPhoneError && (
                          <p className="text-[10px] text-red-600 mt-0.5">{regPhoneError}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Password Key (min 6 chars) *
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-3 pr-8 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Dynamic Profile Details based on Role */}
                  <div className="space-y-3 p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{regRole} Role Profile Details</span>
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">Stored in System Admin</span>
                    </div>

                    {/* CITIZEN PROFILE FIELDS */}
                    {regRole === 'Citizen' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Blood Group
                          </label>
                          <select
                            value={regBloodType}
                            onChange={(e) => setRegBloodType(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            value={regEmergencyContactName}
                            onChange={(e) => setRegEmergencyContactName(e.target.value)}
                            placeholder="e.g. Rajesh Sharma (Spouse)"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Emergency Contact Phone (10 digits)
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={regEmergencyContactPhone}
                            onChange={(e) => handlePhoneInput(e.target.value, setRegEmergencyContactPhone, setRegEmergencyPhoneError)}
                            placeholder="9892088770"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                          {regEmergencyPhoneError && (
                            <p className="text-[10px] text-red-600 mt-0.5">{regEmergencyPhoneError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Known Medical Allergies
                          </label>
                          <input
                            type="text"
                            value={regAllergies}
                            onChange={(e) => setRegAllergies(e.target.value)}
                            placeholder="e.g. Penicillin, Sulfa drugs, None"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Residential Address / Sector in Mira Road
                          </label>
                          <input
                            type="text"
                            value={regAddress}
                            onChange={(e) => setRegAddress(e.target.value)}
                            placeholder="e.g. Flat 301, Silver Park, Poonam Sagar, Mira Road"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* AMBULANCE OPERATOR PROFILE FIELDS */}
                    {regRole === 'Ambulance Operator' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Driving / Commercial License Number
                          </label>
                          <input
                            type="text"
                            value={regLicenseNumber}
                            onChange={(e) => setRegLicenseNumber(e.target.value)}
                            placeholder="MH-04-2022-009841"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Assigned Ambulance Unit
                          </label>
                          <select
                            value={regAssignedVehicle}
                            onChange={(e) => setRegAssignedVehicle(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            {ambulances.map((amb) => (
                              <option key={amb.id} value={amb.vehicle_number}>
                                {amb.vehicle_number} — {amb.type} ({amb.base_station})
                              </option>
                            ))}
                            <option value="MH-04-AZ-9999">MH-04-AZ-9999 (New Fleet Enrolment)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            EMT Certification Level
                          </label>
                          <select
                            value={regEmtLevel}
                            onChange={(e) => setRegEmtLevel(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            <option>Basic (BLS)</option>
                            <option>Intermediate</option>
                            <option>Advanced Life Support (ALS) Paramedic</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Primary Base Station
                          </label>
                          <input
                            type="text"
                            value={regBaseStation}
                            onChange={(e) => setRegBaseStation(e.target.value)}
                            placeholder="Mira Road Station Plaza Hub"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* EMERGENCY COORDINATOR PROFILE FIELDS */}
                    {regRole === 'Emergency Coordinator' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            CAD Operator Code
                          </label>
                          <input
                            type="text"
                            value={regOperatorCode}
                            onChange={(e) => setRegOperatorCode(e.target.value)}
                            placeholder="EOC-4011"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Dispatch Terminal Workstation
                          </label>
                          <input
                            type="text"
                            value={regTerminalNumber}
                            onChange={(e) => setRegTerminalNumber(e.target.value)}
                            placeholder="TERMINAL-02"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            CAD Frequency Channel
                          </label>
                          <input
                            type="text"
                            value={regRadioChannel}
                            onChange={(e) => setRegRadioChannel(e.target.value)}
                            placeholder="EMS-FREQ-154.25"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            CAD Shift Assignment
                          </label>
                          <select
                            value={regCadShift}
                            onChange={(e) => setRegCadShift(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            <option>Morning (06:00 - 14:00)</option>
                            <option>Evening (14:00 - 22:00)</option>
                            <option>Night Watch (22:00 - 06:00)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* HEALTHCARE COORDINATOR PROFILE FIELDS */}
                    {regRole === 'Healthcare Coordinator' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Affiliated Hospital Center
                          </label>
                          <select
                            value={regHospitalName}
                            onChange={(e) => setRegHospitalName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            {hospitals.map((hosp) => (
                              <option key={hosp.id} value={hosp.name}>
                                {hosp.name}
                              </option>
                            ))}
                            <option value="Thunga Hospital Mira Road">Thunga Hospital Mira Road</option>
                            <option value="Kanakia Health Hub">Kanakia Health Hub</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Clinical Department
                          </label>
                          <input
                            type="text"
                            value={regDepartment}
                            onChange={(e) => setRegDepartment(e.target.value)}
                            placeholder="Emergency Medicine & Trauma ICU"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Staff / Council Registration ID
                          </label>
                          <input
                            type="text"
                            value={regStaffId}
                            onChange={(e) => setRegStaffId(e.target.value)}
                            placeholder="HOSP-STAFF-108"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            ER Direct Hotline Extension
                          </label>
                          <input
                            type="text"
                            value={regExtension}
                            onChange={(e) => setRegExtension(e.target.value)}
                            placeholder="EXT-108"
                            className="w-full bg-white border border-slate-200 font-mono text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Registration Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Profile to System Administrator Registry...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Create Account & Save Profile into System</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mt-2">
                      <span>Already have an account?</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('signin')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Sign in to terminal →
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* TAB 3: 1-CLICK FAST PASS DEMO SELECTOR CARDS                */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'fastpass' && (
              <div className="space-y-3 animate-splash-in">
                <p className="text-xs text-slate-500">
                  Select any pre-configured persona below to immediately enter their dedicated dashboard with carrying-forward live state:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                  {(Object.keys(roleProfiles) as UserRole[]).map((role) => {
                    const prof = roleProfiles[role];
                    return (
                      <div
                        key={role}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/80 transition-all flex flex-col justify-between gap-2.5 shadow-2xs group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-100/60 transition-colors">
                              {prof.icon}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prof.badgeBg}`}>
                              {role}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{prof.persona}</h4>
                            <span className="text-[11px] font-bold text-blue-600">({prof.vivaAlias})</span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                            {prof.desc}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteLogin(role, prof.email, role === 'Platform Administrator' ? 'EMS-ROOT-2025' : undefined)}
                          className="w-full py-1.5 sm:py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Sign In as {prof.vivaAlias} ({role})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Real-Time SQLite Database Accounts */}
                <div className="mt-5 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>Live SQLite Database Accounts ({users.length})</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Accounts registered from any dashboard persist in SQLite and reflect here in real-time
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold hidden sm:inline">
                      ● SSE Live Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {users.map((u) => {
                      const isAdm = u.role === 'Platform Administrator' || u.role === 'System Administrator' || u.role === 'Admin';
                      const roleColor =
                        u.role === 'Ambulance Operator' || u.role === 'Driver'
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900'
                          : u.role === 'Healthcare Coordinator' || u.role === 'Hospital Administrator'
                          ? 'border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-900'
                          : u.role === 'Citizen' || u.role === 'Patient'
                          ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-900'
                          : isAdm
                          ? 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900'
                          : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900';

                      return (
                        <div
                          key={u.id}
                          className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${roleColor}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 text-xs truncate">{u.name}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-2xs shrink-0">
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                              {u.email}
                            </div>
                            {u.phone && (
                              <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                📞 +91 {u.phone}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExecuteLogin(u.role, u.email, isAdm ? 'EMS-ROOT-2025' : undefined)}
                            className="w-full py-1 bg-white hover:bg-slate-900 hover:text-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <span>1-Click Sign In</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Card Footer with Replay Button & Emergency Helpline on Mobile */}
          <div className="pt-4 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="truncate">Mira Road EOC Hub</span>
              <span className="text-rose-600 font-bold lg:hidden">• SOS 112 / 108</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReplayIntro}
                className="text-slate-500 hover:text-blue-600 cursor-pointer underline flex items-center gap-1"
                title="Replay opening and logo shrinking animation"
              >
                <RotateCw className="w-3 h-3 text-slate-400" />
                <span>Replay Intro</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setShowForgotModal(true)}
                className="text-slate-500 hover:text-blue-600 cursor-pointer underline"
              >
                Access Keys
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Credentials / Access Guide Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-splash-in">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm">Workstation Demo Access Credentials</h4>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs text-slate-600">
              <p className="text-slate-500 text-[11px]">
                Each role in the Emergency Operations Center is pre-configured with standard keys:
              </p>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span>1. Patient (Citizen):</span>
                  <strong className="text-slate-900 truncate ml-2">citizen.mira@lifeline.gov.in</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span>2. Dispatcher (Coord):</span>
                  <strong className="text-slate-900 truncate ml-2">coordinator.jason@lifeline-ems.gov.in</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span>3. Ambulance Driver (Operator):</span>
                  <strong className="text-slate-900 truncate ml-2">operator.ramesh@lifeline-ems.gov.in</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span>4. Hospital Admin (Health):</span>
                  <strong className="text-slate-900 truncate ml-2">health.ananya@bhaktivedanta-hospital.org</strong>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 flex justify-between items-center text-purple-900">
                  <span>5. System Admin (Platform):</span>
                  <strong className="truncate ml-2">admin.sarah@lifeline-ems.gov.in</strong>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
                <div><strong>Standard Password:</strong> <code className="font-bold font-mono">emergency108</code></div>
                <div><strong>System Admin Master Key:</strong> <code className="font-bold font-mono text-purple-700">EMS-ROOT-2025</code></div>
              </div>

              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Role Workflow & Viva Architecture Modal */}
      <WorkflowArchitectureModal
        isOpen={showArchitectureModal}
        onClose={() => setShowArchitectureModal(false)}
      />
    </div>
  );
};
