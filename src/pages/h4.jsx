import React, { useState, useEffect, useRef } from 'react';
import {
    Activity,
    Upload,
    RefreshCw,
    TrendingUp,
    FileText,
    CheckCircle,
    AlertTriangle,
    Play,
    Cpu,
    Target,
    ArrowRight,
    Database,
    Filter
} from 'lucide-react';

// --- MOCK DATA GENERATORS ---

// 1. Theoretical Model (Datasheet perfect world)
const generateTheoreticalCurve = () => {
    const data = [];
    for (let t = 0; t <= 100; t++) {
        // V = V0 - I*R - (k*t)
        const vol = 4.2 - (0.05 * t) - 0.1;
        data.push({ t, v: Math.max(2.8, vol) });
    }
    return data;
};

// 2. "Real World" Data (Noisier, steeper drop due to higher Resistance)
const generateRealWorldData = () => {
    const data = [];
    for (let t = 0; t <= 100; t++) {
        // Higher degradation slope, plus random noise
        const noise = (Math.random() - 0.5) * 0.05;
        const vol = 4.2 - (0.065 * t) - 0.2 + noise;
        data.push({ t, v: Math.max(2.5, vol) });
    }
    return data;
};

// --- HELPER: SVG CHART COMPONENT ---
const CalibrationChart = ({ theoretical, real, particles, currentStep }) => {
    const width = 600;
    const height = 300;
    const padding = 40;

    // Scales
    const xScale = (t) => padding + (t / 100) * (width - 2 * padding);
    const yScale = (v) => height - padding - ((v - 2.5) / (4.5 - 2.5)) * (height - 2 * padding);

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="bg-slate-900 rounded-lg border border-slate-700 shadow-inner">
            {/* Grid Lines */}
            {[2.5, 3.0, 3.5, 4.0, 4.5].map(v => (
                <line key={v} x1={padding} y1={yScale(v)} x2={width - padding} y2={yScale(v)} stroke="#334155" strokeDasharray="4 4" />
            ))}
            {[0, 20, 40, 60, 80, 100].map(t => (
                <line key={t} x1={xScale(t)} y1={height - padding} x2={xScale(t)} y2={padding} stroke="#334155" strokeDasharray="4 4" />
            ))}

            {/* Axis Labels */}
            <text x={width / 2} y={height - 10} fill="#94a3b8" textAnchor="middle" fontSize="10">Time (minutes)</text>
            <text x={10} y={height / 2} fill="#94a3b8" textAnchor="middle" fontSize="10" transform={`rotate(-90, 10, ${height / 2})`}>Voltage (V)</text>

            {/* 1. Theoretical Curve (Blue dashed) */}
            <polyline
                points={theoretical.map(d => `${xScale(d.t)},${yScale(d.v)}`).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5 5"
                opacity="0.6"
            />

            {/* 2. Real World Data (Green Solid) - Only draw up to current step during sim */}
            <polyline
                points={real.slice(0, currentStep).map(d => `${xScale(d.t)},${yScale(d.v)}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* 3. Particles (The Bayesian Filter Beliefs) */}
            {particles.map((p, i) => (
                <circle
                    key={i}
                    cx={xScale(currentStep)}
                    cy={yScale(p.val)}
                    r={p.weight * 5} // Size depends on probability weight
                    fill="#ef4444"
                    opacity="0.6"
                />
            ))}

            {/* Legend */}
            <g transform={`translate(${width - 150}, ${padding})`}>
                <rect width="140" height="70" fill="#1e293b" rx="4" stroke="#475569" />
                <line x1="10" y1="20" x2="30" y2="20" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                <text x="35" y="24" fill="#94a3b8" fontSize="10">Theoretical (Datasheet)</text>

                <line x1="10" y1="40" x2="30" y2="40" stroke="#10b981" strokeWidth="2" />
                <text x="35" y="44" fill="#94a3b8" fontSize="10">Real Data (Log)</text>

                <circle cx="20" cy="60" r="3" fill="#ef4444" />
                <text x="35" y="64" fill="#94a3b8" fontSize="10">Particle Estimates</text>
            </g>
        </svg>
    );
};

// --- MAIN APPLICATION ---

export default function HelixTwinL4() {
    const [step, setStep] = useState(0); // 0: Idle, 1: Upload, 2: Running, 3: Converged
    const [simIndex, setSimIndex] = useState(0);
    const [theoreticalData, setTheoreticalData] = useState([]);
    const [realData, setRealData] = useState([]);
    const [particles, setParticles] = useState([]);
    const [logs, setLogs] = useState([]);
    const [calibratedParam, setCalibratedParam] = useState(0.1); // Initial Internal Resistance (Ohms)

    // Initialize Data
    useEffect(() => {
        setTheoreticalData(generateTheoreticalCurve());
        setRealData(generateRealWorldData());
    }, []);

    const addLog = (msg, type) => {
        setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }) }, ...prev]);
    };

    // --- CORE LOGIC: PARTICLE FILTER SIMULATION ---
    const runCalibration = () => {
        setStep(2);
        setSimIndex(0);
        setParticles(Array(20).fill(0).map(() => ({ val: 4.0, weight: 1 }))); // Init particles
        addLog("Bayesian Filter Initialized. Spawning 20 particles...", "system");

        const interval = setInterval(() => {
            setSimIndex(curr => {
                if (curr >= 100) {
                    clearInterval(interval);
                    setStep(3);
                    addLog("Calibration Complete. Parameter Converged.", "success");
                    return curr;
                }

                const t = curr + 1;
                const realVal = 4.2 - (0.065 * t) - 0.2; // The "Truth" at this step

                // Update Particles (Predict -> Update -> Resample logic simulated)
                setParticles(prev => {
                    // 1. Prediction (Move particles forward based on different resistance hypotheses)
                    const nextParticles = prev.map(p => {
                        // Each particle represents a guess at the voltage
                        const drift = (Math.random() - 0.5) * 0.1;
                        // They naturally tend to drift down
                        return { ...p, val: p.val - 0.06 + drift };
                    });

                    // 2. Update (Weight based on closeness to Real Data)
                    const weighted = nextParticles.map(p => {
                        const error = Math.abs(p.val - realVal);
                        // Gaussian likelihood
                        const weight = Math.exp(-(error * error) / 0.01);
                        return { val: p.val, weight: Math.max(0.1, weight) };
                    });

                    // 3. Resample (Simulated visual convergence)
                    // Move particles closer to the high-weight area
                    const bestParticle = weighted.reduce((max, p) => p.weight > max.weight ? p : max, weighted[0]);

                    // Update the "Calibrated Parameter" display based on the trend
                    if (t % 10 === 0) {
                        // Simulating the discovery that Resistance is higher than expected
                        setCalibratedParam(prevR => prevR + 0.005);
                    }

                    return weighted.map(p => ({
                        val: (p.val * 0.8) + (bestParticle.val * 0.2) + (Math.random() - 0.5) * 0.05,
                        weight: p.weight
                    }));
                });

                return t;
            });
        }, 50); // Speed of simulation
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* SIDEBAR */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-2xl">
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                        <Filter className="w-6 h-6" /> Helix-Twin
                    </div>
                    <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Layer 4: Calibration Matrix</div>
                </div>

                <div className="p-4 space-y-6">

                    {/* Step 1: Upload */}
                    <div className={`p-4 rounded border transition-all ${step === 0 ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Upload className={`w-4 h-4 ${step === 0 ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="text-sm font-bold text-slate-200">1. Ingest Prototype Log</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Upload CSV telemetry from physical device test (e.g., thermal chamber run).</p>
                        {step === 0 ? (
                            <button
                                onClick={() => { setStep(1); addLog("Ingested 'prototype_log_v1.csv' (10,000 pts)", "info"); }}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                            >
                                Select File...
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 p-2 rounded">
                                <FileText className="w-3 h-3" /> prototype_log_v1.csv
                            </div>
                        )}
                    </div>

                    {/* Step 2: Calibrate */}
                    <div className={`p-4 rounded border transition-all ${step === 1 ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Target className={`w-4 h-4 ${step === 1 ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="text-sm font-bold text-slate-200">2. Run Particle Filter</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Execute Bayesian Inference to tune physics parameters.</p>
                        <button
                            onClick={runCalibration}
                            disabled={step !== 1}
                            className={`w-full py-2 rounded text-xs flex items-center justify-center gap-2 transition-all ${step === 1 ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                        >
                            {step === 2 ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            {step === 2 ? 'Calibrating...' : 'Start Calibration'}
                        </button>
                    </div>

                    {/* Parameters Panel */}
                    <div className="bg-black/40 rounded border border-slate-800 p-4">
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Physics Model Parameters</div>

                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-slate-400">R_internal (Ω)</span>
                            <div className="flex items-center gap-2">
                                <span className="line-through text-slate-600 text-xs">0.10</span>
                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                <span className={`font-mono font-bold ${step === 3 ? 'text-green-400' : 'text-cyan-400'}`}>
                                    {calibratedParam.toFixed(3)}
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(calibratedParam / 0.2) * 100}%` }}></div>
                        </div>
                    </div>

                </div>

                {/* Console Log */}
                <div className="flex-1 border-t border-slate-800 bg-black/50 p-2 overflow-hidden flex flex-col">
                    <div className="text-[10px] text-slate-500 font-mono mb-1">CALIBRATION AGENT LOG</div>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1">
                        {logs.map((l, i) => (
                            <div key={i} className="flex gap-2 animate-fade-in">
                                <span className="text-slate-600 shrink-0">{l.time}</span>
                                <span className={l.type === 'success' ? 'text-green-400' : l.type === 'system' ? 'text-purple-400' : 'text-slate-300'}>{l.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col bg-slate-950 relative">

                {/* Header */}
                <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8">
                    <div>
                        <h1 className="text-lg font-bold text-slate-100">Real-to-Sim Calibration Engine</h1>
                        <p className="text-xs text-slate-500">Method: Sequential Monte Carlo (Particle Filters)</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-3 py-1 bg-slate-800 rounded border border-slate-700 text-xs flex flex-col items-center">
                            <span className="text-slate-500 text-[9px] uppercase">Model Fidelity</span>
                            <span className={`font-bold ${step === 3 ? 'text-green-400' : 'text-yellow-500'}`}>
                                {step === 3 ? '98.5% (Calibrated)' : 'Theoretical (Low)'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <div className="flex-1 relative">
                        <CalibrationChart
                            theoretical={theoreticalData}
                            real={realData}
                            particles={particles}
                            currentStep={simIndex}
                        />

                        {/* Overlay Status */}
                        {step === 3 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 border border-green-500/50 p-6 rounded-xl shadow-2xl flex flex-col items-center animate-slide-up">
                                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">Digital Twin Synchronized</h2>
                                <p className="text-slate-400 text-sm text-center mb-4 max-w-xs">
                                    Physics parameters have been updated to match empirical data. Deviation reduced from 15% to 0.4%.
                                </p>
                                <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded text-sm font-bold shadow-lg shadow-green-900/20">
                                    Commit to Layer 5
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}