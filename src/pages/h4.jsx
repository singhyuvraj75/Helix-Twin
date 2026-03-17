import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  RefreshCw,
  FileText,
  CheckCircle,
  Target,
  ArrowRight,
  Menu,
  Terminal,
  Activity,
  Cpu,
  Database,
  BarChart2
} from 'lucide-react';

// --- MOCK DATA GENERATORS ---

// Generates the "True" Real World Data based on the target hidden parameter (R = 0.150)
const generateRealWorldData = () => {
  const data = [];
  for (let t = 0; t <= 100; t++) {
    // True underlying model + sensor noise
    const noise = (Math.random() - 0.5) * 0.08;
    const vol = 4.2 - ((0.150 * 0.5) * t) - (0.150 * 1.5) + noise;
    data.push({ t, v: Math.max(2.5, vol) });
  }
  return data;
};

// Generates the Model Belief Curve dynamically based on the current parameter estimation
const generateModelCurve = (rParam) => {
  const data = [];
  for (let t = 0; t <= 100; t++) {
    const vol = 4.2 - ((rParam * 0.5) * t) - (rParam * 1.5);
    data.push({ t, v: Math.max(2.5, vol) });
  }
  return data;
};

// --- HELPER: MAIN CALIBRATION CHART ---
const MainChart = ({ modelData, realData, particles, currentStep, showReal }) => {
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 140, bottom: 30, left: 40 };

  const xScale = (t) => padding.left + (t / 100) * (width - padding.left - padding.right);
  const yScale = (v) => height - padding.bottom - ((v - 2.5) / (4.5 - 2.5)) * (height - padding.top - padding.bottom);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm relative flex-1 min-h-[220px]">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid Lines */}
        {[2.5, 3.0, 3.5, 4.0, 4.5].map(v => (
          <g key={`h-${v}`}>
            <line x1={padding.left} y1={yScale(v)} x2={width - padding.right} y2={yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padding.left - 5} y={yScale(v) + 3} fill="#64748b" textAnchor="end" fontSize="10" fontFamily="monospace">{v.toFixed(1)}</text>
          </g>
        ))}
        {[0, 20, 40, 60, 80, 100].map(t => (
          <line key={`v-${t}`} x1={xScale(t)} y1={height - padding.bottom} x2={xScale(t)} y2={padding.top} stroke="#f1f5f9" strokeDasharray="4 4" />
        ))}

        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="2" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="2" />
        
        <text x={padding.left + (width - padding.left - padding.right) / 2} y={height - 5} fill="#64748b" textAnchor="middle" fontSize="10" fontWeight="600">Time (Epochs)</text>
        <text x={12} y={height / 2} fill="#64748b" textAnchor="middle" fontSize="10" fontWeight="600" transform={`rotate(-90, 12, ${height / 2})`}>Voltage (V)</text>

        {/* 1. Real World Data (Emerald Solid - only shown after upload) */}
        {showReal && (
          <path
            d={`M ${realData.map(d => `${xScale(d.t)},${yScale(d.v)}`).join(' L ')}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}

        {/* 2. Dynamic Model Curve (Blue dashed) */}
        <path
          d={`M ${modelData.map(d => `${xScale(d.t)},${yScale(d.v)}`).join(' L ')}`}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />

        {/* 3. Particles (Orange Comet Tail - Clean & Sparse) */}
        {particles.map((p, i) => (
          <circle
            key={`p-${i}`}
            cx={xScale(p.t)}
            cy={yScale(p.v)}
            r={2.5 - (p.age * 0.2)} // Radius shrinks as particle ages
            fill="#f97316"
            opacity={0.8 - (p.age * 0.1)} // Opacity fades smoothly
          />
        ))}

        {/* Current Time Indicator */}
        {currentStep > 0 && currentStep < 100 && (
          <g transform={`translate(${xScale(currentStep)}, 0)`}>
            <line x1="0" y1={padding.top} x2="0" y2={height - padding.bottom} stroke="#f97316" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="-18" y={padding.top - 12} width="36" height="14" fill="#f97316" rx="3" />
            <text x="0" y={padding.top - 2} fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">t={currentStep}</text>
          </g>
        )}

        {/* Legend */}
        <g transform={`translate(${width - 130}, ${padding.top})`}>
          <rect width="120" height="75" fill="white" rx="6" stroke="#e2e8f0" strokeWidth="1" shadow="sm" />
          <line x1="10" y1="20" x2="30" y2="20" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
          <text x="38" y="23" fill="#475569" fontSize="10" fontWeight="600">Sim Model (θ)</text>

          <line x1="10" y1="40" x2="30" y2="40" stroke="#10b981" strokeWidth="2" />
          <text x="38" y="43" fill="#475569" fontSize="10" fontWeight="600">Empirical Log</text>

          <circle cx="20" cy="60" r="2.5" fill="#f97316" opacity="0.8"/>
          <text x="38" y="63" fill="#475569" fontSize="10" fontWeight="600">SMC Particles</text>
        </g>
      </svg>
    </div>
  );
};

// --- HELPER: RMSE CONVERGENCE CHART ---
const RMSEChart = ({ history }) => {
  const width = 800;
  const height = 100;
  const padding = { top: 15, right: 140, bottom: 25, left: 40 };

  const xScale = (t) => padding.left + (t / 100) * (width - padding.left - padding.right);
  const yScale = (v) => height - padding.bottom - (v / 0.4) * (height - padding.top - padding.bottom);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm relative h-28 mt-4 shrink-0">
      <div className="absolute top-2 left-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Residual Error (RMSE)</div>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1" />
        
        {/* Baseline (Zero Error) */}
        <line x1={padding.left} y1={yScale(0)} x2={width - padding.right} y2={yScale(0)} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
        <text x={padding.left - 5} y={yScale(0) + 3} fill="#64748b" textAnchor="end" fontSize="9" fontFamily="monospace">0.0</text>
        <text x={padding.left - 5} y={yScale(0.4) + 3} fill="#64748b" textAnchor="end" fontSize="9" fontFamily="monospace">0.4</text>

        {/* Data Line */}
        {history.length > 0 && (
          <path
            d={`M ${history.map(d => `${xScale(d.t)},${yScale(d.error)}`).join(' L ')}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
        
        {/* Fill Area */}
        {history.length > 0 && (
          <path
            d={`M ${xScale(history[0].t)},${yScale(0)} L ${history.map(d => `${xScale(d.t)},${yScale(d.error)}`).join(' L ')} L ${xScale(history[history.length-1].t)},${yScale(0)} Z`}
            fill="rgba(239, 68, 68, 0.1)"
          />
        )}
      </svg>
    </div>
  );
};


// --- MAIN APPLICATION ---

export default function HelixTwinL4() {
  const [step, setStep] = useState(0); // 0: Idle, 1: Uploading, 2: Uploaded, 3: Running, 4: Converged
  const [simIndex, setSimIndex] = useState(0);
  
  const [rParam, setRParam] = useState(0.100); // Initial Theory Parameter
  const [modelData, setModelData] = useState([]);
  const [realData, setRealData] = useState([]);
  const [particles, setParticles] = useState([]);
  const [rmseHistory, setRmseHistory] = useState([]);
  
  const [logs, setLogs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sysStatus, setSysStatus] = useState("Awaiting Telemetry Data");

  // Refs for interval access
  const realDataRef = useRef([]);

  // Init Data
  useEffect(() => {
    const rData = generateRealWorldData();
    setRealData(rData);
    realDataRef.current = rData;
    setModelData(generateModelCurve(0.100));
  }, []);

  const addLog = (msg, type) => {
    setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 }) }, ...prev]);
  };

  const handleUpload = () => {
    setStep(1);
    addLog("Initiating datastream link...", "system");
    setSysStatus("Parsing CSV Payload...");
    
    setTimeout(() => {
      setStep(2);
      addLog("Ingested 'thermal_chamber_log_v2.csv' (10,000 pts)", "success");
      setSysStatus("Empirical Data Loaded. Ready for SMC Filter.");
    }, 1500);
  };

  // --- CORE BAYESIAN FILTER SIMULATION ---
  const runCalibration = () => {
    setStep(3);
    setSimIndex(0);
    setParticles([]);
    setRmseHistory([]);
    setSysStatus("Initializing Sequential Monte Carlo...");
    addLog("Spawning Particle Cloud. Objective: Minimize L2 Norm.", "system");

    let t = 0;
    let currentR = 0.100;
    const targetR = 0.150;

    const interval = setInterval(() => {
      t += 1;
      
      // 1. Parameter Evolution (Algorithm converging)
      const progress = t / 100;
      const convergence = 1 - Math.pow(1 - progress, 3); // Ease-out curve
      currentR = 0.100 + ((targetR - 0.100) * convergence);
      setRParam(currentR);
      
      // Update Model line visually
      const currentModel = generateModelCurve(currentR);
      setModelData(currentModel);

      // 2. Metrics Updates
      if (t === 15) { setSysStatus("Resampling Particles (SIR)..."); addLog("Evaluating posterior density...", "info"); }
      if (t === 45) { setSysStatus("Minimizing Residual Error..."); addLog("Gradient descent shifting R_internal...", "info"); }
      if (t === 75) { setSysStatus("Fine-tuning local optima..."); addLog("Approaching convergence bound.", "info"); }

      // 3. Generate Clean Particle Swarm (Comet Tail Effect)
      const variance = 0.25 * (1 - convergence) + 0.01; 
      const baseVal = currentModel[t].v;
      const realVal = realDataRef.current[t].v;

      // Only generate 6 tight particles per frame using pseudo-Gaussian distribution
      const newParticles = Array.from({length: 6}).map(() => {
        const randNormal = (Math.random() + Math.random() + Math.random() - 1.5) * 2;
        const pVal = baseVal + randNormal * variance;
        return { t, v: pVal, age: 0 };
      });

      setParticles(prev => {
        // Age existing particles and drop them after 8 ticks to create a fading tail
        const aged = prev.map(p => ({ ...p, age: p.age + 1 })).filter(p => p.age < 8);
        return [...aged, ...newParticles];
      });

      // 4. Calculate RMSE for this epoch
      const error = Math.abs(baseVal - realVal) * (1 - convergence) + (Math.random() * 0.03);
      setRmseHistory(prev => [...prev, { t, error }]);

      setSimIndex(t);

      // 5. Termination
      if (t >= 100) {
        clearInterval(interval);
        setStep(4);
        setParticles([]); // Clear particles upon convergence for a pristine final state
        setSysStatus("Calibration Converged. Parameters Locked.");
        addLog("SMC Filter Complete. Error within tolerance (< 1%).", "success");
      }
    }, 55); // Slightly slower for smoother observation
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden text-[11px]">
      
      {/* SIDEBAR */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)]`}>
        <div className="h-12 flex items-center justify-between px-3 border-b border-slate-100 bg-slate-50/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center shadow shadow-orange-600/30">
                <Target className="text-white w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-800">Helix<span className="text-orange-600">Twin</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
            <Menu className="w-4 h-4 mx-auto" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
           {isSidebarOpen && (
             <>
                {/* Math Grounding Panel */}
                <div className="bg-slate-900 rounded-lg p-3 text-slate-200 shadow-inner">
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Optimization Objective</div>
                   <div className="font-serif text-xs text-center py-2 bg-slate-800/50 rounded border border-slate-700/50 tracking-wider">
                      θ* = arg min<sub>θ</sub> || y<sub>real</sub> - y<sub>sim</sub>(θ) ||²
                   </div>
                </div>

                {/* Step 1: Upload */}
                <div className={`p-3 rounded-lg border transition-all ${step === 0 ? 'bg-white border-orange-400 shadow-md ring-1 ring-orange-100' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                   <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1 rounded ${step === 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'}`}><Upload className="w-3.5 h-3.5" /></div>
                      <span className={`font-bold ${step === 0 ? 'text-slate-900' : 'text-slate-600'}`}>1. Ingest Log Data</span>
                   </div>
                   <p className="text-[10px] text-slate-500 mb-3 leading-tight">Load thermal chamber telemetry to compute residuals.</p>
                   
                   {step === 0 && (
                     <button onClick={handleUpload} className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 rounded text-white font-semibold transition-all shadow text-[11px]">Select File...</button>
                   )}
                   {step === 1 && (
                     <div className="w-full py-1.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-semibold flex items-center justify-center gap-2 text-[11px]">
                       <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Parsing...
                     </div>
                   )}
                   {step >= 2 && (
                     <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-1.5 rounded font-medium">
                        <FileText className="w-3 h-3 text-emerald-600" /> thermal_chamber_v2.csv
                     </div>
                   )}
                </div>

                {/* Step 2: Calibrate */}
                <div className={`p-3 rounded-lg border transition-all ${step === 2 ? 'bg-white border-orange-400 shadow-md ring-1 ring-orange-100' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                   <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1 rounded ${step === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'}`}><Cpu className="w-3.5 h-3.5" /></div>
                      <span className={`font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-600'}`}>2. Run SMC Filter</span>
                   </div>
                   <p className="text-[10px] text-slate-500 mb-3 leading-tight">Execute Sequential Monte Carlo to align simulation parameters.</p>
                   <button
                     onClick={runCalibration}
                     disabled={step !== 2}
                     className={`w-full py-1.5 rounded font-semibold flex items-center justify-center gap-1.5 transition-all text-[11px] ${step === 2 ? 'bg-orange-600 hover:bg-orange-700 text-white shadow' : step === 3 ? 'bg-orange-100 text-orange-600 cursor-wait' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
                   >
                     {step === 3 ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Calibrating...</> : 'Start Calibration'}
                   </button>
                </div>

                {/* Live Parameter State */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Database className="w-3 h-3"/> Internal State</div>
                   <div className="flex justify-between items-center mb-1.5">
                      <span className="text-slate-600 font-medium text-[11px]">R_internal (Ω)</span>
                      <div className="flex items-center gap-1.5">
                         <span className="text-slate-400 text-[10px] line-through">0.100</span>
                         <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                         <span className={`font-mono font-bold text-xs ${step === 4 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {rParam.toFixed(4)}
                         </span>
                      </div>
                   </div>
                   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-75" style={{ width: `${((rParam - 0.1) / 0.05) * 100}%` }}></div>
                   </div>
                </div>
             </>
           )}
        </div>

        {/* System Logs */}
        <div className="h-32 border-t border-slate-200 bg-slate-900 p-2 overflow-hidden flex flex-col">
           <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 px-1 flex items-center gap-1.5 tracking-wider">
             <Terminal className="w-3 h-3" /> System Log
           </div>
           <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1 px-1">
              {logs.map((l, i) => (
                <div key={i} className={`flex gap-1.5 ${l.type === 'success' ? 'text-emerald-400' : l.type === 'info' ? 'text-blue-400' : 'text-slate-300'}`}>
                   <span className="text-slate-600 shrink-0">[{l.time}]</span>
                   <span>{l.msg}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative bg-[#f8fafc]">
        {/* Top Header Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>

        {/* Header */}
        <header className="h-12 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
           <div>
              <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 Layer 4: Real-to-Sim Calibration Engine
                 {step === 4 && <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider font-bold">Converged</span>}
              </h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Status</div>
                 <div className={`font-mono font-bold text-[11px] ${step === 4 ? 'text-emerald-600' : 'text-slate-600'}`}>{sysStatus}</div>
              </div>
              <div className={`w-1.5 h-6 rounded-full ${step === 4 ? 'bg-emerald-500' : step === 3 ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`}></div>
           </div>
        </header>

        {/* Charts Container - Added overflow-y-auto to allow scrolling */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col relative z-10 max-w-[1200px] mx-auto w-full">
           
           <div className="flex flex-col relative min-h-min pb-8">
              {/* Primary Visualizer */}
              <div className="flex items-center gap-2 mb-2">
                 <BarChart2 className="w-4 h-4 text-slate-500" />
                 <h2 className="font-bold text-slate-700 text-xs">Voltage vs Time (Sim vs Real)</h2>
              </div>
              
              <MainChart
                 modelData={modelData}
                 realData={realData}
                 particles={particles}
                 currentStep={simIndex}
                 showReal={step >= 2}
              />

              {/* Secondary Visualizer */}
              <RMSEChart history={rmseHistory} />

              {/* Success Overlay */}
              {step === 4 && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg mt-8">
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-2xl flex flex-col items-center ring-4 ring-emerald-50 animate-in fade-in zoom-in duration-300">
                       <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                       </div>
                       <h2 className="text-base font-bold text-slate-800 mb-1">Digital Twin Synchronized</h2>
                       <p className="text-slate-500 text-[11px] text-center mb-4 max-w-[240px] leading-relaxed">
                          Physics parameters optimized to empirical data. <br/>
                          <span className="font-bold text-emerald-600">Residual L2 Norm reduced to 0.4%</span>
                       </p>
                       <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded text-[11px] font-bold shadow-lg transition-all flex items-center gap-2">
                          Commit & Launch Layer 5 <ArrowRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
