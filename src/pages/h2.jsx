import React, { useState, useEffect, useRef } from 'react';
import {
    Database,
    Search,
    Share2,
    Shield,
    AlertTriangle,
    CheckCircle,
    Terminal,
    FileText,
    Cpu,
    Zap,
    ArrowRight,
    RefreshCw,
    Lock,
    Network
} from 'lucide-react';

// --- MOCK KNOWLEDGE GRAPH DATA (The "Truth") ---
const GRAPH_NODES = [
    // Components
    { id: 'C1', label: 'LiPo-3000', type: 'Component', category: 'Power', specs: { voltage: 3.7, capacity_mAh: 3000, discharge_C: 2 }, x: 100, y: 300 },
    { id: 'C2', label: 'LiPo-5000', type: 'Component', category: 'Power', specs: { voltage: 3.7, capacity_mAh: 5000, discharge_C: 5 }, x: 100, y: 150 },
    { id: 'C3', label: 'nRF52840', type: 'Component', category: 'MCU', specs: { voltage: 3.3, current_sleep: '1.5uA' }, x: 400, y: 100 },
    { id: 'C4', label: 'Blower-5V', type: 'Component', category: 'Pneumatic', specs: { voltage: 5.0, flow_max: '20L/min' }, x: 400, y: 300 },

    // Standards
    { id: 'S1', label: 'IEC 62133', type: 'Standard', desc: 'Secondary cells safety', x: 250, y: 50 },
    { id: 'S2', label: 'ISO 14971', type: 'Standard', desc: 'Risk Management', x: 600, y: 50 },
    { id: 'S3', label: 'ISO 80601-2-12', type: 'Standard', desc: 'Ventilator Safety', x: 600, y: 350 },

    // Hazards
    { id: 'H1', label: 'Thermal Runaway', type: 'Hazard', severity: 5, x: 250, y: 400 },
    { id: 'H2', label: 'Air Embolism', type: 'Hazard', severity: 5, x: 700, y: 200 }
];

const GRAPH_EDGES = [
    { source: 'C1', target: 'S1', label: 'COMPLIES_WITH' },
    { source: 'C2', target: 'S1', label: 'COMPLIES_WITH' },
    { source: 'C1', target: 'H1', label: 'HAS_RISK' },
    { source: 'C2', target: 'H1', label: 'HAS_RISK' },
    { source: 'C3', target: 'S2', label: 'REQUIRES' },
    { source: 'C4', target: 'S3', label: 'COMPLIES_WITH' },
    { source: 'C4', target: 'C3', label: 'CONTROLLED_BY' }, // Blower controlled by MCU
    { source: 'S2', target: 'H1', label: 'MITIGATES' }
];

// --- HELPER COMPONENTS ---

const TerminalBlock = ({ logs }) => (
    <div className="bg-black/90 border border-slate-700 rounded-lg p-4 font-mono text-xs md:text-sm h-full overflow-y-auto font-medium shadow-inner">
        {logs.length === 0 && <span className="text-slate-600 italic">System Ready. Waiting for query...</span>}
        {logs.map((log, i) => (
            <div key={i} className={`mb-1 animate-fade-in ${log.type === 'query' ? 'text-cyan-400' :
                    log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                            'text-slate-400'
                }`}>
                <span className="opacity-50 mr-2">{log.ts}</span>
                {log.type === 'query' && <span className="text-purple-400 mr-2">$</span>}
                {log.text}
            </div>
        ))}
        <div className="animate-pulse text-cyan-500 font-bold mt-2">_</div>
    </div>
);

const NodeDetails = ({ node }) => {
    if (!node) return <div className="text-slate-500 text-sm italic text-center mt-10">Select a node to view properties</div>;

    const getIcon = (type) => {
        switch (type) {
            case 'Component': return <Cpu className="w-4 h-4 text-blue-400" />;
            case 'Standard': return <Shield className="w-4 h-4 text-purple-400" />;
            case 'Hazard': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
            default: return <Database className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 animate-slide-in">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                {getIcon(node.type)}
                <span className="font-bold text-white">{node.label}</span>
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 ml-auto">{node.type}</span>
            </div>

            <div className="space-y-2">
                {node.specs && Object.entries(node.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-cyan-300 font-mono">{v}</span>
                    </div>
                ))}
                {node.desc && <p className="text-sm text-slate-300">{node.desc}</p>}
                {node.severity && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Severity (1-5):</span>
                        <span className="text-red-400 font-bold">{node.severity}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-700">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Provenance</span>
                <div className="flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">Verified (Datasheet Ingest)</span>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APPLICATION ---

export default function HelixTwinL2() {
    const [query, setQuery] = useState('');
    const [logs, setLogs] = useState([]);
    const [activeNode, setActiveNode] = useState(null);
    const [highlightedNodes, setHighlightedNodes] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [schemaValid, setSchemaValid] = useState(true);

    // SVG Refs for interactivity
    const svgRef = useRef(null);

    const addLog = (text, type = 'info') => {
        const ts = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, { text, type, ts }]);
    };

    // --- CORE LOGIC: GraphRAG Execution ---

    const executeGraphQuery = (sysmlReq) => {
        setIsProcessing(true);
        setHighlightedNodes([]);
        setActiveNode(null);
        setLogs([]); // Clear logs for new run

        addLog(`Received L1 Requirement: "${sysmlReq}"`, 'system');
        addLog("Generating Cypher Query via LLM...", 'system');

        // Simulate "Thinking" delay
        setTimeout(() => {
            // 1. Generate Cypher (Simulated)
            let cypher = "";
            if (sysmlReq.includes("batteryLife")) {
                cypher = "MATCH (c:Component {category: 'Power'}) WHERE c.specs.capacity_mAh >= 4000 RETURN c";
            } else if (sysmlReq.includes("Ventilator")) {
                cypher = "MATCH (s:Standard) WHERE s.id CONTAINS '80601' RETURN s";
            } else {
                cypher = "MATCH (n) RETURN n LIMIT 5";
            }

            addLog(cypher, 'query');

            // 2. Schema Validation (Safety Step)
            if (cypher.includes("DELETE") || cypher.includes("DROP")) {
                addLog("Security Alert: Malicious Query Detected", 'error');
                setSchemaValid(false);
                setIsProcessing(false);
                return;
            }
            addLog("Schema Validation: PASS", 'success');

            // 3. Execution (Simulated)
            setTimeout(() => {
                // Simple logic to find nodes based on the mock query intent
                let results = [];
                if (cypher.includes("capacity_mAh")) {
                    results = GRAPH_NODES.filter(n => n.category === 'Power' && n.specs && n.specs.capacity_mAh >= 4000);
                } else if (cypher.includes("80601")) {
                    results = GRAPH_NODES.filter(n => n.id === 'S3');
                }

                if (results.length > 0) {
                    setHighlightedNodes(results.map(n => n.id));
                    addLog(`Graph Retrieval: Found ${results.length} matching nodes.`, 'success');
                    setActiveNode(results[0]); // Auto-select first result
                } else {
                    addLog("Graph Retrieval: No matching nodes found.", 'error');
                }
                setIsProcessing(false);
            }, 800);

        }, 1000);
    };

    // Mock Input from L1
    const loadScenario = (type) => {
        if (type === 'battery') {
            setQuery("REQ-PWR-001: batteryLife >= 4 hours (Load ~1A)");
            executeGraphQuery("batteryLife >= 4 hours");
        } else if (type === 'standard') {
            setQuery("REQ-REG-001: Compliance with Ventilator Safety");
            executeGraphQuery("Ventilator Standard");
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* SIDEBAR (Minimal Context) */}
            <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-20">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center mb-4">
                    <Database className="text-white w-6 h-6" />
                </div>
                <div className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer" title="Switch to L1">
                    <FileText className="w-5 h-5" />
                </div>
                <div className="p-2 bg-slate-700 rounded text-cyan-400 cursor-default" title="Current: L2 Knowledge Graph">
                    <Share2 className="w-5 h-5" />
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full">
                {/* HEADER */}
                <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6">
                    <div>
                        <h1 className="font-semibold text-slate-100 flex items-center gap-2">
                            <span className="text-purple-400">Layer 2:</span> Knowledge Helix (GraphRAG)
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-green-900/30 border border-green-800 rounded text-green-400">
                            <Shield className="w-3 h-3" /> Schema Guard: Active
                        </div>
                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-blue-400">
                            <Network className="w-3 h-3" /> Neo4j Connection: Stable
                        </div>
                    </div>
                </header>

                {/* MAIN SPLIT VIEW */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT: GRAPH VISUALIZER */}
                    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">

                        {/* Controls Overlay */}
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <button onClick={() => loadScenario('battery')} className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded border border-slate-700 text-slate-300 flex items-center gap-2 transition-colors shadow-lg">
                                <Zap className="w-3 h-3 text-yellow-400" /> Simulate L1: Find Battery (&gt;4h)
                            </button>
                            <button onClick={() => loadScenario('standard')} className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded border border-slate-700 text-slate-300 flex items-center gap-2 transition-colors shadow-lg">
                                <FileText className="w-3 h-3 text-purple-400" /> Simulate L1: Find Standard
                            </button>
                        </div>

                        {/* Graph Area */}
                        <div className="flex-1 relative cursor-move bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
                            <svg className="w-full h-full" ref={svgRef}>
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                                    </marker>
                                </defs>

                                {/* Render Edges */}
                                {GRAPH_EDGES.map((edge, i) => {
                                    const start = GRAPH_NODES.find(n => n.id === edge.source);
                                    const end = GRAPH_NODES.find(n => n.id === edge.target);
                                    return (
                                        <g key={i}>
                                            <line
                                                x1={start.x} y1={start.y}
                                                x2={end.x} y2={end.y}
                                                stroke="#475569"
                                                strokeWidth="1.5"
                                                markerEnd="url(#arrowhead)"
                                            />
                                            <text
                                                x={(start.x + end.x) / 2}
                                                y={(start.y + end.y) / 2 - 5}
                                                textAnchor="middle"
                                                className="text-[9px] fill-slate-500 font-mono bg-slate-900"
                                            >
                                                {edge.label}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Render Nodes */}
                                {GRAPH_NODES.map((node) => {
                                    const isHighlighed = highlightedNodes.includes(node.id);
                                    const isActive = activeNode?.id === node.id;

                                    return (
                                        <g
                                            key={node.id}
                                            className="cursor-pointer transition-all duration-300"
                                            onClick={() => setActiveNode(node)}
                                        >
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={isActive ? 25 : 20}
                                                fill={node.type === 'Component' ? '#1e40af' : node.type === 'Standard' ? '#581c87' : '#9a3412'}
                                                stroke={isHighlighed ? '#22d3ee' : isActive ? '#fff' : '#334155'}
                                                strokeWidth={isHighlighed ? 3 : 2}
                                                className={`${isHighlighed ? 'animate-pulse' : ''} transition-all`}
                                            />
                                            <text
                                                x={node.x}
                                                y={node.y + 35}
                                                textAnchor="middle"
                                                className={`text-[10px] font-medium pointer-events-none select-none ${isHighlighed ? 'fill-cyan-400' : 'fill-slate-400'}`}
                                            >
                                                {node.label}
                                            </text>
                                            {/* Type Icon (Simplified via circle color for now) */}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Legend */}
                            <div className="absolute bottom-4 right-4 bg-slate-900/80 p-3 rounded border border-slate-800 text-xs">
                                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-blue-800 border border-blue-600"></span> Component</div>
                                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-purple-900 border border-purple-700"></span> Standard</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-900 border border-orange-700"></span> Hazard</div>
                            </div>
                        </div>

                        {/* Bottom Terminal */}
                        <div className="h-48 border-t border-slate-800 bg-slate-925 flex flex-col">
                            <div className="px-4 py-1 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-500 flex justify-between items-center">
                                <span>TERMINAL: Agent-to-Graph Interface</span>
                                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Auto-Scroll</span>
                            </div>
                            <div className="flex-1 p-2">
                                <TerminalBlock logs={logs} />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: INSPECTOR */}
                    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4 text-cyan-400" /> Inspector
                            </h2>
                            <p className="text-xs text-slate-500">
                                Details of the selected node retrieved from the "Truth" source (Datasheet/Standard).
                            </p>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            <NodeDetails node={activeNode} />
                        </div>

                        {/* Status Footer */}
                        <div className="p-4 bg-slate-800/50 border-t border-slate-800">
                            <div className="text-xs font-mono text-slate-500 mb-2">GRAPH STATUS</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-white">4</div>
                                    <div className="text-[10px] text-slate-500">Components</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-white">3</div>
                                    <div className="text-[10px] text-slate-500">Standards</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}