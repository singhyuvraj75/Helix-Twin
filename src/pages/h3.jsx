import React, { useState, useEffect, useRef } from 'react';
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
    Layers,
    Wind
} from 'lucide-react';

// --- MOCK DATA: BOM WITH CONNECTIONS & THERMAL DATA ---
const INITIAL_COMPONENTS = [
    { id: 'MCU', label: 'Nordic nRF52840', width: 60, height: 60, type: 'Logic', power: 0.1, x: 250, y: 200, pins: ['P0.1', 'VDD', 'GND', 'SPI'] },
    { id: 'PWR', label: 'LiPo-5000', width: 100, height: 160, type: 'Power', power: 2.0, x: 100, y: 200, pins: ['VBAT', 'GND'] },
    { id: 'HV', label: 'Mains Converter', width: 80, height: 80, type: 'HighVoltage', power: 5.0, x: 450, y: 150, pins: ['AC_L', 'AC_N', 'VOUT'] },
    { id: 'SEN', label: 'BioSensor AFE', width: 40, height: 40, type: 'Patient', power: 0.05, x: 250, y: 350, pins: ['AIN', 'VREF'] },
    { id: 'USB', label: 'USB-C', width: 40, height: 30, type: 'Connector', power: 0.0, x: 50, y: 200, pins: ['VBUS', 'D+', 'D-'], anchored: true }
];

const NETLIST = [
    { from: 'PWR', to: 'MCU', type: 'power' },
    { from: 'MCU', to: 'SEN', type: 'signal' },
    { from: 'HV', to: 'PWR', type: 'power' }, // Charging path
    { from: 'USB', to: 'PWR', type: 'power' }
];

const ISO_RULES = {
    clearance_hv_patient: 150,
    clearance_hv_logic: 100,
    thermal_limit: 60 // deg C
};

// --- HELPER: MANHATTAN ROUTING VISUALIZER ---
const TracePath = ({ start, end, type, isRouted }) => {
    if (!start || !end) return null;

    // Simple Ratsnest (Straight line)
    if (!isRouted) {
        return (
            <line
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                stroke={type === 'power' ? '#fbbf24' : '#60a5fa'}
                strokeWidth="1"
                strokeDasharray="4 4"
                className="opacity-50"
            />
        );
    }

    // Manhattan Routing (90-degree bends)
    const midX = (start.x + end.x) / 2;
    return (
        <path
            d={`M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`}
            fill="none"
            stroke={type === 'power' ? '#d97706' : '#2563eb'}
            strokeWidth={type === 'power' ? "4" : "2"}
            className="animate-draw-path drop-shadow-md"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
};

// --- HELPER: FIRMWARE CODE GENERATOR ---
const generateFirmware = (comps) => {
    let code = `/* Auto-Generated HAL for Helix-Twin Device */\n#include "helix_core.h"\n\nvoid System_Init() {\n`;

    comps.forEach(c => {
        if (c.id === 'MCU') code += `  // MCU Clock & Power\n  nrf_power_dcdc_mode_set(NRF_POWER_DCDC_ENABLE);\n  sys_clock_init();\n`;
        if (c.id === 'SEN') code += `  // BioSensor SPI Interface\n  spi_init(SPI_INSTANCE_0, PIN_MISO, PIN_MOSI, PIN_SCK);\n  afe_enable();\n`;
        if (c.id === 'HV') code += `  // Mains Detection Interrupt\n  gpio_init(PIN_AC_DETECT, GPIO_IN);\n  irq_enable(AC_DETECT_IRQ);\n`;
    });

    code += `\n  // RTOS Scheduler\n  os_kernel_start();\n}`;
    return code;
};

// --- MAIN APPLICATION ---

export default function HelixTwinL3Advanced() {
    const [activeTab, setActiveTab] = useState('ecad'); // ecad, mcad, firmware
    const [components, setComponents] = useState(INITIAL_COMPONENTS);
    const [logs, setLogs] = useState([]);
    const [isRouted, setIsRouted] = useState(false);
    const [showThermal, setShowThermal] = useState(false);
    const [violations, setViolations] = useState([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [selectedComp, setSelectedComp] = useState(null);

    // --- LOGIC: Constraint Checker ---
    useEffect(() => {
        const checks = [];
        const hv = components.find(c => c.type === 'HighVoltage');
        const patient = components.find(c => c.type === 'Patient');

        if (hv && patient) {
            const dist = Math.hypot(hv.x - patient.x, hv.y - patient.y);
            if (dist < ISO_RULES.clearance_hv_patient) {
                checks.push({ type: 'ISO 60601 Violation', msg: `Creepage distance too low (${Math.round(dist)}px < ${ISO_RULES.clearance_hv_patient}px)`, severity: 'critical' });
            }
        }
        setViolations(checks);
    }, [components]);

    // --- LOGIC: Force-Directed Solver ---
    const autoPlace = () => {
        setIsOptimizing(true);
        addLog("Generative Agent: Solving Topology...", "system");

        let iterations = 0;
        const interval = setInterval(() => {
            setComponents(prev => {
                return prev.map((c, i) => {
                    if (c.anchored) return c; // Don't move USB connectors

                    let forceX = 0;
                    let forceY = 0;

                    // 1. Repulsion (Keep away from others)
                    prev.forEach((other, j) => {
                        if (i === j) return;
                        const dx = c.x - other.x;
                        const dy = c.y - other.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist < 100) {
                            forceX += (dx / dist) * 10;
                            forceY += (dy / dist) * 10;
                        }
                    });

                    // 2. Attraction (Pull connected components closer)
                    NETLIST.forEach(net => {
                        const isSource = net.from === c.id;
                        const isTarget = net.to === c.id;
                        if (isSource || isTarget) {
                            const otherId = isSource ? net.to : net.from;
                            const other = prev.find(p => p.id === otherId);
                            if (other) {
                                const dx = other.x - c.x;
                                const dy = other.y - c.y;
                                forceX += dx * 0.05;
                                forceY += dy * 0.05;
                            }
                        }
                    });

                    // 3. ISO Constraint (Push HV away from Patient)
                    if (c.type === 'Patient') {
                        const hv = prev.find(p => p.type === 'HighVoltage');
                        if (hv) {
                            const dx = c.x - hv.x;
                            const dy = c.y - hv.y;
                            const dist = Math.hypot(dx, dy);
                            if (dist < ISO_RULES.clearance_hv_patient + 20) {
                                forceX += (dx / dist) * 50; // Strong repulsion
                                forceY += (dy / dist) * 50;
                            }
                        }
                    }

                    // Boundary constraints (Keep in box)
                    if (c.x < 50) forceX += 10;
                    if (c.x > 550) forceX -= 10;
                    if (c.y < 50) forceY += 10;
                    if (c.y > 450) forceY -= 10;

                    return { ...c, x: c.x + forceX, y: c.y + forceY };
                });
            });

            iterations++;
            if (iterations > 30) {
                clearInterval(interval);
                setIsOptimizing(false);
                addLog("Optimization Complete: Topology Converged.", "success");
            }
        }, 50);
    };

    const addLog = (msg, type) => {
        setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString([], { hour12: false }) }, ...prev]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* LEFT SIDEBAR: CONTROLS & LOGS */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-2xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                        <Layers className="w-6 h-6" /> Helix-Twin
                    </div>
                    <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Layer 3: Generative Core</div>
                </div>

                {/* DOMAIN SWITCHER */}
                <div className="grid grid-cols-3 gap-1 p-2 bg-slate-800/50 m-4 rounded-lg">
                    {['ecad', 'mcad', 'firmware'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setActiveTab(mode)}
                            className={`py-2 text-xs font-bold uppercase rounded transition-all ${activeTab === mode ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {/* CONTROLS AREA */}
                <div className="px-4 pb-4 space-y-4 flex-1 overflow-y-auto">

                    {/* ECAD TOOLS */}
                    {activeTab === 'ecad' && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="text-xs font-bold text-slate-500 uppercase">Layout Synthesis</div>
                            <button
                                onClick={autoPlace}
                                disabled={isOptimizing}
                                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 p-3 rounded flex items-center justify-between text-sm transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                                    <span>Optimize Placement</span>
                                </div>
                                {isOptimizing && <span className="text-[10px] text-cyan-400 font-mono">SOLVING...</span>}
                            </button>

                            <button
                                onClick={() => { setIsRouted(!isRouted); addLog(isRouted ? "Traces Rip-up Complete" : "Auto-Router: 4 Nets Routed", "info"); }}
                                className={`w-full border p-3 rounded flex items-center justify-between text-sm transition-all ${isRouted ? 'bg-blue-900/30 border-blue-500/50 text-blue-300' : 'bg-slate-700 hover:bg-slate-600 border-slate-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    <span>{isRouted ? 'Rip-up Traces' : 'Auto-Route Traces'}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowThermal(!showThermal)}
                                className={`w-full border p-3 rounded flex items-center justify-between text-sm transition-all ${showThermal ? 'bg-orange-900/30 border-orange-500/50 text-orange-300' : 'bg-slate-700 hover:bg-slate-600 border-slate-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Thermometer className="w-4 h-4" />
                                    <span>Thermal Analysis</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* MCAD TOOLS */}
                    {activeTab === 'mcad' && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="p-3 bg-slate-800 rounded border border-slate-700">
                                <div className="text-xs text-slate-400 mb-2">Enclosure Parameters</div>
                                <div className="flex justify-between text-sm mb-1"><span>Material:</span> <span className="text-white">ABS (Medical Grade)</span></div>
                                <div className="flex justify-between text-sm mb-1"><span>IP Rating:</span> <span className="text-white">IP54</span></div>
                                <div className="flex justify-between text-sm"><span>Wall Thickness:</span> <span className="text-white">2.5mm</span></div>
                            </div>
                            <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-900/20">
                                <Box className="w-4 h-4" /> Generate 3D STEP File
                            </button>
                        </div>
                    )}

                    {/* VIOLATION REPORT */}
                    <div className="mt-6">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                            Design Rules Check (DRC)
                            <span className={violations.length ? "text-red-400" : "text-green-400"}>{violations.length ? "FAIL" : "PASS"}</span>
                        </div>
                        {violations.length === 0 ? (
                            <div className="bg-green-900/10 border border-green-800/30 p-3 rounded text-green-400 text-xs flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> All constraints met.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {violations.map((v, i) => (
                                    <div key={i} className="bg-red-900/20 border border-red-500/30 p-3 rounded text-red-200 text-xs">
                                        <div className="flex items-center gap-2 font-bold text-red-400 mb-1">
                                            <AlertTriangle className="w-3 h-3" /> {v.type}
                                        </div>
                                        {v.msg}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SYSTEM LOGS */}
                    <div className="flex-1 min-h-[150px] bg-black/40 rounded border border-slate-800 p-2 overflow-hidden flex flex-col">
                        <div className="text-[10px] text-slate-500 font-mono mb-1 border-b border-slate-800 pb-1">AGENT LOGS</div>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1">
                            {logs.map((l, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-slate-600 shrink-0">{l.time}</span>
                                    <span className={l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-green-400' : 'text-slate-300'}>{l.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* MAIN VISUALIZATION CANVAS */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">

                {/* Top Info Bar */}
                <div className="h-12 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-1"><Grid className="w-3 h-3" /> Grid: 10mm</div>
                        <div className="flex items-center gap-1"><Zap className="w-3 h-3" /> Power Est: 7.15W</div>
                    </div>
                    {activeTab === 'firmware' && (
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white flex items-center gap-2 border border-slate-700">
                            <Download className="w-3 h-3" /> Export HAL
                        </button>
                    )}
                </div>

                {/* Canvas Content */}
                <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-auto flex items-center justify-center p-8">

                    {/* VIEW: FIRMWARE CODE */}
                    {activeTab === 'firmware' && (
                        <div className="w-[600px] h-[500px] bg-[#1e1e1e] rounded-lg border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                            <div className="bg-[#2d2d2d] px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
                                <Code className="w-4 h-4" /> generated_hal.c
                            </div>
                            <pre className="p-4 font-mono text-xs text-blue-300 overflow-auto">
                                {generateFirmware(components)}
                            </pre>
                        </div>
                    )}

                    {/* VIEW: ECAD / MCAD */}
                    {(activeTab === 'ecad' || activeTab === 'mcad') && (
                        <div className={`relative w-[600px] h-[500px] bg-slate-900 border-2 ${violations.length ? 'border-red-900' : 'border-slate-700'} rounded-xl shadow-2xl transition-all`}>

                            {/* BOARD LABEL */}
                            <div className="absolute -top-6 left-0 text-xs font-mono text-slate-500">PCB: REVISION A.3</div>

                            {/* MCAD: ENCLOSURE GHOSTING */}
                            {activeTab === 'mcad' && (
                                <div className="absolute -inset-4 border-4 border-slate-600/30 rounded-[20px] bg-slate-800/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-30">
                                    <div className="absolute top-0 right-0 p-2">
                                        <Wind className="w-6 h-6 text-slate-500/50" />
                                    </div>
                                    <div className="text-slate-500/20 font-bold text-6xl uppercase transform -rotate-12">Enclosure</div>
                                </div>
                            )}

                            {/* RENDER CONNECTIONS */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                {NETLIST.map((net, i) => {
                                    const start = components.find(c => c.id === net.from);
                                    const end = components.find(c => c.id === net.to);
                                    return <TracePath key={i} start={start} end={end} type={net.type} isRouted={isRouted} />;
                                })}
                            </svg>

                            {/* RENDER COMPONENTS */}
                            {components.map(comp => (
                                <div
                                    key={comp.id}
                                    className={`absolute transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing flex flex-col items-center justify-center
                        ${showThermal && comp.power > 1.0 ? 'bg-red-900/40 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'bg-slate-800 border-slate-600 shadow-lg'}
                        border rounded-sm z-10 group hover:border-cyan-500
                      `}
                                    style={{
                                        width: comp.width,
                                        height: comp.height,
                                        left: comp.x,
                                        top: comp.y,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    onMouseDown={() => setSelectedComp(comp)}
                                >
                                    {/* Thermal Badge */}
                                    {showThermal && comp.power > 0.5 && (
                                        <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[9px] px-1 rounded-full border border-black z-20">
                                            {comp.power}W
                                        </div>
                                    )}

                                    {/* Component Body */}
                                    <div className="w-full h-full relative overflow-hidden">
                                        {/* Chip Legs/Pins Visuals */}
                                        <div className="absolute inset-x-0 -top-1 h-1 flex justify-between px-2"><div className="w-1 h-2 bg-slate-400"></div><div className="w-1 h-2 bg-slate-400"></div></div>
                                        <div className="absolute inset-x-0 -bottom-1 h-1 flex justify-between px-2"><div className="w-1 h-2 bg-slate-400"></div><div className="w-1 h-2 bg-slate-400"></div></div>

                                        <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                                            {comp.type === 'HighVoltage' ? <Zap className="w-5 h-5 text-orange-400 mb-1" /> : <Cpu className="w-5 h-5 text-slate-500 mb-1" />}
                                            <span className="text-[10px] font-bold text-slate-200 leading-none">{comp.id}</span>
                                            <span className="text-[8px] text-slate-500 mt-1">{comp.label}</span>
                                        </div>
                                    </div>

                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                        Type: {comp.type} | Voltage: {comp.type === 'HighVoltage' ? '240V' : '3.3V'}
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}

                    {/* View Legend Overlay */}
                    <div className="absolute bottom-6 right-6 flex gap-4 text-[10px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded border border-slate-800 backdrop-blur">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Power Trace</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Signal Trace</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Thermal Hotspot</div>
                    </div>

                </div>
            </div>
        </div>
    );
}