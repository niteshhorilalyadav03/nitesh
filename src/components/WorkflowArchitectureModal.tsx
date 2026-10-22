/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: WorkflowArchitectureModal.tsx
 * Purpose: Complete 5-Role Real-Life Workflow & Viva Presentation Architecture
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  HeartPulse,
  Radio,
  Siren,
  Building2,
  Shield,
  ArrowDown,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Workflow
} from 'lucide-react';

interface WorkflowArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowStep {
  stepNumber: number;
  roleName: UserRole;
  vivaRole: string;
  who: string;
  icon: React.ReactNode;
  theme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  responsibilities: string[];
  workflowAction: string;
  nextTransition: string;
}

export const WorkflowArchitectureModal: React.FC<WorkflowArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, login } = useApp();
  const [selectedStep, setSelectedStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps: WorkflowStep[] = [
    {
      stepNumber: 1,
      roleName: 'Citizen',
      vivaRole: 'Patient',
      who: 'Anyone requesting urgent emergency help (Citizen / Patient)',
      icon: <HeartPulse className="w-5 h-5 text-rose-600" />,
      theme: {
        bg: 'bg-rose-50/70',
        border: 'border-rose-200',
        text: 'text-rose-800',
        badge: 'bg-rose-100 text-rose-800 border-rose-300'
      },
      responsibilities: [
        '1-tap emergency SOS button',
        'Request ambulance with auto-detected GPS location',
        'Live turn-by-turn tracking of arriving ambulance',
        'Manage medical profile (Blood type, allergies, medical notes)',
        'Emergency contacts alerting',
        'View trip history, payments & feedback rating'
      ],
      workflowAction: 'Triggers immediate distress signal with GPS coordinates & critical medical info',
      nextTransition: 'Distress call immediately queues into CAD radar of Dispatcher'
    },
    {
      stepNumber: 2,
      roleName: 'Emergency Coordinator',
      vivaRole: 'Dispatcher ⭐',
      who: 'Control room operator managing city-wide emergency triage',
      icon: <Radio className="w-5 h-5 text-blue-600" />,
      theme: {
        bg: 'bg-blue-50/70',
        border: 'border-blue-200',
        text: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      responsibilities: [
        'Monitor incoming emergency calls & active SOS distress beacons',
        'Smart CAD algorithm calculates nearest available ambulance',
        'Assign ambulance units & track operations in real-time',
        'Coordinate with destination hospitals regarding bed capacity',
        'Monitor response times (target < 8 mins across Mira Road sectors)',
        'Handle incident escalations & multi-casualty incidents'
      ],
      workflowAction: 'Reviews incident priority and assigns optimal ambulance unit with real-time ETA',
      nextTransition: 'Dispatched alert beams directly to Ambulance Driver Mobile HUD'
    },
    {
      stepNumber: 3,
      roleName: 'Ambulance Operator',
      vivaRole: 'Ambulance Driver',
      who: 'Ambulance driver and on-board emergency medical crew combined',
      icon: <Siren className="w-5 h-5 text-emerald-600" />,
      theme: {
        bg: 'bg-emerald-50/70',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      responsibilities: [
        'Accept emergency dispatch mission with single click',
        'Turn-by-turn navigation HUD to patient pickup address',
        'Input live patient vitals (Heart rate, SpO2, Blood Pressure, GCS)',
        'Live GPS location broadcast at 1-second telemetry intervals',
        'Dynamic rerouting to recommended receiving hospital',
        'Digital clinical handover & trip completion'
      ],
      workflowAction: 'Picks up patient, stabilizes condition, and navigates toward designated emergency hospital',
      nextTransition: 'Sends pre-arrival alert & real-time telemetry to Hospital Administrator'
    },
    {
      stepNumber: 4,
      roleName: 'Healthcare Coordinator',
      vivaRole: 'Hospital Administrator',
      who: 'Emergency department director managing beds, ICU & doctor coordination',
      icon: <Building2 className="w-5 h-5 text-teal-600" />,
      theme: {
        bg: 'bg-teal-50/70',
        border: 'border-teal-200',
        text: 'text-teal-800',
        badge: 'bg-teal-100 text-teal-800 border-teal-300'
      },
      responsibilities: [
        'Live ICU & emergency bed availability controls',
        'Track incoming ambulance arrivals with countdown ETA timers',
        'Manage emergency doctors on duty & shift rosters',
        'Assign emergency trauma physician & resuscitation bay',
        'Update treatment & triage status (Red/Yellow/Green)',
        'Digital patient handover confirmation & bed admission'
      ],
      workflowAction: 'Prepares emergency bay, reserves ICU bed, and receives patient handover from paramedics',
      nextTransition: 'Handover complete; patient admitted into emergency care stream'
    },
    {
      stepNumber: 5,
      roleName: 'Platform Administrator',
      vivaRole: 'System Administrator',
      who: 'System owner monitoring whole platform health & governance',
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      theme: {
        bg: 'bg-purple-50/70',
        border: 'border-purple-200',
        text: 'text-purple-800',
        badge: 'bg-purple-100 text-purple-800 border-purple-300'
      },
      responsibilities: [
        'Manage all 5 system user roles with 10-digit phone verification',
        'Fleet management (Add/edit/remove ambulances, vehicle inspection)',
        'Hospital facility directory & maximum capacity provisioning',
        'City-wide EMS response analytics & dispatch performance metrics',
        'Security & audit logs inspection',
        'System configuration & failover settings'
      ],
      workflowAction: 'Supervises entire system health, maintains operational readiness and compliance',
      nextTransition: 'Continuously active background governance across all 4 operational tiers'
    }
  ];

  const activeStepData = steps[selectedStep - 1];

  const handleFastSwitch = (role: UserRole) => {
    login(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-splash-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  SYSTEM ARCHITECTURE
                </span>
                <span className="text-[10px] text-slate-400 font-medium">5-Role Real-Life Pipeline</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Smart Emergency Ambulance Dispatch & Routing Workflow
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Viva Presentation Recommendation Callout */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 via-indigo-50 to-teal-50 border border-blue-200/80 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Project Viva & Presentation Ready Configuration</span>
            </div>
            <p className="leading-relaxed">
              This system is engineered around the industry-standard 5-user lifecycle. The role name <strong>Dispatcher</strong> directly aligns with the project title (<em>Smart Emergency Ambulance Dispatch and Routing System</em>). Each role combines real-life operational power so no intermediate steps are missing.
            </p>
          </div>

          {/* Interactive Visual Workflow Pipeline (Horizontal on Desktop, Vertical on Mobile) */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Real-Life Emergency Dispatch Sequence
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
              {steps.map((st) => {
                const isSelected = selectedStep === st.stepNumber;
                return (
                  <button
                    key={st.stepNumber}
                    onClick={() => setSelectedStep(st.stepNumber)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? `${st.theme.bg} ${st.theme.border} ring-2 ring-blue-500 shadow-md`
                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs">
                          {st.stepNumber}
                        </span>
                        <span className="p-1 rounded-md bg-white border border-slate-200">
                          {st.icon}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                        {st.vivaRole}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        {st.roleName}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-600 font-bold">
                      <span>View details</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Selected Role Deep-Dive Card */}
          <div className={`p-5 rounded-3xl border ${activeStepData.theme.bg} ${activeStepData.theme.border} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  {activeStepData.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeStepData.theme.badge}`}>
                      STEP {activeStepData.stepNumber} IN PIPELINE
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Primary: {activeStepData.roleName} • Viva: {activeStepData.vivaRole}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {activeStepData.vivaRole} ({activeStepData.roleName})
                  </h4>
                </div>
              </div>

              {/* Fast Jump Button to this role */}
              <button
                onClick={() => handleFastSwitch(activeStepData.roleName)}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>
                  {currentUser?.role === activeStepData.roleName ? 'Currently Active' : `Switch to ${activeStepData.vivaRole}`}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white/80 rounded-2xl p-3 border border-slate-200/60 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Role Definition:</span>
              <p className="text-slate-800 font-medium">{activeStepData.who}</p>
            </div>

            {/* Core Responsibilities Grid */}
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block mb-2 tracking-wider">
                Key Responsibilities in System:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeStepData.responsibilities.map((resp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-xl bg-white/70 border border-slate-200/50 text-xs text-slate-700 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Sequence Handover */}
            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/70 border border-slate-200/50">
                <span className="text-[10px] uppercase font-bold text-blue-600 block mb-0.5">
                  Action Triggered:
                </span>
                <p className="text-slate-800">{activeStepData.workflowAction}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/70 border border-slate-200/50">
                <span className="text-[10px] uppercase font-bold text-teal-600 block mb-0.5">
                  Handover to Next Role:
                </span>
                <p className="text-slate-800">{activeStepData.nextTransition}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Project: Smart Emergency Ambulance Dispatch and Routing System</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
