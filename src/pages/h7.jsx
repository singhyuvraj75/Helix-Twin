import React, { useState, useEffect } from 'react';
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
    Maximize,
    FileText,
    Share2
} from 'lucide-react';

// --- MOCK AAS HIERARCHY (Asset Administration Shell) ---
const AAS_TREE = {
    id: 'ROOT', label: 'Ventilator_Helix_V1', type: 'System', status: 'WARNING', children: [
        {
            id: 'SUB-1', label: 'Pneumatic_Unit', type: 'Subsystem', status: 'PASS', children: [
                { id: 'CMP-1', label: 'Turbine_Blower', type: 'Component', status: 'PASS', val: '12,000 RPM' },
                { id: 'CMP-2', label: 'Flow_Sensor', type: 'Component', status: 'PASS', val: '45 L/min' }
            ]
        },
        {
            id: 'SUB-2', label: 'Power_Unit', type: 'Subsystem', status: 'WARNING', children: [
                { id: 'CMP-3', label: 'LiPo_Battery_Pack', type: 'Component', status: 'WARNING', val: '14.2 V', alert: 'High Internal Resistance' },
                { id: 'CMP-4', label: 'BMS_Circuit', type: 'Component', status: 'PASS', val: 'Active' }
            ]
        },
        {
            id: 'SUB-3', label: 'Control_Unit', type: 'Subsystem', status: 'PASS', children: [
                { id: 'CMP-5', label: 'nRF52840_MCU', type: 'Component', status: 'PASS', val: 'Sleep Mode' }
            ]
        }
    ]
};

// --- MOCK TIME-SERIES DATA (For Time Travel) ---
const generateHistory = () => {
    const data = [];
    for (let i = 0; i < 600; i++) { // 60 seconds of data
        data.push({
            t: i / 10,
            pressure: 20 + Math.sin(i / 10) * 5,
            flow: 30 + Math.cos(i / 10) * 10,
            voltage: 16 - (i / 600) * 2 // Dropping voltage
        });
    }
    return data;
};

// --- HELPER: RECURSIVE TREE COMPONENT ---
const TreeItem = ({ node, depth = 0, onSelect, selectedId }) => {
    const [expanded, setExpanded] = useState(true);
    const isSelected = selectedId === node.id;

    return (
        <div className="select-none">
            <div
                onClick={() => onSelect(node)}
                className={`flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors ${isSelected ? 'bg-cyan-900/30 border-r-2 border-cyan-400' : 'hover:bg-slate-800'}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className={`p-0.5 rounded hover:bg-slate-700 ${!node.children ? 'invisible' : ''}`}
                >
                    {expanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                </button>

                {node.status === 'PASS' && <CheckCircle className="w-3 h-3 text-green-500" />}
                {node.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-yellow-500 animate-pulse" />}
                {node.status === 'FAIL' && <AlertTriangle className="w-3 h-3 text-red-500" />}

                <span className={`text-xs font-mono ${isSelected ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>{node.label}</span>
            </div>

            {expanded && node.children && (
                <div>
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
    const [selectedNode, setSelectedNode] = useState(AAS_TREE);
    const [historyData, setHistoryData] = useState([]);
    const [playbackTime, setPlaybackTime] = useState(60); // Current "Time" in seconds (end of log)
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setHistoryData(generateHistory());
    }, []);

    // Playback Logic
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setPlaybackTime(prev => (prev >= 60 ? 0 : prev + 0.1));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Get data at current scrubber time
    const currentSnapshot = historyData[Math.floor(playbackTime * 10)] || {};

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* LEFT: HIERARCHY NAVIGATOR (AAS) */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
                <div className="p-4 border-b border-slate-800 bg-slate-925">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                        <LayoutDashboard className="w-5 h-5" /> Helix-Twin
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">Omni-Dashboard (L7)</div>
                </div>

                <div className="p-2 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                        <input type="text" placeholder="Search AAS ID..." className="w-full bg-slate-800 border border-slate-700 rounded pl-7 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    <TreeItem node={AAS_TREE} onSelect={setSelectedNode} selectedId={selectedNode?.id} />
                </div>

                {/* System Health Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">Overall System Health</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[85%] h-full bg-yellow-500"></div>
                        </div>
                        <span className="text-xs font-bold text-yellow-500">85%</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                        1 Critical Warning (Power Subsystem)
                    </div>
                </div>
            </div>

            {/* CENTER: TWIN VISUALIZATION & TIME TRAVEL */}
            <div className="flex-1 flex flex-col bg-slate-950 relative">

                {/* Top Bar */}
                <div className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6">
                    <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        {selectedNode.type} View: <span className="text-cyan-400">{selectedNode.label}</span>
                    </h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-900/30 text-blue-300 border border-blue-800 rounded text-xs flex items-center gap-2 hover:bg-blue-900/50">
                            <Share2 className="w-3 h-3" /> Share Digital Thread
                        </button>
                        <button className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded text-xs flex items-center gap-2 hover:bg-slate-700">
                            <FileText className="w-3 h-3" /> Generate Report
                        </button>
                    </div>
                </div>

                {/* Visualization Area (3D/2D Placeholder) */}
                <div className="flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] relative overflow-hidden flex items-center justify-center">

                    {/* The "Twin" Representation */}
                    <div className="relative w-96 h-96 border-2 border-slate-700 rounded-full bg-slate-900 shadow-2xl flex items-center justify-center animate-float">
                        <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-ping-slow"></div>

                        {/* Central Icon based on Selection */}
                        {selectedNode.label.includes('Battery') ? (
                            <Zap className="w-24 h-24 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                        ) : selectedNode.label.includes('Turbine') ? (
                            <Wind className="w-24 h-24 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        ) : (
                            <Activity className="w-24 h-24 text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                        )}

                        {/* Data Floating Badges */}
                        {selectedNode.val && (
                            <div className="absolute -top-4 bg-slate-800 border border-slate-600 px-3 py-1 rounded-full text-xs font-mono text-white shadow-lg">
                                {selectedNode.val}
                            </div>
                        )}
                        {selectedNode.alert && (
                            <div className="absolute -bottom-4 bg-red-900/80 border border-red-500 px-3 py-1 rounded text-xs font-bold text-red-200 shadow-lg flex items-center gap-2 animate-bounce">
                                <AlertTriangle className="w-3 h-3" /> {selectedNode.alert}
                            </div>
                        )}
                    </div>
                </div>

                {/* Time Travel Scrubber */}
                <div className="h-32 bg-slate-900 border-t border-slate-800 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white transition-colors"
                            >
                                {isPlaying ? <div className="w-2 h-2 bg-white rounded-sm" /> : <div className="ml-0.5 w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent" />}
                            </button>
                            <div className="text-xs font-mono text-cyan-400">
                                T - {Math.abs(60 - playbackTime).toFixed(2)}s
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Time-Travel Debugger</div>
                    </div>

                    {/* Scrubber Track */}
                    <div className="relative h-12 bg-slate-950 rounded border border-slate-800 overflow-hidden cursor-crosshair group">
                        {/* Waveform Visualization (Mock) */}
                        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
                            <path d="M0,24 Q50,5 100,24 T200,24 T300,40 T400,10 T500,24 T600,24" fill="none" stroke="#22d3ee" strokeWidth="2" />
                        </svg>

                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ left: `${(playbackTime / 60) * 100}%` }}
                        >
                            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"></div>
                        </div>

                        <input
                            type="range"
                            min="0" max="60" step="0.1"
                            value={playbackTime}
                            onChange={(e) => { setIsPlaying(false); setPlaybackTime(parseFloat(e.target.value)); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT: INSPECTOR PANEL */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-20">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Live Telemetry</h2>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">

                    {/* Context Aware Panels */}
                    <div className="bg-slate-800 rounded p-4 border border-slate-700">
                        <div className="text-[10px] text-slate-400 mb-1">Pressure (L5 Simulation)</div>
                        <div className="text-2xl font-mono text-cyan-400">{currentSnapshot.pressure?.toFixed(1)} <span className="text-sm text-slate-500">cmH2O</span></div>
                    </div>

                    <div className="bg-slate-800 rounded p-4 border border-slate-700">
                        <div className="text-[10px] text-slate-400 mb-1">Flow Rate (L5 Simulation)</div>
                        <div className="text-2xl font-mono text-green-400">{currentSnapshot.flow?.toFixed(1)} <span className="text-sm text-slate-500">L/min</span></div>
                    </div>

                    <div className="bg-slate-800 rounded p-4 border border-slate-700">
                        <div className="text-[10px] text-slate-400 mb-1">Battery Voltage (L4 Calibration)</div>
                        <div className="text-2xl font-mono text-yellow-400">{currentSnapshot.voltage?.toFixed(2)} <span className="text-sm text-slate-500">V</span></div>
                        <div className="w-full bg-slate-900 h-1 mt-2 rounded overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{ width: `${(currentSnapshot.voltage / 16) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Drill Down Actions */}
                    <div className="mt-8">
                        <div className="text-[10px] text-slate-500 uppercase mb-2">Deep Dive Actions</div>
                        <button className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 mb-2 flex justify-between items-center transition-colors">
                            Open Datasheet (PDF) <ChevronRight className="w-3 h-3" />
                        </button>
                        <button className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 mb-2 flex justify-between items-center transition-colors">
                            View Source Code (L3) <ChevronRight className="w-3 h-3" />
                        </button>
                        <button className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex justify-between items-center transition-colors">
                            Check Compliance (L6) <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
}