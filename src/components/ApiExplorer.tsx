import React, { useState } from 'react';
import { Send, Copy, Check, Terminal, Play, RotateCw } from 'lucide-react';

export const ApiExplorer: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<'all' | 'available' | 'single' | 'dispatch' | 'hospitals' | 'toggle'>('all');
  const [responseJson, setResponseJson] = useState<string>('// Click "Execute API Call" above to test the live backend route...');
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    {
      id: 'all',
      name: 'Get All Ambulances',
      method: 'GET',
      url: '/api/ambulances',
      description: 'Fetches complete fleet stationed in Mira Road area'
    },
    {
      id: 'available',
      name: 'Filter Available Only',
      method: 'GET',
      url: '/api/ambulances?status=available',
      description: 'Filters only ambulances ready for emergency dispatch'
    },
    {
      id: 'single',
      name: 'Get Ambulance by ID',
      method: 'GET',
      url: '/api/ambulances/AMB-001',
      description: 'Fetches details of vehicle MH-04-AZ-1024'
    },
    {
      id: 'dispatch',
      name: 'Nearest Dispatch Algorithm',
      method: 'POST',
      url: '/api/ambulances/dispatch',
      description: 'Runs Haversine calculation to locate closest unit to patient'
    },
    {
      id: 'hospitals',
      name: 'List Partner Hospitals',
      method: 'GET',
      url: '/api/hospitals',
      description: 'Returns Bhaktivedanta, Wockhardt, and local trauma centers'
    },
    {
      id: 'toggle',
      name: 'Update Ambulance Status',
      method: 'PATCH',
      url: '/api/ambulances/AMB-003/status',
      description: 'Toggles status between available and busy'
    }
  ];

  const handleExecute = async (endpointId: string = activeEndpoint) => {
    setLoading(true);
    const startTime = performance.now();

    try {
      let res: Response;

      if (endpointId === 'all') {
        res = await fetch('/api/ambulances');
      } else if (endpointId === 'available') {
        res = await fetch('/api/ambulances?status=available');
      } else if (endpointId === 'single') {
        res = await fetch('/api/ambulances/AMB-001');
      } else if (endpointId === 'hospitals') {
        res = await fetch('/api/hospitals');
      } else if (endpointId === 'dispatch') {
        // Sample distress call at Shanti Park, Mira Road
        res = await fetch('/api/ambulances/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: 19.2890,
            longitude: 72.8610,
            patient_name: 'Simulated Victim (Shanti Park)',
            emergency_type: 'Severe Chest Pain (Cardiac)',
            required_type: 'Advanced Life Support'
          })
        });
      } else {
        // toggle AMB-003
        res = await fetch('/api/ambulances/AMB-003/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'busy' })
        });
      }

      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setStatusCode(res.status);

      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setStatusCode(500);
      setResponseJson(JSON.stringify({ error: err.message, note: 'Ensure the backend server is running.' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(responseJson);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentDef = endpoints.find(e => e.id === activeEndpoint)!;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm">Interactive REST API Live Inspector</h3>
            <p className="text-[11px] text-slate-400">
              Live Express endpoint runner for project viva and backend demonstration
            </p>
          </div>
        </div>

        <button
          onClick={() => handleExecute(activeEndpoint)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          Execute API Call
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto p-1.5 gap-1">
        {endpoints.map((ep) => (
          <button
            key={ep.id}
            onClick={() => {
              setActiveEndpoint(ep.id as any);
              handleExecute(ep.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeEndpoint === ep.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                ep.method === 'GET'
                  ? 'bg-blue-100 text-blue-800'
                  : ep.method === 'POST'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {ep.method}
            </span>
            <span>{ep.name}</span>
          </button>
        ))}
      </div>

      {/* Request Bar */}
      <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
            {currentDef.method}
          </span>
          <code className="font-mono text-slate-800 font-semibold">{currentDef.url}</code>
          <span className="text-slate-500 text-[11px] hidden md:inline">({currentDef.description})</span>
        </div>

        {statusCode !== null && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className={`px-2 py-0.5 rounded font-bold ${
              statusCode >= 200 && statusCode < 300
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800'
            }`}>
              HTTP {statusCode}
            </span>
            {responseTime !== null && (
              <span className="text-slate-500">{responseTime}ms</span>
            )}
          </div>
        )}
      </div>

      {/* JSON Viewer */}
      <div className="relative bg-[#0b1320] text-slate-200 p-4 font-mono text-xs overflow-auto max-h-[380px]">
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors flex items-center gap-1 text-[10px]"
          title="Copy JSON Response"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>

        <pre className="text-emerald-400/90 leading-relaxed font-mono">
          {responseJson}
        </pre>
      </div>
    </div>
  );
};
