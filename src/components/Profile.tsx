/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: Profile.tsx (Universal Role-Aware Settings & Profile Component)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Phone,
  Shield,
  Siren,
  HeartPulse,
  Radio,
  Save,
  CheckCircle2,
  Lock,
  Building2,
  AlertCircle
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, updateUserProfile } = useApp();

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No active user session. Please log in.
      </div>
    );
  }

  // Common fields
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState((currentUser.phone || '').replace(/\D/g, '').slice(-10));
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Driver fields
  const [assignedVehicleNumber, setAssignedVehicleNumber] = useState(
    currentUser.assignedVehicleNumber || 'MH-04-AZ-1024'
  );
  const [licenseNumber, setLicenseNumber] = useState(
    currentUser.licenseNumber || 'MH-04-2018-009841'
  );
  const [baseStation, setBaseStation] = useState(
    currentUser.baseStation || 'Mira Road Station Hub'
  );

  // Patient fields
  const [bloodType, setBloodType] = useState(currentUser.bloodType || 'O Positive (O+)');
  const [emergencyContactName, setEmergencyContactName] = useState(
    currentUser.emergencyContactName || 'Family Contact'
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    (currentUser.emergencyContactPhone || '9800099887').replace(/\D/g, '').slice(-10)
  );
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);
  const [allergies, setAllergies] = useState(currentUser.allergies || 'None known');
  const [medicalNotes, setMedicalNotes] = useState(currentUser.medicalNotes || 'None');

  // Dispatcher fields
  const [operatorCode, setOperatorCode] = useState(currentUser.operatorCode || 'EOC-7704');
  const [terminalNumber, setTerminalNumber] = useState(
    currentUser.terminalNumber || 'TERMINAL-04'
  );
  const [radioChannel, setRadioChannel] = useState(
    currentUser.radioChannel || 'EMS-FREQ-154.25'
  );

  // Healthcare fields
  const [department, setDepartment] = useState(currentUser.department || 'Emergency Medicine & Trauma ICU');
  const [hospitalExtension, setHospitalExtension] = useState(currentUser.emergencyContactExtension || 'EXT-108');

  // Admin fields
  const [clearanceLevel, setClearanceLevel] = useState(
    currentUser.clearanceLevel || 'Super Admin'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    setPhoneError(null);
  };

  const handleEmergencyPhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setEmergencyContactPhone(digitsOnly);
    setEmergencyPhoneError(null);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce 10-digit whole numbers
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Official contact phone must be only whole numbers and exactly 10 digits.');
      return;
    }

    const isCitizen = currentUser.role === 'Citizen' || currentUser.role === 'Patient';
    if (isCitizen && emergencyContactPhone && !/^\d{10}$/.test(emergencyContactPhone)) {
      setEmergencyPhoneError('Emergency contact phone must be only whole numbers and exactly 10 digits.');
      return;
    }

    updateUserProfile({
      name,
      email,
      phone,
      ...((currentUser.role === 'Ambulance Operator' || currentUser.role === 'Driver') && {
        assignedVehicleNumber,
        licenseNumber,
        baseStation
      }),
      ...(isCitizen && {
        bloodType,
        emergencyContactName,
        emergencyContactPhone,
        allergies,
        medicalNotes
      }),
      ...((currentUser.role === 'Emergency Coordinator' || currentUser.role === 'Dispatcher') && {
        operatorCode,
        terminalNumber,
        radioChannel
      }),
      ...(currentUser.role === 'Healthcare Coordinator' && {
        department,
        emergencyContactExtension: hospitalExtension
      }),
      ...((currentUser.role === 'Platform Administrator' || currentUser.role === 'Admin') && {
        clearanceLevel
      })
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0D253F] text-white flex items-center justify-center font-bold text-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">{currentUser.name}</h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  currentUser.role === 'Platform Administrator' || currentUser.role === 'Admin'
                    ? 'bg-purple-100 text-purple-800'
                    : currentUser.role === 'Emergency Coordinator' || currentUser.role === 'Dispatcher'
                    ? 'bg-blue-100 text-blue-800'
                    : currentUser.role === 'Ambulance Operator' || currentUser.role === 'Driver'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentUser.role === 'Healthcare Coordinator'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <span className="block font-mono">ID: {currentUser.id}</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile configuration saved and synchronized across all dashboards.</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 text-xs">
        {/* Section 1: General Identity */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-600" />
            General Account Credentials
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Official Contact Phone</label>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                    phone.length === 10
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : phone.length > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {phone.length === 10 ? '✓ 10 Digits Valid' : `${phone.length}/10 digits`}
                </span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                onKeyDown={handlePhoneKeyDown}
                placeholder="e.g. 9820012345 (10 digits)"
                className={`w-full bg-slate-50 border rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 font-mono tracking-wider ${
                  phoneError
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : phone.length === 10
                    ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/10'
                    : 'border-slate-200 focus:ring-blue-500 focus:bg-white'
                }`}
              />
              {phoneError ? (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {phoneError}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Whole numbers only (0-9), exactly 10 digits without symbols.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Registered Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
            />
          </div>
        </div>

        {/* Section 2: Role-Specific Fields */}
        {/* AMBULANCE OPERATOR SPECIFIC FIELDS */}
        {(currentUser.role === 'Ambulance Operator' || currentUser.role === 'Driver') && (
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
              <Siren className="w-3.5 h-3.5 text-emerald-600" />
              Ambulance Operator Operational Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Vehicle Plate</label>
                <input
                  type="text"
                  value={assignedVehicleNumber}
                  onChange={e => setAssignedVehicleNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Commercial Driver License No.</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Base Outpost / Hub</label>
              <input
                type="text"
                value={baseStation}
                onChange={e => setBaseStation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* CITIZEN SPECIFIC FIELDS */}
        {(currentUser.role === 'Citizen' || currentUser.role === 'Patient') && (
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              Critical Medical & Triage Emergency Records
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
                >
                  <option value="O Positive (O+)">O Positive (O+)</option>
                  <option value="O Negative (O-)">O Negative (O-)</option>
                  <option value="A Positive (A+)">A Positive (A+)</option>
                  <option value="A Negative (A-)">A Negative (A-)</option>
                  <option value="B Positive (B+)">B Positive (B+)</option>
                  <option value="B Negative (B-)">B Negative (B-)</option>
                  <option value="AB Positive (AB+)">AB Positive (AB+)</option>
                  <option value="AB Negative (AB-)">AB Negative (AB-)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={e => setEmergencyContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Emergency Contact Phone</label>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                    emergencyContactPhone.length === 10
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : emergencyContactPhone.length > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {emergencyContactPhone.length === 10 ? '✓ 10 Digits Valid' : `${emergencyContactPhone.length}/10 digits`}
                </span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={emergencyContactPhone}
                onChange={e => handleEmergencyPhoneChange(e.target.value)}
                onKeyDown={handlePhoneKeyDown}
                placeholder="e.g. 9892088770 (10 digits)"
                className={`w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono tracking-wider focus:outline-none focus:ring-2 ${
                  emergencyPhoneError
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : emergencyContactPhone.length === 10
                    ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/10'
                    : 'border-slate-200 focus:ring-rose-500'
                }`}
              />
              {emergencyPhoneError ? (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {emergencyPhoneError}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Whole numbers only (0-9), exactly 10 digits without symbols.
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Drug Allergies & Contraindications</label>
              <input
                type="text"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Aspirin, NSAIDs"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Pre-existing Medical History</label>
              <textarea
                rows={2}
                value={medicalNotes}
                onChange={e => setMedicalNotes(e.target.value)}
                placeholder="e.g. Diabetic Type-2, Cardiac Stent placed 2022"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        )}

        {/* EMERGENCY COORDINATOR SPECIFIC FIELDS */}
        {(currentUser.role === 'Emergency Coordinator' || currentUser.role === 'Dispatcher') && (
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-blue-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              Emergency Coordinator Telemetry & Dispatch Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Operator Call-Sign</label>
                <input
                  type="text"
                  value={operatorCode}
                  onChange={e => setOperatorCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Terminal ID</label>
                <input
                  type="text"
                  value={terminalNumber}
                  onChange={e => setTerminalNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Radio Frequency</label>
                <input
                  type="text"
                  value={radioChannel}
                  onChange={e => setRadioChannel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* HEALTHCARE COORDINATOR SPECIFIC FIELDS */}
        {currentUser.role === 'Healthcare Coordinator' && (
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-teal-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              Healthcare Coordination & Hospital Operations Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hotline Extension</label>
                <input
                  type="text"
                  value={hospitalExtension}
                  onChange={e => setHospitalExtension(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM ADMINISTRATOR SPECIFIC FIELDS */}
        {(currentUser.role === 'Platform Administrator' || currentUser.role === 'Admin') && (
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-purple-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              Platform Administrator Security Clearance
            </h4>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold">Clearance Level: {clearanceLevel}</p>
                <p className="text-[11px] text-purple-700">Root authorization to manage all 5 users, fleet data, and API gateways.</p>
              </div>
              <span className="font-mono text-[10px] bg-purple-200 px-2 py-0.5 rounded font-bold">
                ROOT-ACCESS
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
