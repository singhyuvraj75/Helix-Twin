import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, ArrowLeft, Terminal, Database, Cpu, Target, Activity, 
  ShieldCheck, LayoutDashboard, ArrowRight, Activity as Pulse,
  Shield, AlertTriangle, CheckCircle, FileText, Zap, RefreshCw,
  Lock, Network, Menu, Sparkles, Bot, Search, Grid, Thermometer,
  Layers, Wind, Download, Pause, Play, Heart, ShieldAlert,
  ChevronRight, ChevronDown, Clock, Share2, XCircle, Scale,
  Upload
} from 'lucide-react';

// --- SHARED GLOBALS & AI CONFIG ---
const apiKey = ""; 

async function callGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable.";
  } catch (error) {
    return "AI Service Unavailable (Offline Mode).";
  }
}

// --- LAYER 1: SEMANTIC INTENT ---
const HelixTwinL1 = () => (
  <div className="flex flex-col h-full bg-white text-slate-800 p-6 items-center justify-center animate-fade-in">
    <div className="max-w-xl text-center">
      <div className="p-3 bg-sky-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-sm">
        <Terminal className="w-8 h-8 text-sky-500" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-slate-900 tracking-tight">L1: Semantic Intent Engine</h2>
      <p className="text-slate-500 mb-6 text-sm">Decomposing clinical intent into SysML v2 formal constraints.</p>
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left font-mono text-xs shadow-xl relative overflow-hidden">
        <span className="text-purple-400 font-bold italic">requirement</span> <span className="text-sky-400">battery_system</span> {'{'} <br/>
        &nbsp;&nbsp;<span className="text-slate-500">doc</span> = "Extended autonomy required.";<br/>
        &nbsp;&nbsp;<span className="text-emerald-400">constraint</span> = duration {'>='} 4.0h;<br/>
        {'}'}
      </div>
    </div>
  </div>
);

// --- LAYER 2: KNOWLEDGE HELIX ---
const HelixTwinL2 = () => (
  <div className="flex flex-col h-full bg-white p-6 animate-fade-in">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 bg-sky-100 rounded-md"><Database className="w-5 h-5 text-sky-600" /></div>
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">L2: Knowledge Helix (GraphRAG)</h2>
    </div>
    <div className="grid grid-cols-3 gap-4 h-full overflow-hidden">
      <div className="col-span-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
         <Share2 className="w-12 h-12 text-sky-200 animate-pulse mb-2" />
         <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Mapping Graph...</span>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm h-fit">
         <h3 className="font-bold text-emerald-900 mb-1 text-xs uppercase flex items-center gap-2">
           <Shield className="w-3 h-3 text-emerald-600" /> Truth Engine
         </h3>
         <p className="text-[11px] text-emerald-700 leading-relaxed">Cross-referencing component MPNs with ISO 14971.</p>
      </div>
    </div>
  </div>
);

// --- LAYER 3: GENERATIVE DESIGN ---
const HelixTwinL3 = () => {
  const [activeTab, setActiveTab] = useState('ecad');
  return (
    <div className="flex flex-col h-full bg-white animate-fade-in">
      <div className="h-12 border-b border-slate-100 flex items-center px-6 justify-between bg-white/80 backdrop-blur-md z-10">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {['ecad', 'mcad', 'firmware'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-white text-sky-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-2xl h-80 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center p-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
            {activeTab === 'ecad' && <Grid className="w-8 h-8 text-sky-500" />}
            {activeTab === 'mcad' && <Wind className="w-8 h-8 text-orange-500" />}
            {activeTab === 'firmware' && <Code className="w-8 h-8 text-purple-500" />}
          </div>
          <h3 className="text-xl font-black text-slate-900 capitalize mb-2">{activeTab} synthesis</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">Resolving multi-objective topology constraints derived from Layer 1.</p>
        </div>
      </div>
    </div>
  );
};

// --- LAYER 4: CALIBRATION MATRIX ---
const CalibrationChart = ({ theoretical, real, particles, currentStep }) => {
  const width = 600; const height = 240; const padding = 40;
  const xScale = (t) => padding + (t / 100) * (width - 2 * padding);
  const yScale = (v) => height - padding - ((v - 2.5) / (4.5 - 2.5)) * (height - 2 * padding);
  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-2 h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {[2.5, 3.5, 4.5].map(v => <line key={v} x1={padding} y1={yScale(v)} x2={width - padding} y2={yScale(v)} stroke="#fff7ed" strokeWidth="2" />)}
        <polyline points={theoretical.map(d => `${xScale(d.t)},${yScale(d.v)}`).join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
        <polyline points={real.slice(0, currentStep).map(d => `${xScale(d.t)},${yScale(d.v)}`).join(' ')} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        {particles.map((p, i) => <circle key={i} cx={xScale(currentStep)} cy={yScale(p.val)} r={p.weight * 5} fill="#f97316" opacity="0.5" />)}
      </svg>
    </div>
  );
};

const HelixTwinL4 = () => {
  const [step, setStep] = useState(0);
  const [simIndex, setSimIndex] = useState(0);
  const [particles, setParticles] = useState([]);
  const tData = Array.from({length: 101}, (_, t) => ({t, v: 4.2 - (0.05 * t) - 0.1}));
  const rData = Array.from({length: 101}, (_, t) => ({t, v: 4.2 - (0.065 * t) - 0.2 + (Math.random()-0.5)*0.05}));

  const startCal = () => {
    setStep(2); setSimIndex(0);
    setParticles(Array(20).fill(0).map(() => ({ val: 4.0, weight: 1 })));
    const iv = setInterval(() => {
      setSimIndex(c => {
        if (c >= 100) { clearInterval(iv); setStep(3); return c; }
        setParticles(prev => prev.map(p => ({ ...p, val: p.val - 0.06 + (Math.random()-0.5)*0.1, weight: Math.random() })));
        return c + 1;
      });
    }, 50);
  };

  return (
    <div className="flex h-full bg-orange-50/30 font-sans overflow-hidden animate-fade-in">
      <div className="w-64 bg-white border-r border-orange-100 p-5 flex flex-col gap-5 shadow-sm z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-orange-100 rounded-md"><Target className="text-orange-600 w-4 h-4" /></div>
          <h2 className="font-black text-slate-800 uppercase tracking-tight text-[10px]">Calibration Matrix</h2>
        </div>
        <div className={`p-4 rounded-xl border-2 transition-all ${step === 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 opacity-60'}`}>
          <div className="flex items-center gap-2 mb-2">
             <Upload className="w-3 h-3 text-orange-500" />
             <h3 className="text-[10px] font-black text-orange-900 uppercase">1. Ingest</h3>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-bold">Select File...</button>
        </div>
        <div className={`p-4 rounded-xl border-2 transition-all ${step === 1 ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
          <div className="flex items-center gap-2 mb-2">
             <RefreshCw className={`w-3 h-3 text-emerald-600 ${step === 2 ? 'animate-spin' : ''}`} />
             <h3 className="text-[10px] font-black text-emerald-900 uppercase">2. Bayesian</h3>
          </div>
          <button disabled={step !== 1} onClick={startCal} className="w-full py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold disabled:opacity-50">Start Loop</button>
        </div>
        <div className="mt-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
           <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Resistance</div>
           <div className="text-lg font-mono font-bold text-slate-700 flex items-baseline gap-1">
              {(0.1 + (simIndex * 0.0005)).toFixed(3)} <span className="text-[10px] font-sans text-slate-400">Ω</span>
           </div>
        </div>
      </div>
      <div className="flex-1 p-8 flex flex-col bg-white overflow-hidden">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Real-to-Sim Optimization</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] mt-1">Sequential Monte Carlo Sync</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden shadow-inner">
           <CalibrationChart theoretical={tData} real={rData} particles={particles} currentStep={simIndex} />
           {step === 3 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                 <div className="bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 flex flex-col items-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="text-lg font-black text-slate-900">Converged</h3>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- LAYER 5: CO-SIMULATION ---
const HelixTwinL5 = () => (
  <div className="flex flex-col h-full bg-white p-6 items-center justify-center animate-fade-in">
    <Heart className="w-16 h-16 text-rose-500 animate-pulse mb-4" />
    <h2 className="text-xl font-black text-slate-900 tracking-tight">Layer 5: Co-Simulation</h2>
    <p className="text-slate-500 text-xs mt-2 text-center max-w-xs">Physics + Firmware + Physiology validation.</p>
  </div>
);

// --- LAYER 6: COMPLIANCE SENTINEL ---
const HelixTwinL6 = () => (
  <div className="flex flex-col h-full bg-white p-8 overflow-y-auto animate-fade-in">
    <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Compliance Sentinel</h2>
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="font-bold text-slate-700 text-sm">Audit Scan #{i}</h4>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase">Verified</span>
        </div>
      ))}
    </div>
  </div>
);

// --- LAYER 7: OMNI-DASHBOARD ---
const AAS_TREE = {
  id: 'ROOT', label: 'Ventilator_Helix_V1', type: 'System', status: 'WARNING', children: [
    { id: 'S1', label: 'Pneumatic_Assembly', type: 'Subsystem', status: 'PASS', children: [
       { id: 'C1', label: 'Turbine_Blower', type: 'Component', status: 'PASS', val: '12.4k RPM' }
    ]},
    { id: 'S2', label: 'Power_Unit', type: 'Subsystem', status: 'WARNING', children: [
       { id: 'C3', label: 'LiPo_Pack', type: 'Component', status: 'WARNING', val: '14.2V' }
    ]}
  ]
};

const TreeItem = ({ node, depth = 0, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedId === node.id;
  return (
    <div className="select-none">
      <div onClick={() => onSelect(node)} className={`flex items-center gap-2 py-1 px-3 cursor-pointer border-l-2 transition-all ${isSelected ? 'bg-sky-50 border-sky-500' : 'border-transparent hover:bg-slate-50'}`} style={{ paddingLeft: `${depth * 14 + 10}px` }}>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className={`p-0.5 rounded text-slate-400 ${!node.children ? 'invisible' : ''}`}>{expanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}</button>
        <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-sky-700' : 'text-slate-600'}`}>{node.label}</span>
      </div>
      {expanded && node.children && node.children.map(child => <TreeItem key={child.id} node={child} depth={depth+1} onSelect={onSelect} selectedId={selectedId} />)}
    </div>
  );
};

const HelixTwinL7 = () => {
  const [selected, setSelected] = useState(AAS_TREE);
  const [playback, setPlayback] = useState(60);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    let iv; if(playing) iv = setInterval(() => setPlayback(p => p >= 60 ? 0 : p + 0.1), 100);
    return () => clearInterval(iv);
  }, [playing]);

  return (
    <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden">
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-purple-600" />
          <h2 className="font-black text-slate-800 text-xs uppercase tracking-tight">Omni-Dashboard</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2"><TreeItem node={AAS_TREE} onSelect={setSelected} selectedId={selected.id} /></div>
      </div>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="h-12 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between z-10 sticky top-0">
           <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-purple-400" /> AAS View: <span className="text-sky-600 font-black">{selected.label}</span></h2>
           <button className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 shadow-sm">Digital Thread</button>
        </div>
        <div className="flex-1 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center p-8">
          <div className="relative w-72 h-72 border-2 border-white rounded-full bg-white shadow-xl flex items-center justify-center animate-float">
              {selected.label.includes('Battery') ? <Zap className="w-16 h-16 text-orange-400" /> : <Activity className="w-16 h-16 text-emerald-500" />}
          </div>
        </div>
        <div className="h-28 bg-white border-t border-slate-200 p-4 flex flex-col shadow-2xl z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
               <button onClick={() => setPlaying(!playing)} className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${playing ? 'bg-orange-500' : 'bg-sky-500'}`}>{playing ? <Pause className="w-3 h-3" /> : <Play className="ml-1 w-3 h-3" />}</button>
               <div className="text-[10px] font-mono font-black text-sky-600 bg-sky-50 px-2 py-1 rounded">T - {Math.abs(60-playback).toFixed(2)}s</div>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time-Travel Scrubber</span>
          </div>
          <input type="range" min="0" max="60" step="0.1" value={playback} onChange={(e) => { setPlaying(false); setPlayback(parseFloat(e.target.value)); }} className="w-full accent-sky-500 h-1 rounded-full cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const LayerCard = ({ title, desc, icon: Icon, color, onClick }) => (
  <button onClick={onClick} className="group relative flex flex-col items-start p-5 bg-slate-800/60 border border-slate-700/50 rounded-2xl hover:bg-slate-800 hover:border-orange-500/50 transition-all duration-300 text-left w-full h-full shadow-lg backdrop-blur-md">
    <div className={`p-2.5 rounded-xl bg-slate-900/50 border border-slate-700 mb-3 group-hover:scale-110 transition-all ${color}`}><Icon className="w-5 h-5" /></div>
    <h3 className="text-sm font-black text-white mb-1 group-hover:text-orange-400 transition-colors tracking-tight">{title}</h3>
    <p className="text-[11px] text-slate-400 leading-snug mb-4 font-medium h-8 overflow-hidden">{desc}</p>
    <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-slate-500 group-hover:text-orange-400 uppercase tracking-widest transition-all">Launch <ArrowRight className="w-3 h-3 group-hover:translate-x-1" /></div>
  </button>
);

const MainDashboard = ({ onNavigate }) => (
  <div className="h-full bg-[#0f172a] text-slate-200 p-8 pt-4 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-[#0f172a] to-[#0f172a]">
    <div className="max-w-6xl mx-auto mb-8 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-800/30 text-blue-300 text-[9px] font-black tracking-widest mb-4 uppercase"><Pulse className="w-2.5 h-2.5 text-orange-500" /> Helix-Twin Engine</div>
      <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter">Helix<span className="text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-sky-500">Twin</span></h1>
      <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">Autonomous Engineering Lifecycle for <span className="text-white font-bold">Medical Device Design</span>.</p>
    </div>
    <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
      <LayerCard title="L1: Semantic Intent" desc="NLP-to-SysML Requirements mapping." icon={Terminal} color="text-purple-400" onClick={() => onNavigate(1)} />
      <LayerCard title="L2: Knowledge Helix" desc="Zero-hallucination GraphRAG selection." icon={Database} color="text-blue-400" onClick={() => onNavigate(2)} />
      <LayerCard title="L3: Generative Design" desc="Autonomous ECAD/MCAD layout synthesis." icon={Cpu} color="text-cyan-400" onClick={() => onNavigate(3)} />
      <LayerCard title="L4: Calibration Matrix" desc="Bayesian physics tuning from real data." icon={Target} color="text-green-400" onClick={() => onNavigate(4)} />
      <LayerCard title="L5: Co-Simulation" desc="Closed-loop physics + firmware validation." icon={Activity} color="text-yellow-400" onClick={() => onNavigate(5)} />
      <LayerCard title="L6: Compliance Sentinel" desc="Automated ISO 14971 risk analysis." icon={ShieldCheck} color="text-red-400" onClick={() => onNavigate(6)} />
      <div className="col-span-2 lg:col-span-3 pt-2">
        <button onClick={() => onNavigate(7)} className="w-full group relative p-6 bg-gradient-to-r from-blue-900/30 to-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-orange-500/50 transition-all duration-500 text-left flex items-center justify-between backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 shadow-lg"><LayoutDashboard className="w-6 h-6 text-orange-400" /></div>
            <div>
              <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-all mb-0.5 tracking-tighter">L7: Omni-Dashboard</h3>
              <p className="text-slate-400 text-xs font-medium opacity-80">Command Center & AAS Time-Travel.</p>
            </div>
          </div>
          <div className="h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-orange-500 transition-all"><ArrowRight className="w-5 h-5 text-white" /></div>
        </button>
      </div>
    </div>
  </div>
);

// --- APP ENTRY POINT ---
export default function App() {
  const [active, setActive] = useState(0);
  const LAYERS = { 1: HelixTwinL1, 2: HelixTwinL2, 3: HelixTwinL3, 4: HelixTwinL4, 5: HelixTwinL5, 6: HelixTwinL6, 7: HelixTwinL7 };
  const ActiveComp = LAYERS[active];

  return (
    <div className="h-screen w-screen bg-[#0f172a] flex flex-col overflow-hidden selection:bg-sky-500 selection:text-white">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f97316; border-radius: 8px; border: 2px solid #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-shimmer { background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; animation: shimmer 2s infinite linear; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
      {active !== 0 && (
        <div className="h-12 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-50">
          <button onClick={() => setActive(0)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-600 transition-all group">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /> Back
          </button>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Digital Twin Active
             </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden relative">
        {active === 0 ? <MainDashboard onNavigate={setActive} /> : <ActiveComp />}
      </div>
    </div>
  );
}
