import React, { useState, useEffect, useMemo } from 'react';
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
  Wind,
  Menu,
  Terminal,
  MousePointer,
  Save,
  Maximize,
  FileText,
  Layers,
  Target
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

// --- HELPER COMPONENTS ---

// Highly styled PCB Component
const PcbComponent = ({ comp, showThermal, isSelected }) => {
  const isHV = comp.type === 'HighVoltage';
  const isPower = comp.type === 'Power';
  const isConnector = comp.type === 'Connector';

  return (
    <div
      className={`absolute flex flex-col items-center justify-center rounded-sm transition-all duration-500 cursor-pointer
        ${isHV ? 'bg-slate-900 border-orange-500' : isPower ? 'bg-slate-800 border-sky-500' : 'bg-[#1e1e1e] border-slate-500'}
        border-2 shadow-[0_10px_20px_rgba(0,0,0,0.5)]
        ${isSelected ? 'ring-2 ring-white scale-105' : ''}
      `}
      style={{
        width: comp.width, height: comp.height,
        left: comp.x, top: comp.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 50 : 10
      }}
    >
      {/* Silkscreen Pin 1 Indicator */}
      {!isConnector && !isPower && <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full"></div>}
      
      {/* Fake Pins (Left/Right) */}
      {!isConnector && (
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
      {isHV ? <Zap className="w-6 h-6 text-orange-500 mb-1 opacity-80" /> : 
       isPower ? <Zap className="w-6 h-6 text-sky-400 mb-1 opacity-80" /> : 
       isConnector ? <div className="w-full h-2 bg-slate-400 absolute left-0 rounded-r-md"></div> :
       <Cpu className="w-6 h-6 text-slate-400 mb-1" />}
      
      {/* Silkscreen Text */}
      <span className={`text-[10px] font-mono font-bold text-white text-center leading-none px-1`}>{comp.id}</span>
      <span className={`text-[8px] font-mono text-slate-400 text-center leading-none mt-1`}>{comp.label}</span>
      
      {/* Thermal Hotspot Overlay */}
      {showThermal && (
        <div 
          className="absolute inset-0 rounded-sm flex items-center justify-center pointer-events-none"
          style={{
            background: comp.power > 1.0 ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(239,68,68,0) 70%)' : 
                        comp.power > 0.1 ? 'radial-gradient(circle, rgba(249,115,22,0.6) 0%, rgba(249,115,22,0) 70%)' : 'none',
            transform: 'scale(1.5)',
            zIndex: -1
          }}
        >
          {comp.power > 0.5 && <span className="absolute -top-4 bg-red-600 text-white text-[9px] font-bold px-1.5 rounded border border-white z-20">{comp.power}W</span>}
        </div>
      )}
    </div>
  );
};

// --- MASSIVE SVG CHART COMPONENT ---
const OptimizationChartLarge = () => {
  // Generate stable mock data using useMemo
  const points = useMemo(() => {
    return Array.from({ length: 300 }).map(() => {
      const mass = Math.random() * 8 + 1; // Spanning 1kg to 9kg for full horizontal scaling
      // Strong positive correlation between mass (battery size) and life
      const life = (mass * 1.5) + (Math.random() * 5 - 2.5); 
      const feasible = mass <= 5.0 && life >= 4.0;
      return { x: mass, y: Math.max(0, Math.min(15, life)), feasible };
    });
  }, []);

  const optimal = { x: 4.8, y: 11.5 }; 

  // Chart Dimensions (Pixel Perfect Scaling to match the 850x550 container)
  const width = 850;
  const height = 550;
  const margin = { top: 40, right: 50, bottom: 80, left: 80 }; // Increased bottom margin
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scale Functions (Map Data to Pixels)
  const xScale = (val) => margin.left + (val / 10) * plotWidth;
  const yScale = (val) => margin.top + plotHeight - (val / 15) * plotHeight;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center z-10 shadow-sm shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Multi-Objective Optimization</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Architect Agent: System Mass vs. Battery Autonomy</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="w-3 h-3 rounded-full bg-slate-300"></span> Infeasible</div>
           <div className="flex items-center gap-2 text-xs font-bold text-sky-600"><span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span> Feasible Space</div>
           <div className="flex items-center gap-2 text-xs font-bold text-emerald-600"><span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md"></span> Selected Optimal</div>
        </div>
      </div>

      {/* SVG Canvas - Pure scalable vector graphics */}
      <div className="flex-1 w-full h-full relative bg-slate-50 flex items-center justify-center p-0">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
          
          {/* Feasible Zone Background */}
          <rect 
             x={xScale(0)} 
             y={yScale(15)} 
             width={xScale(5) - xScale(0)} 
             height={yScale(4) - yScale(15)} 
             fill="#f0f9ff" 
             rx="8" 
          />
          
          {/* Grid Lines & Axis Values */}
          {[0, 2, 4, 6, 8, 10].map(val => (
            <g key={`x-${val}`}>
               <line x1={xScale(val)} y1={yScale(0)} x2={xScale(val)} y2={yScale(15)} stroke="#e2e8f0" strokeWidth="1.5" />
               <line x1={xScale(val)} y1={yScale(0)} x2={xScale(val)} y2={yScale(0) + 8} stroke="#94a3b8" strokeWidth="2" />
               <text x={xScale(val)} y={yScale(0) + 24} fill="#64748b" fontSize="13" textAnchor="middle" fontWeight="bold">{val}kg</text>
            </g>
          ))}
          
          {[0, 3, 6, 9, 12, 15].map(val => (
            <g key={`y-${val}`}>
               <line x1={xScale(0)} y1={yScale(val)} x2={xScale(10)} y2={yScale(val)} stroke="#e2e8f0" strokeWidth="1.5" />
               <line x1={xScale(0) - 8} y1={yScale(val)} x2={xScale(0)} y2={yScale(val)} stroke="#94a3b8" strokeWidth="2" />
               <text x={xScale(0) - 15} y={yScale(val) + 4} fill="#64748b" fontSize="13" textAnchor="end" fontWeight="bold">{val}h</text>
            </g>
          ))}

          {/* Axes Base Lines */}
          <line x1={xScale(0)} y1={yScale(0)} x2={xScale(10)} y2={yScale(0)} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <line x1={xScale(0)} y1={yScale(0)} x2={xScale(0)} y2={yScale(15)} stroke="#475569" strokeWidth="3" strokeLinecap="round" />

          {/* Axis Titles (Correctly placed and scaled to avoid clipping) */}
          <text x={xScale(5)} y={yScale(0) + 60} fill="#1e293b" fontSize="16" textAnchor="middle" fontWeight="900" letterSpacing="2">SYSTEM MASS (kg)</text>
          <text x={xScale(0) - 55} y={yScale(7.5)} fill="#1e293b" fontSize="16" textAnchor="middle" fontWeight="900" letterSpacing="2" transform={`rotate(-90, ${xScale(0) - 55}, ${yScale(7.5)})`}>BATTERY LIFE (h)</text>

          {/* Constraint Line: Max Mass */}
          <line x1={xScale(5)} y1={yScale(0)} x2={xScale(5)} y2={yScale(15)} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="8 6" />
          <rect x={xScale(5) + 12} y={yScale(14.5) - 16} width="135" height="28" fill="#fef2f2" rx="6" stroke="#fecaca" strokeWidth="1" />
          <text x={xScale(5) + 22} y={yScale(14.5) + 3} fill="#ef4444" fontSize="13" fontWeight="bold">Max Mass (5kg)</text>
          
          {/* Constraint Line: Min Life */}
          <line x1={xScale(0)} y1={yScale(4)} x2={xScale(10)} y2={yScale(4)} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 6" />
          <rect x={xScale(9.8) - 110} y={yScale(4) - 34} width="110" height="28" fill="#fffbeb" rx="6" stroke="#fde68a" strokeWidth="1" />
          <text x={xScale(9.8) - 55} y={yScale(4) - 15} fill="#f59e0b" fontSize="13" fontWeight="bold" textAnchor="middle">Min Life (4h)</text>

          {/* Scatter Points (The raw data) */}
          {points.map((p, i) => (
            <circle 
              key={i} 
              cx={xScale(p.x)} cy={yScale(p.y)} 
              r={p.feasible ? "5" : "4"} 
              fill={p.feasible ? '#38bdf8' : '#cbd5e1'} 
              opacity={p.feasible ? 0.9 : 0.6} 
              className="transition-all hover:r-8 hover:opacity-100 cursor-pointer"
            />
          ))}

          {/* Optimal Point Visualization */}
          <circle cx={xScale(optimal.x)} cy={yScale(optimal.y)} r="20" fill="#10b981" opacity="0.25" className="animate-ping" />
          <circle cx={xScale(optimal.x)} cy={yScale(optimal.y)} r="9" fill="#10b981" stroke="white" strokeWidth="3" className="shadow-2xl drop-shadow-lg" />
          
          {/* Tooltip Tag for Optimal Point */}
          <path d={`M ${xScale(optimal.x)} ${yScale(optimal.y)} L ${xScale(optimal.x) + 40} ${yScale(optimal.y) - 40}`} stroke="#047857" strokeWidth="2" />
          <g transform={`translate(${xScale(optimal.x) + 40}, ${yScale(optimal.y) - 60})`}>
            <rect x="0" y="0" width="160" height="40" fill="#047857" rx="8" className="drop-shadow-xl" />
            <text x="80" y="24" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">Selected Design</text>
          </g>

        </svg>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function HelixTwinL3() {
  const [activeTab, setActiveTab] = useState('optimization');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showThermal, setShowThermal] = useState(false);
  const [isRouted, setIsRouted] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    addLog("Generative Layout Engine Initialized.", "info");
    addLog("Constraints Loaded: ISO-60601-1 (Mains Isolation), Min Clearance 8.0mm", "system");
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString([], { hour12: false }) }, ...prev].slice(0, 15));
  };

  const runAutoPlace = () => {
    setIsOptimizing(true);
    setActiveTab('ecad'); // Switch to ECAD to see it happen
    addLog("Executing Force-Directed Placement Algorithm...", "system");
    setTimeout(() => {
      setComponents(prev => prev.map(c => c.anchored ? c : {
        ...c,
        x: c.x + (Math.random() - 0.5) * 40,
        y: c.y + (Math.random() - 0.5) * 40
      }));
      setIsOptimizing(false);
      addLog("Placement Converged. Thermal separation rules applied.", "success");
    }, 1500);
  };

  const toggleRoute = () => {
    setActiveTab('ecad'); // Switch to ECAD to see it happen
    if (isRouted) {
      setIsRouted(false);
      addLog("Traces ripped up.", "warning");
    } else {
      setIsRouted(true);
      addLog("Auto-Router: Routing 5 nets...", "system");
      setTimeout(() => addLog("Auto-Router Completed: 100% Routed, 0 DRC Errors.", "success"), 500);
    }
  };

  const tabs = [
    { id: 'optimization', label: 'Optimization', IconComponent: Target },
    { id: 'ecad', label: 'ECAD Layout', IconComponent: Grid },
    { id: 'mcad', label: 'MCAD Enclosure', IconComponent: Box },
    { id: 'firmware', label: 'Firmware HAL', IconComponent: Code }
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-16'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30 shadow-sm shrink-0`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Cpu className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-800">Helix<span className="text-sky-500">Twin</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors">
            <Menu className="w-5 h-5 mx-auto" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
           {isSidebarOpen && (
             <>
                {/* Actions */}
                <div>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Settings className="w-3 h-3" /> Synthesis Controls
                   </h3>
                   <div className="space-y-3">
                      <button 
                        onClick={runAutoPlace} disabled={isOptimizing}
                        className="w-full flex items-center justify-between bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 p-3 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                         <span className="flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} /> Optimize Layout</span>
                         <span className="bg-white px-2 py-0.5 rounded text-[9px] border border-sky-200 shadow-sm">AI Solver</span>
                      </button>
                      
                      <button 
                        onClick={toggleRoute}
                        className={`w-full flex items-center justify-between border p-3 rounded-xl text-xs font-bold transition-all shadow-sm
                          ${isRouted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                      >
                         <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> {isRouted ? 'Rip-up Traces' : 'Auto-Route Nets'}</span>
                         {isRouted && <CheckCircle className="w-4 h-4" />}
                      </button>
                   </div>
                </div>

                {/* Analysis */}
                <div>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Layers className="w-3 h-3" /> Analysis Overlays
                   </h3>
                   <div className="space-y-3">
                      <button 
                        onClick={() => {
                           setShowThermal(!showThermal);
                           setActiveTab('ecad');
                        }}
                        className={`w-full flex items-center justify-between border p-3 rounded-xl text-xs font-bold transition-all shadow-sm
                          ${showThermal ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                      >
                         <span className="flex items-center gap-2"><Thermometer className="w-4 h-4" /> Thermal Heatmap</span>
                         {showThermal ? <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> : null}
                      </button>
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-inner">
                         <span className="flex items-center gap-2 text-slate-600 font-medium"><AlertTriangle className="w-4 h-4 text-emerald-500" /> DRC Violations</span>
                         <span className="font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">0</span>
                      </div>
                   </div>
                </div>

             </>
           )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-slate-100 relative min-w-0">
         
         {/* TOP HEADER */}
         <div className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20 sticky top-0 overflow-x-auto shrink-0">
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
               {tabs.map(tab => (
                  <button
                    key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap
                      ${activeTab === tab.id ? 'bg-white text-sky-600 shadow-md border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                  >
                    <tab.IconComponent className="w-4 h-4" /> {tab.label}
                  </button>
               ))}
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
               <div className="hidden xl:flex items-center gap-4 text-xs font-mono text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
                  <span>P_Est: <strong className="text-orange-600">7.15W</strong></span>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <span>Mass: <strong className="text-sky-600">4.8kg</strong></span>
               </div>
               <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap">
                  <Download className="w-4 h-4 text-sky-400" /> Export Package
               </button>
            </div>
         </div>

         {/* CANVAS WORKSPACE */}
         <div className="flex-1 overflow-auto relative flex items-center justify-center p-8 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px]">
            
            {/* --- VIEW 1: OPTIMIZATION CHART --- */}
            {activeTab === 'optimization' && (
               <div className="w-[850px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col shrink-0">
                  <OptimizationChartLarge />
               </div>
            )}

            {/* --- VIEW 2: ECAD (DARK MODE PCB) --- */}
            {activeTab === 'ecad' && (
               <div className="relative w-[850px] h-[550px] bg-[#0f172a] rounded-2xl shadow-2xl border-8 border-slate-800 overflow-hidden ring-1 ring-white/10 shrink-0">
                  {/* Board Texture */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:12px_12px] opacity-50"></div>
                  
                  {/* Board Markings */}
                  <div className="absolute top-4 left-4 text-white/30 text-xs font-mono font-bold tracking-widest border-b border-white/20 pb-1">
                    HELIX_MAIN_CONTROLLER_REV_C
                  </div>
                  
                  {/* ISO Barrier Visual (Safety Requirement) */}
                  <div className="absolute right-[250px] top-0 bottom-0 w-8 border-l-2 border-r-2 border-red-500/50 flex flex-col justify-center items-center z-0 overflow-hidden bg-red-500/10">
                     {/* Hazard Stripes */}
                     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ef4444 10px, #ef4444 20px)' }}></div>
                     <span className="text-[12px] text-red-400 font-black -rotate-90 whitespace-nowrap tracking-[0.2em] uppercase z-10 bg-[#0f172a] px-4">
                       ISO-60601 Isolation Barrier (8mm)
                     </span>
                  </div>

                  {/* Traces */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                     {isRouted && NETLIST.map((net, i) => {
                        const start = components.find(c => c.id === net.from);
                        const end = components.find(c => c.id === net.to);
                        if (!start || !end) return null;
                        
                        // Manhattan routing logic (Step function)
                        const midX = (start.x + end.x) / 2;
                        const path = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
                        
                        const isPower = net.type === 'power';
                        const color = isPower ? '#f59e0b' : '#38bdf8'; // Amber for power, Sky for signal
                        const isIso = net.voltage === 'ISO_DATA';
                        
                        return (
                           <g key={i}>
                              {/* Trace glow */}
                              <path d={path} fill="none" stroke={color} strokeWidth={isPower ? 6 : 3} opacity="0.3" filter="blur(2px)" />
                              {/* Actual Trace */}
                              <path d={path} fill="none" stroke={color} strokeWidth={isPower ? 3 : 1.5} className="animate-draw" strokeDasharray={isIso ? "4 4" : "none"} />
                              {/* Vias/Pads */}
                              <circle cx={start.x} cy={start.y} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                              <circle cx={end.x} cy={end.y} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                           </g>
                        );
                     })}
                  </svg>

                  {/* Components */}
                  {components.map(comp => (
                     <PcbComponent key={comp.id} comp={comp} showThermal={showThermal} isSelected={false} />
                  ))}
               </div>
            )}

            {/* --- VIEW 3: MCAD (BLUEPRINT ENCLOSURE) --- */}
            {activeTab === 'mcad' && (
               <div className="relative w-[850px] h-[550px] bg-[#001f3f] rounded-2xl shadow-2xl border-4 border-[#003366] overflow-hidden font-mono text-cyan-200 flex shrink-0">
                  {/* Blueprint Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.15)_1px,transparent_1px)] [background-size:20px_20px]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.3)_1px,transparent_1px)] [background-size:100px_100px]"></div>
                  
                  {/* Isometric Box Drawing */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-[280px]">
                     <div className="relative w-[500px] h-[400px]">
                         <svg width="500" height="400" viewBox="0 0 500 400" className="opacity-80">
                            {/* Box outline */}
                            <path d="M 250 50 L 450 150 L 450 350 L 250 250 Z" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeWidth="2" />
                            <path d="M 50 150 L 250 50 L 250 250 L 50 350 Z" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="2" />
                            <path d="M 250 250 L 450 350 L 250 450 L 50 350 Z" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 5" />
                            <path d="M 50 150 L 250 250 L 450 150" fill="none" stroke="#38bdf8" strokeWidth="2" />
                            
                            {/* Ventilation Cutouts */}
                            <path d="M 300 130 L 400 180 L 400 190 L 300 140 Z" fill="none" stroke="#38bdf8" strokeWidth="1" />
                            <path d="M 300 150 L 400 200 L 400 210 L 300 160 Z" fill="none" stroke="#38bdf8" strokeWidth="1" />
                            <path d="M 300 170 L 400 220 L 400 230 L 300 180 Z" fill="none" stroke="#38bdf8" strokeWidth="1" />

                            {/* Dimension Lines */}
                            <line x1="460" y1="150" x2="460" y2="350" stroke="#38bdf8" strokeWidth="1" />
                            <line x1="455" y1="150" x2="465" y2="150" stroke="#38bdf8" strokeWidth="1" />
                            <line x1="455" y1="350" x2="465" y2="350" stroke="#38bdf8" strokeWidth="1" />
                            <text x="470" y="250" fill="#38bdf8" fontSize="12" className="font-mono">90mm</text>

                            <line x1="250" y1="40" x2="450" y2="140" stroke="#38bdf8" strokeWidth="1" />
                            <text x="350" y="80" fill="#38bdf8" fontSize="12" className="font-mono">120mm</text>
                         </svg>
                         
                         {/* Tooltip/Highlight accurately placed on drawing edge */}
                         <div className="absolute top-[200px] left-[150px] flex items-center gap-3">
                            <div className="relative flex items-center justify-center pointer-events-auto">
                               <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping absolute"></div>
                               <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white relative z-10"></div>
                            </div>
                            <div className="bg-[#001f3f]/90 backdrop-blur border border-cyan-500 p-2.5 rounded-lg text-xs z-10 shadow-[0_0_15px_rgba(6,182,212,0.3)] pointer-events-auto">
                               <div className="text-cyan-300 mb-0.5">Wall Thickness:</div>
                               <span className="font-bold text-white tracking-wide">2.5mm (Yield Check: PASS)</span>
                            </div>
                         </div>
                     </div>
                  </div>
                  
                  {/* Title Block */}
                  <div className="absolute bottom-6 right-6 border-2 border-cyan-500/30 p-5 bg-[#001730]/90 backdrop-blur-md z-10 min-w-[240px] rounded-xl shadow-2xl">
                     <div className="text-lg font-bold border-b border-cyan-500/30 pb-3 mb-3 tracking-wider text-white">VENTILATOR_ENCLOSURE</div>
                     <div className="text-xs space-y-2 font-mono">
                        <div className="flex justify-between"><span className="text-cyan-500/70">MATL:</span> <span className="text-cyan-100">ABS_MEDICAL_GRADE</span></div>
                        <div className="flex justify-between"><span className="text-cyan-500/70">TOL:</span> <span className="text-cyan-100">±0.15mm</span></div>
                        <div className="flex justify-between"><span className="text-cyan-500/70">SCALE:</span> <span className="text-cyan-100">1:1</span></div>
                        <div className="flex justify-between"><span className="text-cyan-500/70">IP_RATING:</span> <span className="text-cyan-100">IP54</span></div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- VIEW 4: FIRMWARE (VS CODE STYLE) --- */}
            {activeTab === 'firmware' && (
               <div className="w-[850px] h-[550px] bg-[#1e1e1e] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden font-mono shrink-0">
                  {/* Fake Window Bar */}
                  <div className="bg-[#2d2d2d] h-10 flex items-center justify-between px-4 border-b border-black">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                     </div>
                     <div className="text-slate-400 text-xs flex items-center gap-2">
                        <Code className="w-3 h-3" /> src/main_controller.c
                     </div>
                     <div className="text-[9px] text-emerald-400 border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> FORMAL VERIFICATION: PASS
                     </div>
                  </div>
                  
                  {/* Code Editor Area */}
                  <div className="flex-1 flex overflow-auto text-[13px] leading-relaxed">
                     {/* Line Numbers */}
                     <div className="w-12 bg-[#1e1e1e] border-r border-slate-800 text-slate-600 text-right pr-3 py-4 select-none">
                        {Array.from({length: 25}).map((_, i) => <div key={i}>{i+1}</div>)}
                     </div>
                     {/* Code Content */}
                     <pre className="flex-1 p-4 text-slate-300">
<span className="text-green-400 italic">/*</span><br/>
<span className="text-green-400 italic"> * Helix-Twin Auto-Generated Firmware HAL</span><br/>
<span className="text-green-400 italic"> * Target: Nordic nRF52840 (ARM Cortex-M4)</span><br/>
<span className="text-green-400 italic"> * Compliance: IEC 62304 Class B</span><br/>
<span className="text-green-400 italic"> */</span><br/>
<br/>
<span className="text-purple-400">#include</span> <span className="text-orange-300">"helix_core.h"</span><br/>
<span className="text-purple-400">#include</span> <span className="text-orange-300">"safety_logic.h"</span><br/>
<br/>
<span className="text-green-400 italic">// Constraints injected directly from Layer 1 Intent</span><br/>
<span className="text-purple-400">#define</span> <span className="text-sky-300">MAX_PRESSURE_CMH2O</span>  <span className="text-yellow-200">40.0</span><br/>
<span className="text-purple-400">#define</span> <span className="text-sky-300">WATCHDOG_TIMEOUT_MS</span> <span className="text-yellow-200">100</span><br/>
<br/>
<span className="text-sky-400">void</span> <span className="text-yellow-100">main</span>(<span className="text-sky-400">void</span>) {'{\n'}
{'    '}sys_clock_init();<br/>
{'    '}gpio_init(VALVE_PIN, GPIO_OUT);<br/>
{'    '}adc_init(SENSOR_PIN);<br/>
<br/>
{'    '}<span className="text-green-400 italic">// Main Control Loop (RTOS Task)</span><br/>
{'    '}<span className="text-purple-400">while</span> (<span className="text-yellow-200">1</span>) {'{\n'}
{'        '}<span className="text-sky-400">float</span> pressure = read_sensor();<br/>
<br/>
{'        '}<span className="text-green-400 italic">// Critical Safety Override (ISO 14971)</span><br/>
{'        '}<span className="text-purple-400">if</span> (pressure {'>'} MAX_PRESSURE_CMH2O) {'{\n'}
{'            '}gpio_set(VALVE_PIN, HIGH); <span className="text-green-400 italic">// OPEN RELIEF VALVE</span><br/>
{'            '}log_event(EVT_OVERPRESSURE);<br/>
{'        }'} <span className="text-purple-400">else</span> {'{\n'}
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
  );
}
