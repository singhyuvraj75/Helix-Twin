import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Activity,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Wind,
  Zap,
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Share2,
  Menu,
  DownloadCloud,
  Play,
  Pause,
  SlidersHorizontal,
  XCircle // Added missing import
} from 'lucide-react';

// --- MOCK AAS HIERARCHY (Asset Administration Shell) ---
const AAS_TREE = {
  id: 'ROOT', label: 'Ventilator_Helix_V1', type: 'System', status: 'WARNING', children: [
    {
      id: 'SUB-1', label: 'Pneumatic_Unit', type: 'Subsystem', status: 'PASS', children: [
        { id: 'CMP-1', label: 'Turbine_Blower', type: 'Component', status: 'PASS', val: '12,000 RPM' },
        { id: 'CMP-2', label: 'Flow_Sensor', type: 'Component', status: 'PASS', val: '45 L/min' },
        { id: 'CMP-2b', label: 'Exhale_Valve', type: 'Component', status: 'PASS', val: 'Closed' }
      ]
    },
    {
      id: 'SUB-2', label: 'Power_Unit', type: 'Subsystem', status: 'WARNING', children: [
        { id: 'CMP-3', label: 'LiPo_Battery_Pack', type: 'Component', status: 'WARNING', val: '14.2 V', alert: 'High Int. Resistance' },
        { id: 'CMP-4', label: 'BMS_Circuit', type: 'Component', status: 'PASS', val: 'Active' }
      ]
    },
    {
      id: 'SUB-3', label: 'Control_Unit', type: 'Subsystem', status: 'PASS', children: [
        { id: 'CMP-5', label: 'nRF52840_MCU', type: 'Component', status: 'PASS', val: 'Nominal' },
        { id: 'CMP-6', label: 'Patient_AFE', type: 'Component', status: 'PASS', val: 'Polling' }
      ]
    }
  ]
};

// --- MOCK TIME-SERIES DATA (For Time Travel) ---
const TOTAL_DURATION = 60; // 60 seconds
const DATA_POINTS = 600; // 10Hz

const generateHistory = () => {
  const data = [];
  for (let i = 0; i < DATA_POINTS; i++) {
    const t = i / 10;
    // Simulate realistic breathing cycle (inspiration/expiration)
    const breathCycle = Math.sin(t * Math.PI / 2);
    const isCough = t > 45 && t < 46; // Fault injected at 45s

    data.push({
      t: t,
      pressure: isCough ? 55 : 15 + Math.max(0, breathCycle) * 15 + Math.random(),
      flow: isCough ? -60 : Math.max(-20, breathCycle * 40) + Math.random() * 2,
      voltage: 16 - (t / 60) * 1.5 - (Math.random() * 0.05) // Slow drain
    });
  }
  return data;
};

// --- HELPER: MINI SPARKLINE ---
const Sparkline = ({ data, color, dataKey, currentIndex }) => {
  // Show a rolling window of the last 100 points up to the current index
  const windowSize = 100;
  const startIdx = Math.max(0, currentIndex - windowSize);
  const slice = data.slice(startIdx, currentIndex + 1);
  
  if (slice.length === 0) return <div className="h-10 w-full bg-slate-50 rounded"></div>;

  const min = Math.min(...data.map(d => d[dataKey])) * 0.9;
  const max = Math.max(...data.map(d => d[dataKey])) * 1.1;

  const points = slice.map((d, i) => {
    const x = (i / (windowSize - 1)) * 100;
    const y = 100 - ((d[dataKey] - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-12 w-full mt-2 relative">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
         <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
         {slice.length > 0 && (
           <circle cx="100" cy={100 - ((slice[slice.length-1][dataKey] - min) / (max - min)) * 100} r="4" fill="white" stroke={color} strokeWidth="2" />
         )}
      </svg>
    </div>
  );
};

// --- HELPER: RECURSIVE TREE COMPONENT ---
const TreeItem = ({ node, depth = 0, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none relative">
      {/* Branch Lines */}
      {depth > 0 && (
        <div className="absolute border-l border-b border-slate-200 w-3 h-4" style={{ left: `${depth * 16 - 10}px`, top: '0px' }}></div>
      )}
      {depth > 0 && hasChildren && expanded && (
        <div className="absolute border-l border-slate-200 bottom-0" style={{ left: `${depth * 16 - 10}px`, top: '16px' }}></div>
      )}

      <div
        onClick={() => onSelect(node)}
        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-all rounded-lg my-0.5 mx-2 relative z-10
          ${isSelected ? 'bg-sky-50 shadow-sm ring-1 ring-sky-200' : 'hover:bg-slate-50'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`p-0.5 rounded hover:bg-slate-200 text-slate-400 transition-colors ${!hasChildren ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {node.status === 'PASS' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
        {node.status === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
        {node.status === 'FAIL' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}

        <span className={`text-xs font-semibold ${isSelected ? 'text-sky-700' : 'text-slate-600'}`}>{node.label}</span>
      </div>

      {expanded && hasChildren && (
        <div className="relative">
          {/* Vertical connecting line for children */}
          <div className="absolute border-l border-slate-200 bottom-0 z-0" style={{ left: `${(depth + 1) * 16 - 10}px`, top: '0px' }}></div>
          {node.children.map(child => (
            <TreeItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function HelixTwinL7() {
  const [selectedNode, setSelectedNode] = useState(AAS_TREE.children[1].children[0]); // Default to Battery
  const [historyData, setHistoryData] = useState([]);
  const [playbackTime, setPlaybackTime] = useState(TOTAL_DURATION); // Start at the end
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Memoize history generation
  useEffect(() => {
    setHistoryData(generateHistory());
  }, []);

  // Playback Logic
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= TOTAL_DURATION) return 0; // Loop
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentIndex = Math.min(DATA_POINTS - 1, Math.floor((playbackTime / TOTAL_DURATION) * DATA_POINTS));
  const currentSnapshot = historyData[currentIndex] || {};

  // Find all nodes recursively to count statuses
  const getStats = (node) => {
    let stats = { pass: 0, warn: 0, fail: 0, total: 0 };
    if (node.type === 'Component') {
      stats.total++;
      if (node.status === 'PASS') stats.pass++;
      if (node.status === 'WARNING') stats.warn++;
      if (node.status === 'FAIL') stats.fail++;
    }
    if (node.children) {
      node.children.forEach(c => {
        const cStats = getStats(c);
        stats.pass += cStats.pass;
        stats.warn += cStats.warn;
        stats.fail += cStats.fail;
        stats.total += cStats.total;
      });
    }
    return stats;
  };
  const sysStats = getStats(AAS_TREE);
  const healthPercent = Math.round((sysStats.pass / sysStats.total) * 100);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">

      {/* LEFT: HIERARCHY NAVIGATOR (AAS) */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-16'} bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl transition-all duration-300 shrink-0`}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          {isSidebarOpen && (
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <LayoutDashboard className="text-white w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-xl tracking-tight text-slate-800">Helix<span className="text-indigo-600">Twin</span></span>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Layer 7: Omni-Dashboard</div>
                </div>
             </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
             <Menu className="w-5 h-5 mx-auto" />
          </button>
        </div>
        
        {isSidebarOpen && (
          <>
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search AAS IDs..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
              <TreeItem node={AAS_TREE} onSelect={setSelectedNode} selectedId={selectedNode?.id} />
            </div>

            {/* System Health Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 uppercase mb-3 font-black tracking-widest">AAS Health Aggregation</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-amber-500" style={{ width: `${healthPercent}%` }}></div>
                </div>
                <span className="text-sm font-black text-amber-600">{healthPercent}%</span>
              </div>
              <div className="flex justify-between items-center">
                 <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                   <AlertTriangle className="w-3 h-3 text-amber-500" /> {sysStats.warn} Warnings
                 </div>
                 <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                   <XCircle className="w-3 h-3 text-rose-500" /> {sysStats.fail} Critical
                 </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CENTER: TWIN VISUALIZATION & TIME TRAVEL */}
      <div className="flex-1 flex flex-col relative min-w-0">

        {/* Top Header */}
        <header className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm shrink-0">
          <div>
             <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded">
                 Asset Administration Shell (AAS)
               </span>
             </div>
             <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
               <Layers className="w-5 h-5 text-indigo-500" />
               {selectedNode.type} Focus: <span className="text-indigo-600">{selectedNode.label}</span>
             </h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:border-indigo-300 hover:text-indigo-700 shadow-sm transition-all">
              <Share2 className="w-4 h-4" /> Thread URL
            </button>
            <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transform hover:-translate-y-0.5 transition-all">
              <DownloadCloud className="w-4 h-4" /> FDA Audit Package
            </button>
          </div>
        </header>

        {/* Holographic Visualization Area */}
        <div className="flex-1 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] relative overflow-hidden flex items-center justify-center p-8">

          {/* Abstract Digital Twin Hologram */}
          <div className="relative w-[500px] h-[500px] flex items-center justify-center">
             {/* Orbital Rings */}
             <div className="absolute inset-4 border border-indigo-200 rounded-full animate-spin-slow shadow-[0_0_50px_rgba(99,102,241,0.1)_inset]"></div>
             <div className="absolute inset-16 border-2 border-dashed border-sky-300 rounded-full animate-reverse-spin opacity-50"></div>
             
             {/* Center Glow */}
             <div className="absolute inset-32 bg-gradient-to-tr from-indigo-100 to-sky-50 rounded-full shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.8)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-shimmer"></div>
                
                {/* Dynamic Icon */}
                <div className="z-10 relative transform scale-150 transition-all duration-500">
                   {selectedNode.label.includes('Battery') ? (
                     <Zap className="w-20 h-20 text-amber-500 drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]" />
                   ) : selectedNode.label.includes('Turbine') || selectedNode.label.includes('Pneumatic') ? (
                     <Wind className="w-20 h-20 text-sky-500 drop-shadow-[0_10px_20px_rgba(14,165,233,0.4)]" />
                   ) : selectedNode.label.includes('MCU') || selectedNode.label.includes('Control') ? (
                     <Cpu className="w-20 h-20 text-purple-500 drop-shadow-[0_10px_20px_rgba(168,85,247,0.4)]" />
                   ) : (
                     <Activity className="w-20 h-20 text-emerald-500 drop-shadow-[0_10px_20px_rgba(16,185,129,0.4)]" />
                   )}
                </div>
             </div>

             {/* Floating Info Tags */}
             <div className="absolute top-1/4 right-10 bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 rounded-xl shadow-xl flex flex-col animate-float">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">Active Node</span>
                <span className="text-sm font-bold text-slate-800">{selectedNode.label}</span>
             </div>

             {selectedNode.alert && (
               <div className="absolute bottom-1/4 left-10 bg-rose-50 border-2 border-rose-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
                  <div className="p-2 bg-rose-100 rounded-full"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
                  <div>
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">Anomaly Detected</span>
                    <span className="text-sm font-bold text-rose-800">{selectedNode.alert}</span>
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Premium Time Travel Scrubber */}
        <div className="h-44 bg-slate-900 border-t border-slate-800 p-6 flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.15)] z-20 shrink-0">
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg transform hover:scale-105 ${isPlaying ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="ml-1 w-5 h-5 fill-current" />}
              </button>
              <div>
                 <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Digital Twin Synchronized Time
                 </div>
                 <div className="text-xl font-mono font-black text-white bg-black/40 px-3 py-1 rounded-lg border border-slate-700 inline-block">
                   T - {Math.abs(TOTAL_DURATION - playbackTime).toFixed(2)}s
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scale:</span>
               <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 flex">
                  <button className="px-3 py-1 text-xs font-bold text-white bg-slate-700 rounded shadow-sm">1x</button>
                  <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white">5x</button>
               </div>
            </div>
          </div>

          {/* Advanced Scrubber Track */}
          <div className="relative flex-1 bg-[#020617] rounded-xl border border-slate-800 overflow-hidden cursor-crosshair group shadow-inner">
            
            {/* Multi-Channel Waveform Background (Generated from history data) */}
            <svg className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="none">
              {historyData.length > 0 && (
                <>
                  <polyline 
                     points={historyData.map((d, i) => `${(i/(DATA_POINTS-1))*100}%,${100 - ((d.pressure)/70)*100}%`).join(' ')} 
                     fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.8" 
                  />
                  <polyline 
                     points={historyData.map((d, i) => `${(i/(DATA_POINTS-1))*100}%,${100 - ((d.flow+60)/120)*100}%`).join(' ')} 
                     fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6" 
                  />
                  <polyline 
                     points={historyData.map((d, i) => `${(i/(DATA_POINTS-1))*100}%,${100 - ((d.voltage-14)/3)*100}%`).join(' ')} 
                     fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" 
                  />
                </>
              )}
            </svg>

            {/* Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-[0_0_10px_rgba(244,63,94,0.8)] pointer-events-none"
              style={{ left: `${(playbackTime / TOTAL_DURATION) * 100}%` }}
            >
              {/* Playhead Handle */}
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-rose-500 rounded-full shadow-lg scale-50 group-hover:scale-100 transition-transform border-2 border-white"></div>
            </div>

            {/* Actual Range Input (Hidden but functional) */}
            <input
              type="range"
              min="0" max={TOTAL_DURATION} step="0.1"
              value={playbackTime}
              onChange={(e) => { setIsPlaying(false); setPlaybackTime(parseFloat(e.target.value)); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: INSPECTOR PANEL (Live Telemetry) */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Live Telemetry
          </h2>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Context Aware Panels with Sparklines */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
            <div className="flex justify-between items-start mb-2">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Airway Pressure</div>
               <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">L5 Sim</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-mono text-slate-800 font-black">{currentSnapshot.pressure?.toFixed(1)}</span>
               <span className="text-sm font-bold text-slate-400">cmH2O</span>
            </div>
            <Sparkline data={historyData} color="#0ea5e9" dataKey="pressure" currentIndex={currentIndex} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-2">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Air Flow Rate</div>
               <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">L5 Sim</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-mono text-slate-800 font-black">{currentSnapshot.flow?.toFixed(1)}</span>
               <span className="text-sm font-bold text-slate-400">L/min</span>
            </div>
            <Sparkline data={historyData} color="#10b981" dataKey="flow" currentIndex={currentIndex} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex justify-between items-start mb-2">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Battery Voltage</div>
               <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">L4 Calib</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-mono text-slate-800 font-black">{currentSnapshot.voltage?.toFixed(2)}</span>
               <span className="text-sm font-bold text-slate-400">V</span>
            </div>
            <Sparkline data={historyData} color="#f59e0b" dataKey="voltage" currentIndex={currentIndex} />
          </div>

        </div>

        {/* Drill Down Actions Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <div className="text-[10px] text-slate-400 uppercase mb-3 font-black tracking-widest">Cross-Layer Actions</div>
          <button className="w-full text-left p-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-xs font-bold text-slate-700 mb-2 flex justify-between items-center transition-all shadow-sm hover:border-indigo-200 hover:text-indigo-700">
            Export Audit Logs <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          <button className="w-full text-left p-3 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center transition-all shadow-sm hover:border-indigo-200 hover:text-indigo-700">
            Open Compliance Sentinel <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>

    </div>
  );
}
