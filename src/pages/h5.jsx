import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Play, Pause, AlertTriangle, Heart, Wind, Cpu, Settings,
  ShieldAlert, Terminal, Layers, Menu, ActivitySquare, Sliders,
  Zap, ToggleLeft, ToggleRight, RadioReceiver, CheckCircle2, Target
} from 'lucide-react';

// --- SIMULATION CONFIG ---
const TICK_RATE_MS = 50; 
const TARGET_PEEP = 5; 
const TARGET_PIP = 20; 
const BREATH_RATE = 12; 

// --- HELPER: HIGH-FIDELITY REAL-TIME CHART ---
const LiveChart = ({ data, color, min, max, label, unit, threshold = null }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    
    // High-DPI Canvas Setup for crisp lines adapting to dynamic flex size
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Subtle Clinical Gridlines
    ctx.strokeStyle = '#f1f5f9'; // slate-100
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal grid
    for(let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    // Vertical grid (moving effect)
    const tickOffset = (data.length % 10) * (width / 100);
    for(let i = 0; i <= 10; i++) {
      const x = (width / 10) * i - tickOffset;
      if (x >= 0) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
    }
    ctx.stroke();

    // Draw Safety Threshold Line
    if (threshold !== null) {
      const y = height - ((threshold - min) / (max - min)) * height;
      ctx.strokeStyle = '#ef4444'; // red-500
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]); // reset
    }

    // Draw Active Data Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    
    // Light-mode Glow Effect
    ctx.shadowColor = `${color}60`;
    ctx.shadowBlur = 6;
    
    ctx.beginPath();

    const displayPts = 100;
    const stepX = width / (displayPts - 1);
    const renderData = data.slice(-displayPts);

    renderData.forEach((val, i) => {
      const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
      const x = i * stepX;
      const y = height - (normalized * height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient Fill
    ctx.shadowBlur = 0; // Turn off shadow for fill
    ctx.lineTo((renderData.length - 1) * stepX, height);
    ctx.lineTo(0, height);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}20`); // 12% opacity
    gradient.addColorStop(1, `${color}00`); // 0% opacity
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [data, color, min, max, threshold]);

  return (
    <div ref={containerRef} className="relative flex-1 w-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="text-[10px] font-bold font-mono text-slate-600 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md border border-slate-100 shadow-sm">
          {label}
        </div>
        {threshold !== null && (
          <div className="text-[10px] font-bold font-mono text-red-600 bg-red-50/95 backdrop-blur px-2.5 py-1 rounded-md border border-red-100 shadow-sm flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> LIMIT: {threshold}
          </div>
        )}
      </div>
      <div className="absolute bottom-3 right-3 flex items-baseline gap-1 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
        <span className="text-base font-extrabold font-mono text-slate-800 tracking-tight">
          {data.length > 0 ? data[data.length - 1].toFixed(1) : 0}
        </span>
        <span className="text-slate-400 text-[10px] font-bold">{unit}</span>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---
export default function HelixTwinL5() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState([]);

  // Twin States
  const [pressure, setPressure] = useState(Array(100).fill(0)); 
  const [flow, setFlow] = useState(Array(100).fill(0)); 
  const [volume, setVolume] = useState(Array(100).fill(0)); 
  const [valveState, setValveState] = useState(0); 
  const [turbineSpeed, setTurbineSpeed] = useState(0); 
  const [breathPhase, setBreathPhase] = useState('EXPIRATION'); 
  const [alarm, setAlarm] = useState(null);

  // "What-If" Analysis Parameters
  const [fidelity, setFidelity] = useState('first-principles');
  const [airwayRes, setAirwayRes] = useState(5); // cmH2O/L/s
  const [battDegradation, setBattDegradation] = useState(0); // %

  // Fault Injection
  const [coughTrigger, setCoughTrigger] = useState(false);
  const [leakTrigger, setLeakTrigger] = useState(false);

  const addLog = (msg, type) => {
    setLogs(prev => [{ msg, type, time: new Date().toISOString().substring(11, 23) }, ...prev].slice(0, 50));
  };

  // Toggle Fidelity Engine
  const handleFidelityToggle = () => {
    const newMode = fidelity === 'empirical' ? 'first-principles' : 'empirical';
    setFidelity(newMode);
    addLog(`[SYSTEM] Switched Simulation Engine to: ${newMode === 'empirical' ? 'O(1) CSV Replay' : 'O(n²) OpenModelica + BioGears'}`, "system");
  };

  // --- THE TRI-BRID LOOP (FIRMWARE + PHYSICS + BIO) ---
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => t + TICK_RATE_MS);

        let newTurbineCmd = turbineSpeed;
        let newValveCmd = valveState;
        let newPhase = breathPhase;
        let pPatient = volume[volume.length - 1] / 50; // Compliance = 50 mL/cmH2O

        // 1. BIO-EVENT INTERRUPT (Patient Cough)
        if (coughTrigger) {
          pPatient += 80; // Massive pressure spike
          setCoughTrigger(false);
          addLog("BIO-EVENT: Spontaneous Patient Cough Detected", "warning");
        }

        // 2. FIRMWARE WATCHDOG (Safety Validation)
        const currentP = pressure[pressure.length - 1];
        if (currentP > 40) {
          if (alarm !== "HIGH PRESSURE") {
            addLog("[CRITICAL] Safety limit exceeded. Firmware watchdog triggered pressure relief in 8ms.", "error");
            setAlarm("HIGH PRESSURE");
          }
          newTurbineCmd = 0;
          newValveCmd = 100; // EMERGENCY RELIEF
          newPhase = 'EXPIRATION';
        } else {
          if (alarm === "HIGH PRESSURE" && currentP < 10) {
            setAlarm(null);
            addLog("[RECOVERY] Pressure normalized. Safety interlock reset.", "success");
          }

          // Normal Firmware Logic (Time-Cycled)
          if (!alarm) {
            const cycleTime = 60000 / BREATH_RATE; 
            const inspTime = cycleTime / 3; 
            const timer = (Date.now()) % cycleTime;

            if (timer < inspTime) {
              if (newPhase !== 'INSPIRATION') {
                newPhase = 'INSPIRATION';
                addLog("[FIRMWARE] Triggered INSPIRATION phase", "system");
              }
              // PID Control influenced by battery degradation
              const maxTurbine = 40000 * (1 - (battDegradation / 100) * 0.3);
              if (currentP < TARGET_PIP) newTurbineCmd = Math.min(newTurbineCmd + 800, maxTurbine);
              else newTurbineCmd = Math.max(newTurbineCmd - 500, 5000);
              newValveCmd = 0; 
            } else {
              if (newPhase !== 'EXPIRATION') {
                newPhase = 'EXPIRATION';
                addLog("[FIRMWARE] Triggered EXPIRATION phase", "system");
              }
              newTurbineCmd = 2000; 
              newValveCmd = 100; 
            }
          }
        }

        // 3. PHYSICS ENGINE (RC Circuit Pneumatics)
        let pTurbine = (newTurbineCmd / 40000) * 60; 

        if (leakTrigger) pTurbine *= 0.4; // Pressure drop from leak

        // Calculate flow based on dynamic resistance slider
        let instantaneousFlow = 0;
        if (newValveCmd > 50) {
          // Exhalation: Flow out driven by patient pressure vs PEEP
          instantaneousFlow = -1 * ((pPatient - TARGET_PEEP) / airwayRes); 
        } else {
          // Inspiration: Flow in driven by turbine vs patient pressure
          instantaneousFlow = (pTurbine - pPatient) / airwayRes; 
        }

        // Integrate Flow to get Volume (mL)
        const newVol = Math.max(0, volume[volume.length - 1] + (instantaneousFlow * (TICK_RATE_MS / 1000) * 1000)); 
        const newPress = pTurbine > 0 && newValveCmd < 50 ? pTurbine : Math.max(TARGET_PEEP, pPatient);

        // UPDATE STATE
        setTurbineSpeed(newTurbineCmd);
        setValveState(newValveCmd);
        setBreathPhase(newPhase);

        setPressure(prev => [...prev.slice(-99), newPress]);
        setFlow(prev => [...prev.slice(-99), instantaneousFlow * 60]); // L/min
        setVolume(prev => [...prev.slice(-99), newVol]);

      }, TICK_RATE_MS);
    }
    return () => clearInterval(interval);
  }, [isRunning, pressure, volume, breathPhase, alarm, coughTrigger, leakTrigger, airwayRes, battDegradation]);


  return (
    <div className="w-screen h-screen flex bg-slate-50 text-slate-800 font-sans overflow-hidden">
        
      {/* SIDEBAR: MISSION CONTROL */}
      <div className="w-[360px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 h-full">
        
        {/* Flat White Sidebar Header matching the uploaded image */}
        <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ea580c] rounded flex items-center justify-center shadow-sm">
              <Target className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">
              Helix<span className="text-[#ea580c]">Twin</span>
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

          {/* Simulation Master */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" /> Simulation Master
            </div>
            
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isRunning 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_8px_20px_-4px_rgba(245,158,11,0.4)] hover:shadow-[0_10px_25px_-4px_rgba(245,158,11,0.5)]' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)] hover:shadow-[0_10px_25px_-4px_rgba(16,185,129,0.5)]'
              }`}
            >
              {isRunning ? <><Pause className="w-4 h-4 fill-current" /> SUSPEND ENGINE</> : <><Play className="w-4 h-4 fill-current" /> INITIALIZE ENGINE</>}
            </button>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] font-semibold text-slate-700">Simulation Fidelity Engine</span>
              </div>
              <button 
                onClick={handleFidelityToggle}
                className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group shadow-sm"
              >
                <span className="text-xs font-mono text-slate-600 group-hover:text-blue-700 font-bold transition-colors">
                  {fidelity === 'empirical' ? 'Empirical (CSV)' : '1st-Principles (BioGears)'}
                </span>
                {fidelity === 'empirical' ? <ToggleLeft className="w-6 h-6 text-slate-400" /> : <ToggleRight className="w-6 h-6 text-blue-600 drop-shadow-sm" />}
              </button>
            </div>

            <div className="mt-4 flex justify-between text-[10px] font-mono font-bold text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span>UPTIME: {(time / 1000).toFixed(1)}s</span>
              <span>TICK: {TICK_RATE_MS}ms</span>
            </div>
          </div>

          {/* What-If Parameters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#ea580c]" /> Runtime What-If Parameters
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-slate-700 font-semibold">Airway Resistance (R_aw)</span>
                  <span className="text-[#ea580c] font-bold font-mono bg-orange-50 px-2 py-0.5 rounded-md">{airwayRes} <span className="text-[10px]">cmH2O/L/s</span></span>
                </div>
                <input 
                  type="range" min="1" max="20" step="1" value={airwayRes} onChange={(e) => setAirwayRes(Number(e.target.value))}
                  className="w-full accent-[#ea580c] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                />
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-slate-700 font-semibold">Battery Degradation</span>
                  <span className="text-[#ea580c] font-bold font-mono bg-orange-50 px-2 py-0.5 rounded-md">{battDegradation}%</span>
                </div>
                <input 
                  type="range" min="0" max="80" step="5" value={battDegradation} onChange={(e) => setBattDegradation(Number(e.target.value))}
                  className="w-full accent-[#ea580c] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Fault Injection */}
          <div className="bg-gradient-to-br from-red-50/50 to-white p-5 rounded-2xl border border-red-100 shadow-[0_8px_30px_rgba(239,68,68,0.05)]">
            <div className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Fault Injection
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setCoughTrigger(true)}
                className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <Wind className="w-4 h-4" /> Trigger Patient Cough
              </button>
              <button
                onClick={() => setLeakTrigger(!leakTrigger)}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border shadow-sm ${
                  leakTrigger 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-transparent shadow-[0_8px_20px_-4px_rgba(239,68,68,0.4)]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:shadow-md'
                }`}
              >
                <ShieldAlert className="w-4 h-4" /> {leakTrigger ? 'ISOLATE LEAK' : 'SIMULATE AIR LEAK'}
              </button>
            </div>
          </div>

          {/* Live System Status */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-500 flex items-center gap-2 font-sans font-semibold text-[13px]"><Cpu className="w-4 h-4 text-blue-400" /> F/W STATE</span>
              <span className={`font-bold px-2.5 py-1 rounded-md text-[10px] tracking-wide ${breathPhase === 'INSPIRATION' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-[#ea580c]'}`}>{breathPhase}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-500 flex items-center gap-2 font-sans font-semibold text-[13px]"><Wind className="w-4 h-4 text-slate-400" /> BLOWER</span>
              <span className="text-slate-800 font-extrabold text-sm">{Math.round(turbineSpeed)} <span className="text-[10px] text-slate-400 font-bold">RPM</span></span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-500 flex items-center gap-2 font-sans font-semibold text-[13px]"><Settings className="w-4 h-4 text-slate-400" /> VALVE</span>
              <span className={`font-bold px-2.5 py-1 rounded-md text-[10px] tracking-wide transition-all ${
                valveState === 0 
                  ? 'bg-slate-100 text-slate-500' 
                  : (alarm === 'HIGH PRESSURE' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-emerald-100 text-emerald-700')
              }`}>
                {valveState === 0 ? 'CLOSED' : (alarm === 'HIGH PRESSURE' ? 'OPEN (EMERGENCY RELIEF)' : 'OPEN')}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN VISUALIZATION AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 h-full">

        {/* Flat White Main Header matching the uploaded image */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between z-10 shrink-0">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            Layer 5: Co-Simulation Engine
          </h1>
          <div className="flex items-center gap-4">
            {alarm ? (
              <div className="px-5 py-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-lg flex items-center gap-2 animate-pulse shadow-sm">
                <ShieldAlert className="w-4 h-4" /> [CRITICAL] {alarm}
              </div>
            ) : (
              <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> SYSTEM NOMINAL
              </div>
            )}
          </div>
        </div>

        {/* Graphs Grid */}
        <div className="flex-1 px-10 py-8 flex flex-col gap-6 overflow-hidden">
          
          <div className="flex flex-col gap-2 relative flex-1 min-h-0">
            <div className="flex justify-between items-end px-1 shrink-0">
              <span className="text-[13px] font-extrabold text-blue-600 flex items-center gap-2 tracking-widest uppercase">
                <Activity className="w-4 h-4" /> Airway Pressure
              </span>
              <span className="text-[11px] text-slate-400 font-mono tracking-widest font-bold bg-white px-2 py-0.5 rounded border border-slate-200">TGT: {TARGET_PIP} cmH2O</span>
            </div>
            <LiveChart data={pressure} color="#2563eb" min={0} max={60} label="SNSR_P_AW" unit="cmH2O" threshold={40} />
          </div>

          <div className="flex flex-col gap-2 relative flex-1 min-h-0">
            <div className="flex justify-between items-end px-1 shrink-0">
              <span className="text-[13px] font-extrabold text-emerald-600 flex items-center gap-2 tracking-widest uppercase">
                <Wind className="w-4 h-4" /> Mass Air Flow
              </span>
            </div>
            <LiveChart data={flow} color="#10b981" min={-80} max={80} label="SNSR_Q_FLOW" unit="L/min" />
          </div>

          <div className="flex flex-col gap-2 relative flex-1 min-h-0">
            <div className="flex justify-between items-end px-1 shrink-0">
              <span className="text-[13px] font-extrabold text-[#ea580c] flex items-center gap-2 tracking-widest uppercase">
                <Heart className="w-4 h-4" /> Patient Lung Volume
              </span>
              <span className="text-[11px] text-slate-400 font-mono tracking-widest font-bold bg-white px-2 py-0.5 rounded border border-slate-200">CMPL: 50 mL/cmH2O</span>
            </div>
            <LiveChart data={volume} color="#ea580c" min={0} max={1000} label="MDL_V_LUNG" unit="mL" />
          </div>

        </div>

        {/* Terminal Event Log */}
        <div className="h-52 border-t border-slate-200 bg-white flex flex-col font-mono shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20 shrink-0">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex items-center justify-between uppercase tracking-widest">
            <span className="flex items-center gap-2"><Terminal className="w-4 h-4 text-blue-600" /> System Event Log</span>
            <span className="text-[9px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">Output Stream Active</span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto text-xs space-y-2 custom-scrollbar">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-4 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <span className="text-slate-400 shrink-0 font-bold">[{l.time}]</span>
                <span className={
                  l.type === 'error' ? 'text-red-600 font-bold bg-red-50 px-2 rounded' :
                  l.type === 'warning' ? 'text-[#ea580c] font-semibold' :
                  l.type === 'system' ? 'text-blue-600 font-medium' :
                  'text-emerald-600 font-medium'
                }>{l.msg}</span>
              </div>
            ))}
            <div className="text-slate-400 animate-pulse pl-3 font-bold">_</div>
          </div>
        </div>

      </div>
    </div>
  );
}
