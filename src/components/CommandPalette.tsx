/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: CommandPalette.tsx (Global Command Hub via Ctrl+K / Cmd+K)
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Search,
  Siren,
  Shield,
  Radio,
  HeartPulse,
  Building2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  X,
  CornerDownLeft,
  Flame,
  ArrowRight,
  Terminal,
  Activity
} from 'lucide-react';
import { soundManager } from '../utils/audioAlert';

interface CommandItem {
  id: string;
  category: 'Emergency Actions' | 'Role Navigation' | 'Fleet Operations' | 'System Preferences';
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  badge?: string;
  badgeColor?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
  onNavigateToDashboard: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateToProfile,
  onNavigateToDashboard
}) => {
  const {
    currentUser,
    login,
    ambulances,
    activeMission,
    triggerDispatch,
    toggleAmbulanceStatus,
    completeMission,
    cancelEmergency,
    refreshFleet,
    clearNotifications,
    notify
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Define commands list
  const commands: CommandItem[] = [
    // --- EMERGENCY ACTIONS ---
    {
      id: 'sos-cardiac',
      category: 'Emergency Actions',
      title: 'Trigger Critical SOS: Cardiac / Chest Pain',
      description: 'Dispatches closest available unit to Shanti Park Sector 5',
      icon: <Flame className="w-4 h-4 text-rose-500" />,
      badge: 'PRIORITY 1',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      action: async () => {
        onClose();
        await triggerDispatch(19.2890, 72.8610, 'Severe Chest Pain (Cardiac)', 'Emergency Patient', '9820199000', 'Shanti Park Sector 5');
        onNavigateToDashboard();
      }
    },
    {
      id: 'sos-highway',
      category: 'Emergency Actions',
      title: 'Trigger Critical SOS: Highway Collision',
      description: 'Dispatches unit to Kashimira / Western Express Highway junction',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      badge: 'TRAUMA',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      action: async () => {
        onClose();
        await triggerDispatch(19.2718, 72.8752, 'Multiple Trauma / Highway Collision', 'Highway Victim', '9820188111', 'WE Highway Junction');
        onNavigateToDashboard();
      }
    },
    {
      id: 'sos-station',
      category: 'Emergency Actions',
      title: 'Trigger Urgent SOS: Railway Station Distress',
      description: 'Dispatches unit to Mira Road Railway Station East Hub',
      icon: <Activity className="w-4 h-4 text-rose-500" />,
      badge: 'URGENT',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      action: async () => {
        onClose();
        await triggerDispatch(19.2815, 72.8558, 'Acute Respiratory Distress', 'Station Commuter', '9820177222', 'Mira Road Railway Station');
        onNavigateToDashboard();
      }
    },
    ...(activeMission
      ? [
          {
            id: 'complete-mission',
            category: 'Emergency Actions' as const,
            title: `Complete Active Mission: ${activeMission.id}`,
            description: `Handover patient & set ${activeMission.ambulanceVehicleNumber} back to Available`,
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
            badge: 'MISSION HUD',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            action: async () => {
              onClose();
              await completeMission();
            }
          },
          {
            id: 'cancel-emergency',
            category: 'Emergency Actions' as const,
            title: `Cancel Emergency Call: ${activeMission.id}`,
            description: 'Issue stand-down order to responding units',
            icon: <X className="w-4 h-4 text-red-500" />,
            badge: 'STAND DOWN',
            badgeColor: 'bg-red-100 text-red-800 border-red-200',
            action: async () => {
              onClose();
              await cancelEmergency();
            }
          }
        ]
      : []),

    // --- ROLE NAVIGATION ---
    {
      id: 'role-citizen',
      category: 'Role Navigation',
      title: 'Switch to Citizen View',
      description: '1-Tap panic button and live ambulance ETA tracker',
      icon: <HeartPulse className="w-4 h-4 text-rose-600" />,
      badge: 'CITIZEN',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      action: () => {
        onClose();
        login('Citizen');
        onNavigateToDashboard();
      }
    },
    {
      id: 'role-operator',
      category: 'Role Navigation',
      title: 'Switch to Ambulance Operator Terminal',
      description: 'Navigation HUD, vitals recording, and hospital transit',
      icon: <Siren className="w-4 h-4 text-emerald-600" />,
      badge: 'OPERATOR',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      action: () => {
        onClose();
        login('Ambulance Operator');
        onNavigateToDashboard();
      }
    },
    {
      id: 'role-coordinator',
      category: 'Role Navigation',
      title: 'Switch to Emergency Coordinator Console',
      description: 'Interactive Mira Road GIS radar map & fleet dispatch control',
      icon: <Radio className="w-4 h-4 text-blue-600" />,
      badge: 'COORDINATOR',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      action: () => {
        onClose();
        login('Emergency Coordinator');
        onNavigateToDashboard();
      }
    },
    {
      id: 'role-healthcare',
      category: 'Role Navigation',
      title: 'Switch to Healthcare Coordinator Console',
      description: 'Hospital beds, ICU capacity, doctor assignment & patient handover',
      icon: <Building2 className="w-4 h-4 text-teal-600" />,
      badge: 'HEALTHCARE',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      action: () => {
        onClose();
        login('Healthcare Coordinator');
        onNavigateToDashboard();
      }
    },
    {
      id: 'role-admin',
      category: 'Role Navigation',
      title: 'Switch to Platform Administrator Panel',
      description: 'Full CRUD management for Users, Fleet, Hospitals, and Audit Logs',
      icon: <Shield className="w-4 h-4 text-purple-600" />,
      badge: 'PLATFORM ADMIN',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      action: () => {
        onClose();
        login('Platform Administrator');
        onNavigateToDashboard();
      }
    },
    {
      id: 'nav-profile',
      category: 'Role Navigation',
      title: 'Open Settings & User Profile',
      description: 'Edit personal telemetry credentials, emergency contacts, or vehicle info',
      icon: <Settings className="w-4 h-4 text-slate-600" />,
      shortcut: 'P',
      action: () => {
        onClose();
        onNavigateToProfile();
      }
    },

    // --- FLEET OPERATIONS ---
    ...ambulances.slice(0, 3).map((amb) => ({
      id: `toggle-amb-${amb.id}`,
      category: 'Fleet Operations' as const,
      title: `Toggle Unit ${amb.vehicle_number} (${amb.status.toUpperCase()})`,
      description: `Flip status between Available & Busy • Driver: ${amb.driver_name}`,
      icon: <Siren className={`w-4 h-4 ${amb.status === 'available' ? 'text-emerald-500' : 'text-amber-500'}`} />,
      badge: amb.status.toUpperCase(),
      badgeColor: amb.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
      action: async () => {
        onClose();
        await toggleAmbulanceStatus(amb.id);
      }
    })),
    {
      id: 'refresh-fleet',
      category: 'Fleet Operations',
      title: 'Refresh Fleet Telemetry from Server',
      description: 'Re-sync all 6 stationed units with backend database',
      icon: <RotateCw className="w-4 h-4 text-blue-500" />,
      action: async () => {
        onClose();
        await refreshFleet();
        notify('info', 'TELEMETRY SYNCED', 'Fleet status refreshed from server.');
      }
    },

    // --- SYSTEM PREFERENCES ---
    {
      id: 'toggle-sound',
      category: 'System Preferences',
      title: soundManager.isEnabled() ? 'Mute Alert Chimes' : 'Enable Alert Chimes',
      description: 'Toggle synthesized emergency dispatch sound alerts',
      icon: soundManager.isEnabled() ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />,
      badge: soundManager.isEnabled() ? 'AUDIO ON' : 'MUTED',
      action: () => {
        const next = soundManager.toggleSound();
        notify('info', 'AUDIO PREFERENCE', next ? 'Audio chimes enabled.' : 'Audio chimes muted.');
        onClose();
      }
    },
    {
      id: 'clear-notifications',
      category: 'System Preferences',
      title: 'Clear All Real-Time Notifications',
      description: 'Purge notification history and reset unread counters',
      icon: <X className="w-4 h-4 text-slate-500" />,
      action: () => {
        clearNotifications();
        onClose();
      }
    }
  ];

  // Filter commands by search query
  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Group filtered commands by category
  const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));

  // Keyboard navigation within command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 p-4 select-none animate-splash-in"
      onClick={onClose}
    >
      {/* Palette Container */}
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/80">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, emergency trigger, or role (e.g. SOS, Driver, Admin, Toggle)..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-600 border border-slate-300">
            ESC to close
          </span>
        </div>

        {/* Command Items List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No commands found matching "{query}"</span>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filteredCommands.filter((c) => c.category === category);
              return (
                <div key={category} className="py-2 first:pt-0">
                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {category}
                  </p>
                  <div className="space-y-1 mt-0.5">
                    {categoryItems.map((cmd) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <div
                          key={cmd.id}
                          onClick={() => cmd.action()}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? 'bg-blue-50 text-blue-950 font-semibold ring-1 ring-blue-300'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? 'bg-white text-blue-600 border-blue-200 shadow-xs'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {cmd.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-xs">
                                {cmd.title}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {cmd.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {cmd.badge && (
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                  cmd.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {cmd.badge}
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-mono font-bold text-blue-600 flex items-center gap-1">
                                <span>Execute</span>
                                <CornerDownLeft className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar with Keyboard Cheatsheet */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono shadow-2xs font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono shadow-2xs font-bold">↓</kbd>
              <span className="text-slate-400">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono shadow-2xs font-bold">↵</kbd>
              <span className="text-slate-400">Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono shadow-2xs font-bold">Esc</kbd>
              <span className="text-slate-400">Close</span>
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-400">
            Current Operator: <strong className="text-slate-700">{currentUser?.name || 'Dispatcher'}</strong> ({currentUser?.role})
          </div>
        </div>
      </div>
    </div>
  );
};
