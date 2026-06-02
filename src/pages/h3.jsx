import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Cpu,
  Grid,
  RefreshCw,
  Zap,
  Settings,
  Box,
  Code,
  Thermometer,
  Activity,
  Download,
  CheckCircle,
  AlertTriangle,
  Menu,
  Layers,
  Target,
  MessageSquare,
  ShieldAlert,
  Beaker,
  ChevronLeft,
  ChevronRight,
  MonitorDot
} from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_COMPONENTS = [
  { id: 'MCU', label: 'nRF52840', width: 70, height: 70, type: 'Logic', power: 0.1, x: 250, y: 220, pins: 48 },
  { id: 'PWR', label: 'LiPo-5000', width: 120, height: 180, type: 'Power', power: 2.0, x: 100, y: 220, pins: 2 },
  { id: 'HV', label: 'Mains AC/DC', width: 90, height: 90, type: 'HighVoltage', power: 5.0, x: 480, y: 150, pins: 6 },
  { id: 'SEN', label: 'Bio-AFE', width: 50, height: 50, type: 'Patient', power: 0.05, x: 250, y: 380, pins: 16 },
  { id: 'USB', label: 'USB-C', width: 40, height: 30, type: 'Connector', power: 0.0, x: 40, y: 220, pins: 12, anchored: true }
];

const NETLIST = [
  { from: 'PWR', to: 'MCU', type: 'power', voltage: '3.3V' },
  { from: 'MCU', to: 'SEN', type: 'signal', voltage: '1.8V' },
  { from: 'HV', to: 'PWR', type: 'power', voltage: '12V' },
  { from: 'USB', to: 'PWR', type: 'power', voltage: '5V' },
  { from: 'HV', to: 'MCU', type: 'signal', voltage: 'ISO_DATA' }
];

const AGENT_SWARM_LOGS = [
  { agent: 'Architect', color: 'text-cyan-400', msg: 'Initiating multi-objective optimization for Mass vs. Autonomy.' },
  { agent: 'Hardware', color: 'text-orange-400', msg: 'Proposed: LiPo-8000mAh. Autonomy: 14h, Mass constraint: +2.1kg.' },
  { agent: 'Mechanical', color: 'text-emerald-400', msg: 'ALERT: Total mass exceeds 5.0kg boundary. Enclosure structural yield compromised at current volume.' },
  { agent: 'Hardware', color: 'text-orange-400', msg: 'Recalculating. Downgrading to LiPo-5000mAh. Adjusting thermal draw.' },
  { agent: 'Mechanical', color: 'text-emerald-400', msg: 'Thermal limits acceptable. Mass updated to 4.8kg. Feasible space entered.' },
  { agent: 'Architect', color: 'text-cyan-400', msg: 'Conflict resolved. Optimal design locked at 4.8kg / 11.5h autonomy.' }
];

const MATERIALS = {
  ABS: { name: 'ABS_MEDICAL_GRADE', thick: '2.5mm', yield: '45 MPa', status: 'PASS', color: 'text-cyan-100' },
  TITANIUM: { name: 'TI-6AL-4V_ALLOY', thick: '1.2mm', yield: '880 MPa', status: 'PASS (OPTIMIZED)', color: 'text-purple-300' }
};

// --- HELPER COMPONENTS ---

// Highly styled PCB Component
const PcbComponent = ({ comp, showThermal, isSelected, isRouted }) => {
  const isHV = comp.type === 'HighVoltage';
  const isPower = comp.type === 'Power';
  const isConnector = comp.type === 'Connector';

  return (
    <div
      className={`absolute flex flex-col items-center justify-center rounded-sm transition-all duration-500 cursor-pointer
        ${isRouted ? (isHV ? 'bg-zinc-800' : 'bg-zinc-900') : (isHV ? 'bg-slate-900 border-orange-500' : isPower ? 'bg-slate-800 border-sky-500' : 'bg-[#1e1e1e] border-slate-500')}
        ${isRouted ? 'border-none ring-1 ring-zinc-700 shadow-xl' : 'border-2 shadow-[0_10px_20px_rgba(0,0,0,0.5)]'}
        ${isSelected ? 'ring-2 ring-white scale-105' : ''}
      `}
      style={{
        width: comp.width, height: comp.height,
        left: comp.x, top: comp.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 50 : 10
      }}
    >
      {/* IC Pins (Routed Mode) */}
      {isRouted && !isConnector && (
        <>
          <div className="absolute -left-1 top-1 bottom-1 w-1 flex flex-col justify-between py-1 z-0">
            {Array.from({length: Math.min(comp.pins/4, 8)}).map((_,i) => <div key={i} className="h-1.5 w-2 -ml-1 bg-yellow-600 rounded-sm"></div>)}
          </div>
          <div className="absolute -right-1 top-1 bottom-1 w-1 flex flex-col justify-between py-1 z-0">
            {Array.from({length: Math.min(comp.pins/4, 8)}).map((_,i) => <div key={i} className="h-1.5 w-2 bg-yellow-600 rounded-sm"></div>)}
          </div>
          <div className="absolute -top-1 left-1 right-1 h-1 flex justify-between px-1 z-0">
            {Array.from({length: Math.min(comp.pins/4, 8)}).map((_,i) => <div key={i} className="w-1.5 h-2 -mt-1 bg-yellow-600 rounded-sm"></div>)}
          </div>
          <div className="absolute -bottom-1 left-1 right-1 h-1 flex justify-between px-1 z-0">
            {Array.from({length: Math.min(comp.pins/4, 8)}).map((_,i) => <div key={i} className="w-1.5 h-2 bg-yellow-600 rounded-sm"></div>)}
          </div>
        </>
      )}

      {/* Silkscreen Pin 1 Indicator */}
      {!isConnector && !isPower && <div className={`absolute top-1 left-1 w-1.5 h-1.5 rounded-full ${isRouted ? 'bg-zinc-600' : 'bg-white'}`}></div>}
      
      {/* Fake Pins (Unrouted Mode Left/Right) */}
      {!isRouted && !isConnector && (
        <>
          <div className="absolute -left-2 top-2 bottom-2 w-1.5 flex flex-col justify-between py-1">
            {Array.from({length: Math.min(comp.pins/4, 8)}).map((_,i) => <div key={i} className="h-1 w-full bg-slate-300 rounded-sm shadow-sm"></div>)}
          </div>
          <div className="absolute -right-2 top-2 bottom-2 w-1.5 flex flex-col justify-between py-1">
            {Array.from({length: Math.min(comp.pins/4, 8)}).map((_,i) => <div key={i} className="h-1 w-full bg-slate-300 rounded-sm shadow-sm"></div>)}
          </div>
        </>
      )}

      {/* Component Graphics */}
      {!isRouted && (
        isHV ? <Zap className="w-6 h-6 text-orange-500 mb-1 opacity-80 z-10" /> : 
        isPower ? <Zap className="w-6 h-6 text-sky-400 mb-1 opacity-80 z-10" /> : 
        isConnector ? <div className="w-full h-2 bg-slate-400 absolute left-0 rounded-r-md z-10"></div> :
        <Cpu className="w-6 h-6 text-slate-400 mb-1 z-10" />
      )}
      
      {/* Silkscreen Text */}
      <span className={`text-[10px] font-mono font-bold text-center leading-none px-1 z-10 ${isRouted ? 'text-zinc-500' : 'text-white'}`}>{comp.id}</span>
      {!isRouted && <span className={`text-[8px] font-mono text-slate-400 text-center leading-none mt-1 z-10`}>{comp.label}</span>}
      
      {/* Thermal Hotspot Overlay */}
      {showThermal && (
        <div 
          className="absolute inset-0 rounded-sm flex items-center justify-center pointer-events-none"
          style={{
            background: comp.power > 1.0 ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(239,68,68,0) 70%)' : 
                        comp.power > 0.1 ? 'radial-gradient(circle, rgba(249,115,22,0.6) 0%, rgba(249,115,22,0) 70%)' : 'none',
            transform: 'scale(1.5)',
            zIndex: 40
          }}
        >
          {comp.power > 0.5 && <span className="absolute -top-4 bg-red-600 text-white text-[9px] font-bold px-1.5 rounded border border-white z-50">{comp.power}W</span>}
        </div>
      )}
    </div>
  );
};

// --- MASSIVE SVG CHART COMPONENT ---
const OptimizationChartLarge = () => {
  const points = useMemo(() => {
    return Array.from({ length: 300 }).map(() => {
      const mass = Math.random() * 8 + 1;
      const life = (mass * 1.5) + (Math.random() * 5 - 2.5); 
      const feasible = mass <= 5.0 && life >= 4.0;
      return { x: mass, y: Math.max(0, Math.min(15, life)), feasible };
    });
  }, []);

  const optimal = { x: 4.8, y: 11.5 }; 

  const width = 600;
  const height = 440;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 }; 
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xScale = (val) => margin.left + (val / 10) * plotWidth;
  const yScale = (val) => margin.top + plotHeight - (val / 15) * plotHeight;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center z-10 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Design Space Exploration</h2>
          <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Mass vs. Battery Autonomy</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400"><span className="w-3 h-3 rounded-full bg-slate-200"></span> Infeasible</div>
           <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-500"><span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]"></span> Feasible Space</div>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-white p-0">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
          
          {/* Feasible Background Block */}
          <rect x={xScale(0)} y={yScale(15)} width={xScale(5) - xScale(0)} height={yScale(4) - yScale(15)} fill="#f8fafc" />
          
          {/* Grid Lines */}
          {[0, 2, 4, 6, 8, 10].map(val => (
            <g key={`x-${val}`}>
               <line x1={xScale(val)} y1={yScale(0)} x2={xScale(val)} y2={yScale(15)} stroke="#f1f5f9" strokeWidth="1.5" />
               <text x={xScale(val)} y={yScale(0) + 20} fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">{val}kg</text>
            </g>
          ))}
          
          {[0, 3, 6, 9, 12, 15].map(val => (
            <g key={`y-${val}`}>
               <line x1={xScale(0)} y1={yScale(val)} x2={xScale(10)} y2={yScale(val)} stroke="#f1f5f9" strokeWidth="1.5" />
               <text x={xScale(0) - 10} y={yScale(val) + 4} fill="#94a3b8" fontSize="12" textAnchor="end" fontWeight="bold">{val}h</text>
            </g>
          ))}

          {/* Axes */}
          <line x1={xScale(0)} y1={yScale(0)} x2={xScale(10)} y2={yScale(0)} stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1={xScale(0)} y1={yScale(0)} x2={xScale(0)} y2={yScale(15)} stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

          {/* Titles */}
          <text x={xScale(5)} y={yScale(0) + 50} fill="#1e293b" fontSize="13" textAnchor="middle" fontWeight="900" letterSpacing="1">SYSTEM MASS (kg)</text>
          <text x={xScale(0) - 45} y={yScale(7.5)} fill="#1e293b" fontSize="13" textAnchor="middle" fontWeight="900" letterSpacing="1" transform={`rotate(-90, ${xScale(0) - 45}, ${yScale(7.5)})`}>BATTERY LIFE (h)</text>

          {/* Constraints */}
          <line x1={xScale(5)} y1={yScale(0)} x2={xScale(5)} y2={yScale(15)} stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" />
          <rect x={xScale(5) + 8} y={yScale(14) - 14} width="110" height="24" fill="#fef2f2" rx="4" stroke="#fecaca" strokeWidth="1" />
          <text x={xScale(5) + 16} y={yScale(14) + 2} fill="#ef4444" fontSize="11" fontWeight="bold">Max Mass (5kg)</text>
          
          <line x1={xScale(0)} y1={yScale(4)} x2={xScale(10)} y2={yScale(4)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
          <rect x={xScale(9.5) - 90} y={yScale(4) - 28} width="90" height="24" fill="#fffbeb" rx="4" stroke="#fde68a" strokeWidth="1" />
          <text x={xScale(9.5) - 45} y={yScale(4) - 12} fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">Min Life (4h)</text>

          {/* Scatter Points */}
          {points.map((p, i) => (
            <circle 
              key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={p.feasible ? "5" : "4"} 
              fill={p.feasible ? '#38bdf8' : '#e2e8f0'} opacity={p.feasible ? 0.9 : 0.6} 
              className="transition-all hover:r-6 hover:opacity-100"
            />
          ))}

          {/* Selected Optimal */}
          <circle cx={xScale(optimal.x)} cy={yScale(optimal.y)} r="16" fill="#10b981" opacity="0.25" className="animate-ping" />
          <circle cx={xScale(optimal.x)} cy={yScale(optimal.y)} r="7" fill="#10b981" stroke="white" strokeWidth="2" className="shadow-2xl" />
          
          <path d={`M ${xScale(optimal.x)} ${yScale(optimal.y)} L ${xScale(optimal.x) + 30} ${yScale(optimal.y) - 30}`} stroke="#047857" strokeWidth="1.5" />
          <g transform={`translate(${xScale(optimal.x) + 30}, ${yScale(optimal.y) - 45})`}>
            <rect x="0" y="0" width="120" height="30" fill="#047857" rx="6" />
            <text x="60" y="19" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">Selected Optimal</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function HelixTwinL3() {
  const [activeTab, setActiveTab] = useState('optimization');
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showThermal, setShowThermal] = useState(false);
  const [isRouted, setIsRouted] = useState(false);
  const [mcadMaterial, setMcadMaterial] = useState('ABS');
  
  // Agent Swarm Log state
  const [displayedSwarmLogs, setDisplayedSwarmLogs] = useState([]);
  const swarmEndRef = useRef(null);

  useEffect(() => {
    // Simulate Agent Swarm dialogue on load
    if (activeTab === 'optimization' && displayedSwarmLogs.length === 0) {
      let delay = 0;
      AGENT_SWARM_LOGS.forEach((log, i) => {
        setTimeout(() => {
          setDisplayedSwarmLogs(prev => [...prev, log]);
        }, delay);
        delay += 1200 + (Math.random() * 800);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (swarmEndRef.current) {
      swarmEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedSwarmLogs]);

  const runAutoPlace = () => {
    setIsOptimizing(true);
    setActiveTab('ecad');
    setTimeout(() => {
      setComponents(prev => prev.map(c => c.anchored ? c : {
        ...c,
        x: c.x + (Math.random() - 0.5) * 40,
        y: c.y + (Math.random() - 0.5) * 40
      }));
      setIsOptimizing(false);
    }, 1500);
  };

  const toggleRoute = () => {
    setActiveTab('ecad');
    setIsRouted(!isRouted);
  };

  // The missing tabs added to sidebar
  const domainAgents = [
    { id: 'optimization', label: 'Architect (Optimization)', IconComponent: Target },
    { id: 'ecad', label: 'Hardware (ECAD)', IconComponent: Grid },
    { id: 'mcad', label: 'Mechanical (MCAD)', IconComponent: Box },
    { id: 'firmware', label: 'Firmware (Logic)', IconComponent: Code }
  ];

  return (
    <div className="flex flex-col h-screen bg-white text-slate-800 font-sans overflow-hidden">
      
      {/* TOP HEADER (Dark Theme from Mockup) */}
      <div className="h-14 bg-[#111827] border-t-2 border-cyan-400 flex items-center justify-between px-6 shadow-md z-40 shrink-0">
        {/* Left Side */}
        <div className="flex items-center gap-2 text-white font-bold text-sm cursor-pointer hover:text-cyan-400 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </div>
        
        {/* Center Navigation */}
        <div className="flex items-center bg-[#1e293b] rounded-lg overflow-hidden border border-slate-700 shadow-inner">
          <button className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-3 h-3" /> Prev Layer
          </button>
          <div className="bg-slate-700 px-6 py-1.5 text-xs font-black text-white border-x border-slate-600 shadow-sm">
            L3
          </div>
          <button className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            Next Layer <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        {/* Right Side */}
        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black tracking-widest uppercase">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          Active Session
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR (Controls & Views) */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {/* AGENT DOMAINS (The Missing Tabs) */}
            <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <MonitorDot className="w-3.5 h-3.5" /> Agent Domains
               </h3>
               <div className="space-y-2">
                 {domainAgents.map(tab => (
                    <button
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all border
                        ${activeTab === tab.id 
                          ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                          : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}
                    >
                      <tab.IconComponent className={`w-4 h-4 ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-400'}`} /> 
                      {tab.label}
                    </button>
                 ))}
               </div>
            </div>

            {/* SYNTHESIS CONTROLS */}
            <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Settings className="w-3.5 h-3.5" /> Synthesis Controls
               </h3>
               <div className="space-y-3">
                  <button 
                    onClick={runAutoPlace} disabled={isOptimizing}
                    className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-cyan-400 text-slate-700 p-3 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                     <span className="flex items-center gap-2"><RefreshCw className={`w-4 h-4 text-cyan-500 ${isOptimizing ? 'animate-spin' : ''}`} /> Optimize Layout</span>
                     <span className="text-cyan-600 px-2 py-0.5 rounded text-[9px] border border-cyan-200 bg-cyan-50 shadow-sm">AI Solver</span>
                  </button>
                  
                  <button 
                    onClick={toggleRoute}
                    className={`w-full flex items-center justify-between border p-3 rounded-xl text-xs font-bold transition-all shadow-sm
                      ${isRouted ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400'}`}
                  >
                     <span className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${isRouted ? 'text-white' : 'text-slate-800'}`} /> 
                        {isRouted ? 'Rip-up Traces' : 'Auto-Route Nets'}
                     </span>
                     {isRouted && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                  </button>
               </div>
            </div>

            {/* ANALYSIS OVERLAYS */}
            <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Layers className="w-3.5 h-3.5" /> Analysis Overlays
               </h3>
               <div className="space-y-3">
                  <button 
                    onClick={() => {
                       setShowThermal(!showThermal);
                       setActiveTab('ecad');
                    }}
                    className={`w-full flex items-center gap-2 border p-3 rounded-xl text-xs font-bold transition-all shadow-sm
                      ${showThermal ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                  >
                     <Thermometer className={`w-4 h-4 ${showThermal ? 'text-orange-500' : 'text-slate-800'}`} /> Thermal Heatmap
                  </button>
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm">
                     <span className="flex items-center gap-2 text-slate-700"><AlertTriangle className="w-4 h-4 text-emerald-500" /> DRC Violations</span>
                     <span className="text-white bg-emerald-500 px-2 py-0.5 rounded-full shadow-sm text-[10px]">0</span>
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* MAIN CONTENT AREA (Dot Grid Theme) */}
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative min-w-0 overflow-hidden">
           
           {/* Dot Grid Background */}
           <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>

           {/* CANVAS WORKSPACE */}
           <div className="flex-1 overflow-auto relative flex items-center justify-center p-8 z-10">
              
              {/* --- VIEW 1: OPTIMIZATION CHART + AGENT SWARM --- */}
              {activeTab === 'optimization' && (
                 <div className="w-full max-w-5xl h-[560px] flex gap-6 shrink-0">
                    <div className="flex-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                       <OptimizationChartLarge />
                    </div>
                    
                    {/* AGENT SWARM TERMINAL REFINEMENT */}
                    <div className="w-[340px] bg-[#151b2b] rounded-xl shadow-2xl border border-[#1e293b] flex flex-col overflow-hidden font-mono shrink-0">
                       <div className="bg-[#1e293b] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
                          <span className="text-xs text-white font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /> Agent Swarm Log</span>
                          <div className="flex gap-1.5">
                             <div className="w-2 h-2 rounded-full bg-red-500"></div>
                             <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-[11px] leading-relaxed">
                          {displayedSwarmLogs.map((log, i) => (
                             <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className={`${log.color} font-bold mb-1.5 flex items-center gap-1.5`}>
                                   <ChevronRight className="w-3 h-3" /> {log.agent}_Agent
                                </div>
                                <div className="text-slate-300 pl-4 border-l-2 border-slate-700 ml-1 opacity-90">
                                   {log.msg}
                                </div>
                             </div>
                          ))}
                          <div ref={swarmEndRef} />
                       </div>
                    </div>
                 </div>
              )}

              {/* --- VIEW 2: ECAD (DARK MODE PCB) WITH ROUTING REFINEMENT --- */}
              {activeTab === 'ecad' && (
                 <div className={`relative w-full max-w-4xl h-[560px] rounded-xl shadow-2xl overflow-hidden shrink-0 transition-colors duration-700
                    ${isRouted ? 'bg-[#0a1f12] border-8 border-[#051109]' : 'bg-[#0f172a] border-8 border-slate-800 ring-1 ring-white/10'}`}
                 >
                    {/* Board Texture */}
                    <div className={`absolute inset-0 [background-size:12px_12px] opacity-50 
                       ${isRouted ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)]'}`}>
                    </div>
                    
                    {/* Board Markings */}
                    <div className={`absolute top-4 left-4 text-xs font-mono font-bold tracking-widest border-b pb-1 z-10 transition-colors
                       ${isRouted ? 'text-[#39ff14]/30 border-[#39ff14]/20' : 'text-white/30 border-white/20'}`}>
                       HELIX_MAIN_CONTROLLER_REV_C {isRouted && "(ROUTED)"}
                    </div>
                    
                    {/* ISO Barrier Visual (Safety Requirement) */}
                    <div className={`absolute right-[30%] top-0 bottom-0 w-8 border-l-2 border-r-2 flex flex-col justify-center items-center z-0 overflow-hidden transition-colors duration-700
                       ${isRouted ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/50 bg-red-500/10'}`}>
                       <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${isRouted ? '#f59e0b' : '#ef4444'} 10px, ${isRouted ? '#f59e0b' : '#ef4444'} 20px)` }}></div>
                       <span className={`text-[12px] font-black -rotate-90 whitespace-nowrap tracking-[0.2em] uppercase z-10 px-4 transition-colors
                          ${isRouted ? 'text-amber-600/50 bg-[#0a1f12]' : 'text-red-400 bg-[#0f172a]'}`}>
                          ISO-60601 Isolation Barrier (8mm)
                       </span>
                    </div>

                    {/* Traces */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                       {isRouted && NETLIST.map((net, i) => {
                          const start = components.find(c => c.id === net.from);
                          const end = components.find(c => c.id === net.to);
                          if (!start || !end) return null;
                          
                          // Manhattan routing logic for realistic PCB traces
                          const midX = (start.x + end.x) / 2;
                          const path = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
                          
                          const isPower = net.type === 'power';
                          const color = isPower ? '#d97706' : '#22c55e'; // Copper/Gold for power, Green for signal
                          const isIso = net.voltage === 'ISO_DATA';
                          
                          return (
                             <g key={i}>
                                {/* Trace glow */}
                                <path d={path} fill="none" stroke={color} strokeWidth={isPower ? 6 : 3} opacity="0.15" filter="blur(2px)" />
                                {/* Actual Trace */}
                                <path d={path} fill="none" stroke={color} strokeWidth={isPower ? 3 : 1.5} className="animate-draw" strokeDasharray={isIso ? "4 4" : "none"} />
                                {/* Vias/Pads */}
                                <circle cx={start.x} cy={start.y} r="3" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                                <circle cx={end.x} cy={end.y} r="3" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                             </g>
                          );
                       })}
                    </svg>

                    {/* Components */}
                    {components.map(comp => (
                       <PcbComponent key={comp.id} comp={comp} showThermal={showThermal} isSelected={false} isRouted={isRouted} />
                    ))}
                 </div>
              )}

              {/* --- VIEW 3: MCAD (BLUEPRINT ENCLOSURE) WITH DYNAMIC MATERIAL REFINEMENT --- */}
              {activeTab === 'mcad' && (
                 <div className="relative w-full max-w-4xl h-[560px] bg-[#001f3f] rounded-xl shadow-2xl border-4 border-[#003366] overflow-hidden font-mono text-cyan-200 flex flex-col shrink-0">
                    
                    {/* Dynamic Material Control Bar */}
                    <div className="absolute top-0 left-0 right-0 h-14 border-b border-cyan-800/50 bg-[#001730]/80 backdrop-blur-md z-20 flex items-center justify-between px-6">
                       <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2"><Beaker className="w-4 h-4"/> Material Selection</span>
                       <div className="flex bg-[#000a14] rounded-lg p-1 border border-cyan-900/50">
                          {Object.keys(MATERIALS).map(matKey => (
                             <button 
                                key={matKey}
                                onClick={() => setMcadMaterial(matKey)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mcadMaterial === matKey ? 'bg-cyan-900/50 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-cyan-800 hover:text-cyan-500'}`}
                             >
                                {matKey}
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Blueprint Grid */}
                    <div className="absolute inset-0 top-14 bg-[linear-gradient(rgba(56,189,248,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.15)_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    
                    {/* Isometric Box Drawing */}
                    <div className="absolute inset-0 top-14 flex items-center justify-center pointer-events-none pr-[280px]">
                       <div className="relative w-[500px] h-[400px]">
                           <svg width="500" height="400" viewBox="0 0 500 400" className="opacity-80 transition-all duration-500">
                              {/* Box outline */}
                              <path d="M 250 50 L 450 150 L 450 350 L 250 250 Z" fill="rgba(56,189,248,0.05)" stroke={mcadMaterial === 'TITANIUM' ? '#c084fc' : '#38bdf8'} strokeWidth={mcadMaterial === 'TITANIUM' ? '1' : '2'} />
                              <path d="M 50 150 L 250 50 L 250 250 L 50 350 Z" fill="rgba(56,189,248,0.1)" stroke={mcadMaterial === 'TITANIUM' ? '#c084fc' : '#38bdf8'} strokeWidth={mcadMaterial === 'TITANIUM' ? '1' : '2'} />
                              <path d="M 250 250 L 450 350 L 250 450 L 50 350 Z" fill="none" stroke={mcadMaterial === 'TITANIUM' ? '#c084fc' : '#38bdf8'} strokeWidth={mcadMaterial === 'TITANIUM' ? '1' : '2'} strokeDasharray="5 5" />
                              <path d="M 50 150 L 250 250 L 450 150" fill="none" stroke={mcadMaterial === 'TITANIUM' ? '#c084fc' : '#38bdf8'} strokeWidth={mcadMaterial === 'TITANIUM' ? '1' : '2'} />
                              
                              {/* Ventilation Cutouts */}
                              <path d="M 300 130 L 400 180 L 400 190 L 300 140 Z" fill="none" stroke="#38bdf8" strokeWidth="1" />
                              <path d="M 300 150 L 400 200 L 400 210 L 300 160 Z" fill="none" stroke="#38bdf8" strokeWidth="1" />
                              <path d="M 300 170 L 400 220 L 400 230 L 300 180 Z" fill="none" stroke="#38bdf8" strokeWidth="1" />

                              {/* Dimension Lines */}
                              <line x1="460" y1="150" x2="460" y2="350" stroke="#38bdf8" strokeWidth="1" />
                              <text x="470" y="250" fill="#38bdf8" fontSize="12" className="font-mono">90mm</text>
                              <line x1="250" y1="40" x2="450" y2="140" stroke="#38bdf8" strokeWidth="1" />
                              <text x="350" y="80" fill="#38bdf8" fontSize="12" className="font-mono">120mm</text>
                           </svg>
                           
                           {/* Dynamic Tooltip */}
                           <div className="absolute top-[200px] left-[150px] flex items-center gap-3">
                              <div className="relative flex items-center justify-center pointer-events-auto">
                                 <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping absolute"></div>
                                 <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white relative z-10"></div>
                              </div>
                              <div className="bg-[#001f3f]/90 backdrop-blur border border-cyan-500 p-2.5 rounded-lg text-xs z-10 shadow-[0_0_15px_rgba(6,182,212,0.3)] pointer-events-auto transition-all">
                                 <div className="text-cyan-300 mb-0.5">Wall Thickness ({MATERIALS[mcadMaterial].name}):</div>
                                 <span className={`font-bold tracking-wide ${mcadMaterial === 'TITANIUM' ? 'text-purple-300' : 'text-white'}`}>
                                   {MATERIALS[mcadMaterial].thick} (Yield: {MATERIALS[mcadMaterial].status})
                                 </span>
                              </div>
                           </div>
                       </div>
                    </div>
                    
                    {/* Title Block */}
                    <div className="absolute bottom-6 right-6 border-2 border-cyan-500/30 p-5 bg-[#001730]/90 backdrop-blur-md z-10 min-w-[260px] rounded-xl shadow-2xl">
                       <div className="text-lg font-bold border-b border-cyan-500/30 pb-3 mb-3 tracking-wider text-white">VENTILATOR_ENCLOSURE</div>
                       <div className="text-xs space-y-2 font-mono">
                          <div className="flex justify-between"><span className="text-cyan-500/70">MATL:</span> <span className={`${MATERIALS[mcadMaterial].color} font-bold transition-colors`}>{MATERIALS[mcadMaterial].name}</span></div>
                          <div className="flex justify-between"><span className="text-cyan-500/70">YIELD:</span> <span className="text-cyan-100">{MATERIALS[mcadMaterial].yield}</span></div>
                          <div className="flex justify-between"><span className="text-cyan-500/70">TOL:</span> <span className="text-cyan-100">±0.15mm</span></div>
                          <div className="flex justify-between"><span className="text-cyan-500/70">IP_RATING:</span> <span className="text-cyan-100">IP54</span></div>
                       </div>
                    </div>
                 </div>
              )}

              {/* --- VIEW 4: FIRMWARE (VS CODE STYLE) WITH HAZARD HIGHLIGHTING REFINEMENT --- */}
              {activeTab === 'firmware' && (
                 <div className="w-full max-w-4xl h-[560px] bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden font-mono shrink-0">
                    {/* Fake Window Bar */}
                    <div className="bg-[#2d2d2d] h-10 flex items-center justify-between px-4 border-b border-black">
                       <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                       </div>
                       <div className="text-slate-400 text-xs flex items-center gap-2">
                          <Code className="w-3 h-3" /> src/main_controller.c
                       </div>
                       <div className="text-[9px] text-emerald-400 border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <CheckCircle className="w-3 h-3" /> FORMAL VERIFICATION: PASS
                       </div>
                    </div>
                    
                    {/* Code Editor Area */}
                    <div className="flex-1 flex overflow-auto text-[13px] leading-relaxed relative">
                       {/* Line Numbers */}
                       <div className="w-12 bg-[#1e1e1e] border-r border-slate-800 text-slate-600 text-right pr-3 py-4 select-none flex-shrink-0">
                          {Array.from({length: 27}).map((_, i) => <div key={i}>{i+1}</div>)}
                       </div>
                       
                       {/* Code Content */}
                       <pre className="flex-1 p-4 text-slate-300 overflow-x-hidden relative">
<span className="text-emerald-400 italic">/*</span><br/>
<span className="text-emerald-400 italic"> * Helix-Twin Auto-Generated Firmware HAL</span><br/>
<span className="text-emerald-400 italic"> * Target: Nordic nRF52840 (ARM Cortex-M4)</span><br/>
<span className="text-emerald-400 italic"> * Compliance: IEC 62304 Class B</span><br/>
<span className="text-emerald-400 italic"> */</span><br/>
<br/>
<span className="text-purple-400">#include</span> <span className="text-orange-300">"helix_core.h"</span><br/>
<span className="text-purple-400">#include</span> <span className="text-orange-300">"safety_logic.h"</span><br/>
<br/>
<span className="text-emerald-400 italic">// Constraints injected directly from Layer 1 Intent</span><br/>
<span className="text-purple-400">#define</span> <span className="text-sky-300">MAX_PRESSURE_CMH2O</span>  <span className="text-yellow-200">40.0</span><br/>
<span className="text-purple-400">#define</span> <span className="text-sky-300">WATCHDOG_TIMEOUT_MS</span> <span className="text-yellow-200">100</span><br/>
<br/>
<span className="text-sky-400">void</span> <span className="text-yellow-100">main</span>(<span className="text-sky-400">void</span>) {'{\n'}
{'    '}sys_clock_init();<br/>
{'    '}gpio_init(VALVE_PIN, GPIO_OUT);<br/>
{'    '}adc_init(SENSOR_PIN);<br/>
<br/>
{'    '}<span className="text-emerald-400 italic">// Main Control Loop (RTOS Task)</span><br/>
{'    '}<span className="text-purple-400">while</span> (<span className="text-yellow-200">1</span>) {'{\n'}
{'        '}<span className="text-sky-400">float</span> pressure = read_sensor();<br/>
<br/>
{/* DYNAMIC HAZARD HIGHLIGHT BLOCK */}
<div className="relative border-l-4 border-amber-500 bg-amber-500/10 -ml-4 pl-4 py-1.5 my-1 group w-full max-w-2xl rounded-r-md cursor-help">
{'        '}<span className="text-emerald-400 italic font-bold text-amber-300">// Critical Safety Override (ISO 14971)</span><br/>
{'        '}<span className="text-purple-400">if</span> (pressure {'>'} MAX_PRESSURE_CMH2O) {'{\n'}
{'            '}gpio_set(VALVE_PIN, HIGH); <span className="text-emerald-400 italic">// OPEN RELIEF VALVE</span><br/>
{'            '}log_event(EVT_OVERPRESSURE);<br/>
{'        }'}
    {/* Tooltip that appears continuously to show the connection to Layer 2 */}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 border border-amber-500/50 text-amber-200 p-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-start gap-3 w-64 z-20 animate-pulse-slow">
      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="text-[10px] font-sans leading-tight whitespace-normal">
        <strong className="text-amber-400 block text-[11px] mb-1">GraphRAG Compliance Link</strong>
        This block was auto-injected by the Firmware Agent to mitigate the <span className="font-mono bg-amber-500/20 px-1 rounded text-amber-300">OVERPRESSURE</span> hazard identified in Layer 2.
      </div>
    </div>
</div>
{'        '}<span className="text-purple-400">else</span> {'{\n'}
{'            '}run_pid_loop(pressure);<br/>
{'        }'}<br/>
{'        '}os_delay(<span className="text-yellow-200">10</span>);<br/>
{'    }'}<br/>
{'}'}
                       </pre>
                    </div>
                 </div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
}
