/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Module: App.tsx (Multi-Role RBAC Routing, Notifications & State Hub)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LifelineLogo } from './components/LifelineLogo';
import { SplashScreen } from './components/SplashScreen';
import { Login } from './components/Login';
import { AdminDash } from './components/AdminDash';
import { DispatcherDash } from './components/DispatcherDash';
import { DriverDash } from './components/DriverDash';
import { PatientDash } from './components/PatientDash';
import { HealthcareCoordinatorDash } from './components/HealthcareCoordinatorDash';
import { Profile } from './components/Profile';
import { ToastNotificationStack } from './components/ToastNotificationStack';
import { CommandPalette } from './components/CommandPalette';
import { FloatingSOSButton } from './components/FloatingSOSButton';
import { UserRole, PRIMARY_ROLES } from './types';
import {
  Shield,
  Radio,
  Siren,
  HeartPulse,
  Building2,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Settings,
  Bell,
  X,
  Volume2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Search,
  Workflow,
  Database,
  Users
} from 'lucide-react';
import { WorkflowArchitectureModal } from './components/WorkflowArchitectureModal';
import { soundManager } from './utils/audioAlert';

function MainApp() {
  const {
    currentUser,
    logout,
    login,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    clearNotifications,
    removeNotification,
    notify,
    users,
    dbConnected,
    dbLastSyncTime
  } = useApp();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  // Global Keyboard Shortcut Handler: Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 1. Authentication Entry Point (Renders Login and fluid SplashScreen shrinking animation)
  if (!currentUser) {
    return (
      <>
        <Login
          onReplayIntro={() => setShowSplash(true)}
          isSplashActive={showSplash}
        />
        {showSplash && (
          <SplashScreen
            onComplete={() => setShowSplash(false)}
            durationMs={1850}
          />
        )}
        <ToastNotificationStack />
      </>
    );
  }

  // Role Metadata for header pills (5 Recommended Professional Roles)
  const roleBadges: Record<UserRole, { label: string; vivaAlias: string; icon: React.ReactNode; color: string }> = {
    'Citizen': {
      label: 'Citizen SOS',
      vivaAlias: 'Patient',
      icon: <HeartPulse className="w-3.5 h-3.5 text-rose-600" />,
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    'Ambulance Operator': {
      label: 'Ambulance Operator',
      vivaAlias: 'Ambulance Driver',
      icon: <Siren className="w-3.5 h-3.5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    'Emergency Coordinator': {
      label: 'Emergency Coordinator',
      vivaAlias: 'Dispatcher ⭐',
      icon: <Radio className="w-3.5 h-3.5 text-blue-600" />,
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    'Healthcare Coordinator': {
      label: 'Healthcare Coordinator',
      vivaAlias: 'Hospital Admin',
      icon: <Building2 className="w-3.5 h-3.5 text-teal-600" />,
      color: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    'Platform Administrator': {
      label: 'Platform Admin',
      vivaAlias: 'System Admin',
      icon: <Shield className="w-3.5 h-3.5 text-purple-600" />,
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    // Backward-compatibility aliases
    Admin: {
      label: 'Platform Admin',
      vivaAlias: 'System Admin',
      icon: <Shield className="w-3.5 h-3.5 text-purple-600" />,
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    Dispatcher: {
      label: 'Emergency Coordinator',
      vivaAlias: 'Dispatcher ⭐',
      icon: <Radio className="w-3.5 h-3.5 text-blue-600" />,
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    Driver: {
      label: 'Ambulance Operator',
      vivaAlias: 'Ambulance Driver',
      icon: <Siren className="w-3.5 h-3.5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    Patient: {
      label: 'Citizen SOS',
      vivaAlias: 'Patient',
      icon: <HeartPulse className="w-3.5 h-3.5 text-rose-600" />,
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    'Ambulance Driver': {
      label: 'Ambulance Operator',
      vivaAlias: 'Ambulance Driver',
      icon: <Siren className="w-3.5 h-3.5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    'Hospital Administrator': {
      label: 'Healthcare Coordinator',
      vivaAlias: 'Hospital Admin',
      icon: <Building2 className="w-3.5 h-3.5 text-teal-600" />,
      color: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    'System Administrator': {
      label: 'Platform Admin',
      vivaAlias: 'System Admin',
      icon: <Shield className="w-3.5 h-3.5 text-purple-600" />,
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  };

  const currentRoleBadge = roleBadges[currentUser.role] || roleBadges['Citizen'];

  // Demo Toast Trigger Helpers
  const handleSimulateEmergencyToast = () => {
    soundManager.playEmergencyAlert();
    notify(
      'emergency',
      'EMERGENCY DISPATCH ASSIGNED',
      'Unit MH-04-AZ-1024 (Ramesh Pawar) dispatched to Shanti Park Sector 5. Priority: Critical Cardiac Distress (ETA ~3 mins).',
      {
        vehicleNumber: 'MH-04-AZ-1024',
        etaMinutes: 3,
        status: 'dispatched'
      }
    );
  };

  const handleSimulateStatusToast = () => {
    soundManager.playStatusBlip();
    notify(
      'status',
      'FLEET STATUS UPDATED',
      'Ambulance MH-04-DT-3341 has returned to base station and marked AVAILABLE.',
      {
        vehicleNumber: 'MH-04-DT-3341',
        status: 'available'
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans selection:bg-rose-500 selection:text-white relative">
      {/* ==================================================================== */}
      {/* PRODUCTION APP NAVIGATION BAR                                        */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Station ID */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="cursor-pointer text-left focus:outline-none"
            >
              <LifelineLogo size="md" />
            </button>
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 font-mono flex items-center gap-1.5">
                <span>EOC-401107</span>
                <span>•</span>
                <Database className="w-3 h-3 text-indigo-600 inline" />
                <span className="text-emerald-700 font-bold">SQLITE DB LIVE ({users.length} USERS)</span>
              </span>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dashboard / Profile View Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentView('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentView === 'profile'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings & Profile</span>
              </button>
            </div>

            {/* Quick Command Palette Button */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Open Command Palette (Ctrl+K or Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Commands</span>
              <kbd className="font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* 5-Role Workflow & Viva Guide Button */}
            <button
              onClick={() => setShowWorkflowModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-blue-800 text-xs font-bold cursor-pointer transition-all shadow-2xs"
              title="View 5-Role Real-Life Workflow & Viva Presentation Architecture"
            >
              <Workflow className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">5 Roles Workflow</span>
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDrawer(!showNotificationDrawer);
                  if (!showNotificationDrawer) {
                    markAllNotificationsRead();
                  }
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                  showNotificationDrawer
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Real-Time Notification History"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {showNotificationDrawer && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-splash-in">
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold">Dispatch Notifications ({notifications.length})</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotificationDrawer(false)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Simulation Bar for Demonstration */}
                  <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-500 font-medium">Test Alerts:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleSimulateEmergencyToast}
                        className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] cursor-pointer"
                      >
                        + Test Emergency
                      </button>
                      <button
                        onClick={handleSimulateStatusToast}
                        className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[10px] cursor-pointer"
                      >
                        + Test Status
                      </button>
                    </div>
                  </div>

                  {/* Notifications Feed */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications in the feed yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-50 flex items-start justify-between gap-2.5 ${
                            n.type === 'emergency' ? 'bg-rose-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="mt-0.5 shrink-0">
                              {n.type === 'emergency' ? (
                                <Siren className="w-4 h-4 text-rose-600" />
                              ) : n.type === 'status' ? (
                                <Radio className="w-4 h-4 text-blue-600" />
                              ) : n.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Info className="w-4 h-4 text-slate-500" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-[11px]">{n.title}</p>
                              <p className="text-slate-600 text-[11px] mt-0.5 leading-snug break-words">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                {n.timestamp}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => removeNotification(n.id)}
                            className="text-slate-300 hover:text-slate-500 p-1 shrink-0 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${currentRoleBadge.color}`}
                title="Switch active role"
              >
                {currentRoleBadge.icon}
                <span>{currentUser.role}</span>
                <span className="text-[10px] text-slate-500 font-normal hidden lg:inline">({currentRoleBadge.vivaAlias})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-splash-in max-h-[85vh] overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 mb-1.5 flex items-center justify-between">
                    <span>Fast Role Switch:</span>
                    <span className="text-blue-600 font-bold">5 Canonical Roles</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {PRIMARY_ROLES.map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          login(role);
                          setShowRoleSwitcher(false);
                          setCurrentView('dashboard');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          currentUser.role === role
                            ? 'bg-blue-50 text-blue-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {roleBadges[role]?.icon}
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{role}</div>
                            <div className="text-[10px] text-blue-600 font-medium">aka {roleBadges[role]?.vivaAlias}</div>
                          </div>
                        </div>
                        {currentUser.role === role && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Registered Users from SQLite Database */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-indigo-600" />
                        <span>Registered Accounts ({users.length})</span>
                      </span>
                      <span className="text-emerald-600 font-mono font-bold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded">● SQLite Live</span>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {users.map(u => {
                        const isCurrent = currentUser.email === u.email;
                        const isAdm = u.role === 'Platform Administrator' || u.role === 'System Administrator' || u.role === 'Admin';
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              login(u.role, u.email, u.name, 'emergency108', isAdm ? 'EMS-ROOT-2025' : undefined);
                              setShowRoleSwitcher(false);
                              setCurrentView('dashboard');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1 rounded bg-indigo-100 text-indigo-700 font-bold">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate font-mono">
                                {u.role} • {u.email}
                              </div>
                            </div>
                            <span className="text-[10px] text-blue-600 font-bold shrink-0">
                              Switch →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowRoleSwitcher(false);
                        setShowWorkflowModal(true);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Workflow className="w-3.5 h-3.5" />
                      <span>Inspect 5-Role Pipeline Architecture</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN CONTENT: ROLE-BASED PROTECTED ROUTING VIEW                      */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {currentView === 'profile' ? (
          <Profile />
        ) : (
          <>
            {(currentUser.role === 'Platform Administrator' || currentUser.role === 'Admin') && <AdminDash />}
            {(currentUser.role === 'Emergency Coordinator' || currentUser.role === 'Dispatcher') && <DispatcherDash />}
            {(currentUser.role === 'Ambulance Operator' || currentUser.role === 'Driver') && <DriverDash />}
            {currentUser.role === 'Healthcare Coordinator' && <HealthcareCoordinatorDash />}
            {(currentUser.role === 'Citizen' || currentUser.role === 'Patient') && <PatientDash />}
          </>
        )}
      </main>

      {/* Global Real-Time Toast Notification Overlay */}
      <ToastNotificationStack />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateToProfile={() => setCurrentView('profile')}
        onNavigateToDashboard={() => setCurrentView('dashboard')}
      />

      {/* Persistent High-Visibility Floating Emergency SOS Beacon */}
      <FloatingSOSButton />

      {/* 5-Role Workflow & Viva Architecture Modal */}
      <WorkflowArchitectureModal
        isOpen={showWorkflowModal}
        onClose={() => setShowWorkflowModal(false)}
      />

      {/* ==================================================================== */}
      {/* PRODUCTION FOOTER                                                    */}
      {/* ==================================================================== */}
      <footer className="bg-white border-t border-slate-200 py-3.5 mt-auto select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <LifelineLogo size="sm" showText={false} />
            <span>
              <strong>Lifeline EMS</strong> • Multi-Role Emergency Ambulance Dispatch & Routing Network
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Mira Road Operations Hub</span>
            <span>•</span>
            <span>24x7 Emergency Helpline 112 / 108</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
