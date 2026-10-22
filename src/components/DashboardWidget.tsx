/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Component: DashboardWidget.tsx (Dispatch Frequency & Peak Hour Metrics with Recharts)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  Activity,
  Clock,
  TrendingUp,
  Siren,
  Flame,
  AlertTriangle,
  HeartPulse,
  Calendar,
  Layers,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

// Hourly Emergency Dispatch Frequency Dataset (24-Hour Cycle across Sector 401107)
const HOURLY_DISPATCH_DATA = [
  { hour: '00:00', dispatches: 3, avgEta: 4.1, severity: 'Low' },
  { hour: '02:00', dispatches: 2, avgEta: 3.8, severity: 'Low' },
  { hour: '04:00', dispatches: 1, avgEta: 3.5, severity: 'Low' },
  { hour: '06:00', dispatches: 4, avgEta: 3.9, severity: 'Moderate' },
  { hour: '08:00', dispatches: 9, avgEta: 4.5, severity: 'High' },
  { hour: '09:00', dispatches: 12, avgEta: 4.8, severity: 'Peak Surge' },
  { hour: '10:00', dispatches: 11, avgEta: 4.6, severity: 'Peak Surge' },
  { hour: '12:00', dispatches: 7, avgEta: 4.2, severity: 'Moderate' },
  { hour: '14:00', dispatches: 6, avgEta: 4.0, severity: 'Moderate' },
  { hour: '16:00', dispatches: 8, avgEta: 4.3, severity: 'Moderate' },
  { hour: '18:00', dispatches: 13, avgEta: 5.1, severity: 'Peak Surge' },
  { hour: '19:00', dispatches: 16, avgEta: 5.4, severity: 'Critical Peak' },
  { hour: '20:00', dispatches: 15, avgEta: 5.2, severity: 'Critical Peak' },
  { hour: '21:00', dispatches: 12, avgEta: 4.9, severity: 'Peak Surge' },
  { hour: '22:00', dispatches: 8, avgEta: 4.4, severity: 'Moderate' },
  { hour: '23:00', dispatches: 5, avgEta: 4.1, severity: 'Low' }
];

// Weekly Trend Dataset (Monday - Sunday)
const WEEKLY_DISPATCH_DATA = [
  { day: 'Mon', dispatches: 38, cardiac: 14, trauma: 12, respiratory: 8, other: 4 },
  { day: 'Tue', dispatches: 34, cardiac: 11, trauma: 10, respiratory: 9, other: 4 },
  { day: 'Wed', dispatches: 41, cardiac: 15, trauma: 13, respiratory: 7, other: 6 },
  { day: 'Thu', dispatches: 39, cardiac: 13, trauma: 12, respiratory: 8, other: 6 },
  { day: 'Fri', dispatches: 48, cardiac: 16, trauma: 18, respiratory: 9, other: 5 },
  { day: 'Sat', dispatches: 56, cardiac: 19, trauma: 22, respiratory: 10, other: 5 },
  { day: 'Sun', dispatches: 52, cardiac: 18, trauma: 20, respiratory: 8, other: 6 }
];

// Emergency Distress Category Breakdown
const EMERGENCY_CATEGORY_DATA = [
  { category: 'Cardiac Arrest', count: 34, percentage: '32%', color: '#ef4444' },
  { category: 'Road Traffic Trauma', count: 29, percentage: '28%', color: '#f97316' },
  { category: 'Respiratory Distress', count: 19, percentage: '18%', color: '#3b82f6' },
  { category: 'Maternity / Pediatric', count: 13, percentage: '12%', color: '#ec4899' },
  { category: 'General Acute Trauma', count: 11, percentage: '10%', color: '#8b5cf6' }
];

export const DashboardWidget: React.FC = () => {
  const { ambulances } = useApp();
  const [activeView, setActiveView] = useState<'hourly' | 'weekly' | 'categories'>('hourly');

  const availableCount = ambulances.filter(a => a.status === 'available').length;

  // Custom Chart Tooltip
  const CustomHourlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B1E36] text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1">
            <span className="font-mono font-bold text-sky-300">{label} Window</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                data.severity.includes('Peak')
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-blue-500/30 text-sky-300 border border-blue-500/50'
              }`}
            >
              {data.severity}
            </span>
          </div>
          <p className="font-extrabold text-white text-sm flex items-center gap-1.5 pt-0.5">
            <Siren className="w-3.5 h-3.5 text-rose-400" />
            <span>{data.dispatches} Emergency Dispatches</span>
          </p>
          <p className="text-[11px] text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span>Mean Response ETA: ~{data.avgEta} mins</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B1E36] text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-sky-300">{data.category}</p>
          <p className="text-white font-extrabold text-sm mt-0.5">
            {data.count} Incident Runs ({data.percentage})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP HEADER & TELEMETRY KPI CARDS                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-slate-900 text-base md:text-lg">
              Dispatch Telemetry & Peak Emergency Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated Recharts telemetry monitoring peak distress hours and ambulance utilization
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveView('hourly')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'hourly'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>Peak Hours (24h)</span>
          </button>

          <button
            onClick={() => setActiveView('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'weekly'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Weekly Volume</span>
          </button>

          <button
            onClick={() => setActiveView('categories')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'categories'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Distress Categories</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Critical Peak Window
          </span>
          <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">
            18:00 - 21:00
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3 text-rose-500" />
            Highway rush traffic surge
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Today's Dispatch Total
          </span>
          <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
            48 Incident Runs
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            100% Units Allocated
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Mean Response Time
          </span>
          <span className="text-lg font-black text-yellow-600 font-mono mt-0.5 block">
            3.8 Mins
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Target SLA: &lt; 5.0 mins
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Ready Fleet Units
          </span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
            {availableCount} / {ambulances.length} Available
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Sector 401107 Stations
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. RECHARTS VISUALIZATION CONTAINER                                */}
      {/* ------------------------------------------------------------------ */}

      {/* VIEW A: HOURLY PEAK EMERGENCY DISPATCH CURVE (AreaChart) */}
      {activeView === 'hourly' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-bold text-slate-800">
                24-Hour Dispatch Frequency Wave & Emergency Surge
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Peak Hours: 09:00 (12 calls) & 19:00 (16 calls)
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_DISPATCH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dispatchGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomHourlyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="dispatches"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dispatchGradient)"
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW B: WEEKLY DISPATCH TREND (BarChart) */}
      {activeView === 'weekly' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="font-bold text-slate-800">
                Weekly Incident Distribution (Mon - Sun)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Weekend Spikes: Sat (56 runs) & Sun (52 runs)
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DISPATCH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0B1E36] text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-sky-300">{label} Daily Breakdown</p>
                          <p className="font-extrabold text-white text-sm">{d.dispatches} Total Dispatches</p>
                          <div className="pt-1 border-t border-slate-700 text-[10px] text-slate-300 space-y-0.5">
                            <p>Cardiac: {d.cardiac} runs</p>
                            <p>Road Trauma: {d.trauma} runs</p>
                            <p>Respiratory: {d.respiratory} runs</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="dispatches" radius={[6, 6, 0, 0]}>
                  {WEEKLY_DISPATCH_DATA.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.dispatches > 45 ? '#ef4444' : '#2563eb'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW C: EMERGENCY CATEGORY DISTRIBUTION (BarChart) */}
      {activeView === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="font-bold text-slate-800">
                Distribution of Incident Distress Types
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Primary: Cardiac Distress (32%) & Road Traffic Trauma (28%)
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={EMERGENCY_CATEGORY_DATA}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  width={130}
                />
                <Tooltip content={<CustomCategoryTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {EMERGENCY_CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cat-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. FOOTER TELEMETRY INSIGHT                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Dispatcher Insight:</strong> Stagger ambulance patrol routes along Western Express Highway during <strong>18:00 - 21:00</strong> to minimize highway response ETA.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Telemetry Sample Size: 312 Runs
        </span>
      </div>
    </div>
  );
};
