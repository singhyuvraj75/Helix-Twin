import React, { useState, useEffect, useRef } from 'react';
import {
    Cpu,
    Activity,
    Database,
    Wind,
    Zap,
    FileText,
    Terminal,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    Code,
    Layers,
    Play,
    Save,
    Search,
    Settings,
    ShieldCheck,
    Microscope,
    Menu,
    X
} from 'lucide-react';

// --- MOCK KNOWLEDGE BASE (Layer 2 stub for L1 referencing) ---
const KNOWLEDGE_GRAPH_STUB = {
    standards: {
        "ventilator": ["ISO 80601-2-12", "IEC 60601-1-8", "ISO 14971"],
        "infusion_pump": ["IEC 60601-2-24", "ISO 14971"],
        "cgm": ["ISO 15197", "IEC 60601-1-11"]
    },
    components: {
        "battery": { standard: "IEC 62133", param: "capacity_Ah" },
        "enclosure": { standard: "IEC 60529", param: "ip_rating" }
    }
};

// --- HELPER COMPONENTS ---

const TerminalLine = ({ text, type = 'info', delay = 0 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!visible) return null;

    const colors = {
        info: 'text-cyan-400',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        system: 'text-slate-400'
    };

    return (
        <div className={`font-mono text-xs md:text-sm mb-1 ${colors[type]} flex items-start animate-fade-in`}>
            <span className="mr-2 opacity-50">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span>{text}</span>
        </div>
    );
};

const SysMLBlock = ({ code }) => (
    <div className="bg-[#1e1e1e] border border-slate-700 rounded-lg p-4 font-mono text-sm overflow-x-auto relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="bg-slate-700 hover:bg-slate-600 text-xs px-2 py-1 rounded text-white" onClick={() => navigator.clipboard.writeText(code)}>
                Copy
            </button>
        </div>
        <pre>
            <code className="language-sysml text-blue-300">
                {code.split('\n').map((line, i) => (
                    <div key={i} className="table-row">
                        <span className="table-cell select-none text-slate-600 text-right pr-4 w-8">{i + 1}</span>
                        <span className="table-cell">{line}</span>
                    </div>
                ))}
            </code>
        </pre>
    </div>
);

const RequirementCard = ({ req }) => (
    <div className="bg-slate-800/50 border-l-4 border-cyan-500 p-3 mb-2 rounded-r flex justify-between items-start animate-slide-in">
        <div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400">{req.id}</span>
                <span className="text-xs bg-slate-700 px-1.5 rounded text-slate-300">{req.type}</span>
            </div>
            <p className="text-sm text-slate-200 mt-1">{req.text}</p>
            <div className="mt-2 flex gap-2">
                {req.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 border border-blue-800 rounded">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
        <div className="flex flex-col items-end">
            {req.verified ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
                <div className="flex items-center gap-1 text-yellow-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px]">Pending GraphRAG</span>
                </div>
            )}
        </div>
    </div>
);

// --- MAIN APPLICATION ---

export default function HelixTwinL1() {
    const [activeTab, setActiveTab] = useState('intent');
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [generatedReqs, setGeneratedReqs] = useState([]);
    const [sysmlCode, setSysmlCode] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Simulated Agent Logic (The "Brain" of Layer 1)
    const processIntent = async () => {
        if (!userInput.trim()) return;

        setIsProcessing(true);
        setLogs([]);
        setGeneratedReqs([]);
        setSysmlCode('');

        // Step 1: Ingestion
        addLog("Helix-Twin Semantic Engine Initialized...", 'system', 0);
        addLog(`Ingesting User Intent: "${userInput.substring(0, 40)}..."`, 'info', 500);

        // Step 2: Entity Recognition (Simulated)
        setTimeout(() => {
            addLog("NLP: Performing Named Entity Recognition (NER)...", 'system');

            let deviceType = "GenericMedicalDevice";
            let standardRef = "ISO 13485";

            // Heuristic Keyword Matching
            if (userInput.toLowerCase().includes("ventilator")) {
                deviceType = "VentilatorSystem";
                standardRef = "ISO 80601-2-12";
                addLog("Identified System of Interest: VENTILATOR (Class IIb/III)", 'success');
                addLog(`Mapping Regulatory Context: ${standardRef}`, 'warning');
            } else if (userInput.toLowerCase().includes("cgm") || userInput.toLowerCase().includes("glucose")) {
                deviceType = "ContinuousGlucoseMonitor";
                standardRef = "ISO 15197";
                addLog("Identified System of Interest: CGM (Class IIa)", 'success');
            }

            // Step 3: Constraint Extraction
            addLog("Extracting Functional Constraints...", 'info');
            const reqs = [];
            let sysmlProps = [];
            let counter = 1;

            // Battery Logic
            const battMatch = userInput.match(/(\d+)\s*(hour|h|hr|day|d)/i);
            if (battMatch) {
                const val = battMatch[1];
                const unit = battMatch[2].startsWith('d') ? 'd' : 'h';
                const reqId = `REQ-PWR-${String(counter++).padStart(3, '0')}`;
                reqs.push({
                    id: reqId,
                    type: 'Functional',
                    text: `The system shall operate for a minimum of ${val}${unit} on internal battery power.`,
                    tags: ['Power', 'IEC 62133'],
                    verified: false
                });
                sysmlProps.push(`    attribute batteryLife: Time >= ${val} [${unit}];`);
                addLog(`Constraint Extracted: Battery Life >= ${val}${unit}`, 'success');
            }

            // Weight Logic
            const weightMatch = userInput.match(/(\d+)\s*(kg|g|lb)/i);
            if (weightMatch) {
                const val = weightMatch[1];
                const unit = weightMatch[2];
                const reqId = `REQ-MECH-${String(counter++).padStart(3, '0')}`;
                reqs.push({
                    id: reqId,
                    type: 'Physical',
                    text: `The total system mass shall not exceed ${val}${unit}.`,
                    tags: ['Mechanical', 'Usability'],
                    verified: false
                });
                sysmlProps.push(`    attribute totalMass: Mass <= ${val} [${unit}];`);
                addLog(`Constraint Extracted: Max Weight <= ${val}${unit}`, 'success');
            }

            // Default Regulatory Req
            reqs.push({
                id: `REQ-REG-${String(counter++).padStart(3, '0')}`,
                type: 'Regulatory',
                text: `The system shall comply with ${standardRef} basic safety and essential performance requirements.`,
                tags: ['Compliance', standardRef],
                verified: true
            });

            setGeneratedReqs(reqs);

            // Step 4: SysML v2 Generation
            setTimeout(() => {
                addLog("Generating SysML v2 Architecture...", 'system');
                const code = `package ${deviceType}Model {
  import ISQ::*;
  import ${standardRef.replace(/[\s-]/g, '_')}::*;

  requirement def SystemRequirements {
    doc /* Auto-generated from Natural Language Intent */
${reqs.map(r => `    /* ${r.id}: ${r.text} */`).join('\n')}
  }

  part def ${deviceType} {
    // Extracted Parametric Constraints
${sysmlProps.join('\n')}
    
    // Default Subsystems based on Ontology
    part powerSubsystem: PowerUnit;
    part controlUnit: ProcessingUnit;
    ${deviceType.includes('Ventilator') ? 'part pneumaticUnit: PneumaticAssembly;' : ''}
    ${deviceType.includes('Glucose') ? 'part sensorUnit: BioSensor;' : ''}
  }
}`;
                setSysmlCode(code);
                setIsProcessing(false);
                addLog("Layer 1 Processing Complete. Ready for GraphRAG (Layer 2).", 'success');
            }, 1000);

        }, 1500);
    };

    const addLog = (text, type, delay = 0) => {
        setLogs(prev => [...prev, { text, type, delay }]);
    };

    // Preset Prompts
    const loadPrompt = (type) => {
        if (type === 'ventilator') {
            setUserInput("Design a portable emergency ventilator compliant with ISO 80601-2-12. It must have a battery life of at least 4 hours and weigh less than 5kg for transport.");
        } else if (type === 'cgm') {
            setUserInput("I need a wearable Continuous Glucose Monitor (CGM) that lasts 14 days on a coin cell battery. It must be water resistant (IPX7) and use Bluetooth LE.");
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* SIDEBAR NAVIGATION */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20`}>
                <div className="p-4 flex items-center justify-between border-b border-slate-800">
                    {isSidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                                <Activity className="text-white w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Helix<span className="text-cyan-400">Twin</span></span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
                        {isSidebarOpen ? <Menu className="w-5 h-5" /> : <Menu className="w-5 h-5 mx-auto" />}
                    </button>
                </div>

                <nav className="flex-1 py-4 space-y-1">
                    <NavItem icon={Terminal} label="L1: Intent Engine" active={true} expanded={isSidebarOpen} />
                    <NavItem icon={Database} label="L2: Knowledge Helix" active={false} expanded={isSidebarOpen} />
                    <NavItem icon={Cpu} label="L3: Generative Core" active={false} expanded={isSidebarOpen} />
                    <NavItem icon={Settings} label="L4: Calibration" active={false} expanded={isSidebarOpen} />
                    <NavItem icon={Play} label="L5: Simulation" active={false} expanded={isSidebarOpen} />
                    <NavItem icon={ShieldCheck} label="L6: Compliance" active={false} expanded={isSidebarOpen} />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    {isSidebarOpen ? (
                        <div className="text-xs text-slate-500">
                            <p>System Status: <span className="text-green-400">Online</span></p>
                            <p>Model: Llama-3-70b-Instruct</p>
                            <p>Graph: Neo4j (Connected)</p>
                        </div>
                    ) : (
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse"></div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* HEADER */}
                <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs border border-cyan-500/20 font-mono">LAYER 1</span>
                        <h1 className="font-semibold text-slate-100">Semantic Intent & Requirement Decomposition</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                            <Save className="w-4 h-4" /> Save Session
                        </button>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold border border-blue-400">
                            AE
                        </div>
                    </div>
                </header>

                {/* WORKSPACE GRID */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* LEFT PANEL: INPUT & CONVERSATION */}
                    <div className="w-full md:w-1/2 flex flex-col border-r border-slate-800 bg-slate-925">
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700 shadow-xl mb-6">
                                <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                                    <Microscope className="w-5 h-5 text-cyan-400" />
                                    Engineering Objective
                                </h2>
                                <p className="text-slate-400 text-sm mb-4">
                                    Describe the system you wish to design. Include functional constraints (battery life, weight), clinical goals, and target compliance standards.
                                </p>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-none h-32"
                                    placeholder="E.g., Design a portable ventilator with >4h battery life..."
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                />

                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => loadPrompt('ventilator')} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full transition-colors">
                                            Example: Ventilator
                                        </button>
                                        <button onClick={() => loadPrompt('cgm')} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full transition-colors">
                                            Example: CGM
                                        </button>
                                    </div>
                                    <button
                                        onClick={processIntent}
                                        disabled={isProcessing || !userInput}
                                        className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${isProcessing || !userInput ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20'}`}
                                    >
                                        {isProcessing ? (
                                            <>Processing <span className="animate-spin">⟳</span></>
                                        ) : (
                                            <>Initialize Agent <ChevronRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* AGENT LOGS (Traceability) */}
                            <div className="bg-black/40 rounded-lg border border-slate-800 p-4 font-mono h-[calc(100%-16rem)] overflow-y-auto">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agent Logic Trace</span>
                                    <span className="text-[10px] text-slate-600">ID: TRACE-{Math.floor(Math.random() * 10000)}</span>
                                </div>
                                {logs.length === 0 && (
                                    <div className="text-slate-600 text-sm text-center mt-10 italic">
                                        Waiting for input... System Standby.
                                    </div>
                                )}
                                {logs.map((log, idx) => (
                                    <TerminalLine key={idx} text={log.text} type={log.type} delay={log.delay * idx} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: GENERATED ARTIFACTS */}
                    <div className="w-full md:w-1/2 flex flex-col bg-slate-900">
                        {/* TABS */}
                        <div className="flex border-b border-slate-800">
                            <TabButton active={activeTab === 'intent'} onClick={() => setActiveTab('intent')} icon={FileText} label="Requirements (ReqIF)" />
                            <TabButton active={activeTab === 'sysml'} onClick={() => setActiveTab('sysml')} icon={Code} label="SysML v2 Architecture" />
                            <TabButton active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} icon={Database} label="Knowledge Context" />
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50">
                            {activeTab === 'intent' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-semibold text-slate-300">Decomposed Requirements</h3>
                                        <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-800">Format: ReqIF/JSON</span>
                                    </div>

                                    {generatedReqs.length > 0 ? (
                                        generatedReqs.map((req, i) => (
                                            <RequirementCard key={i} req={req} />
                                        ))
                                    ) : (
                                        <EmptyState text="No requirements generated yet. Run the agent to decompose intent." />
                                    )}
                                </div>
                            )}

                            {activeTab === 'sysml' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-semibold text-slate-300">Generated System Model</h3>
                                        <div className="flex gap-2">
                                            <span className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Syntax Valid</span>
                                        </div>
                                    </div>
                                    {sysmlCode ? (
                                        <SysMLBlock code={sysmlCode} />
                                    ) : (
                                        <EmptyState text="Waiting for constraints to generate SysML v2 structure." />
                                    )}
                                    {sysmlCode && (
                                        <div className="mt-4 p-3 bg-blue-900/10 border border-blue-900/30 rounded text-xs text-blue-300">
                                            <strong>Next Step:</strong> This architecture block will be passed to Layer 3 (Hardware Agent) to resolve the 'PowerUnit' and 'PneumaticAssembly' parts into actual BOM items via GraphRAG.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'graph' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Regulatory & Ontology Context (Layer 2 Preview)</h3>
                                    <div className="bg-slate-800 rounded border border-slate-700 p-4">
                                        <p className="text-xs text-slate-400 mb-4">The Semantic Engine retrieves these contexts to ground the requirements.</p>

                                        <div className="space-y-4">
                                            <div className="border-l-2 border-purple-500 pl-3">
                                                <div className="text-xs font-bold text-purple-400 uppercase mb-1">Standard Cluster</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['ISO 13485 (Quality)', 'ISO 14971 (Risk)', 'IEC 60601-1 (Safety)', 'ISO 62366 (Usability)'].map(s => (
                                                        <div key={s} className="bg-purple-900/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-800/50">{s}</div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-l-2 border-emerald-500 pl-3">
                                                <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Domain Ontology</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                                        <div className="text-xs text-slate-500">Component</div>
                                                        <div className="text-sm text-slate-200">Battery_LiIon</div>
                                                    </div>
                                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                                        <div className="text-xs text-slate-500">Property</div>
                                                        <div className="text-sm text-slate-200">Nominal_Voltage</div>
                                                    </div>
                                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                                        <div className="text-xs text-slate-500">Constraint</div>
                                                        <div className="text-sm text-slate-200">Discharge_Rate</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function NavItem({ icon: Icon, label, active, expanded }) {
    return (
        <div className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-cyan-900/20 border-r-2 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <Icon className="w-5 h-5 min-w-[20px]" />
            {expanded && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all">{label}</span>}
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${active ? 'border-cyan-500 text-cyan-400 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function EmptyState({ text }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Layers className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm max-w-[200px] text-center">{text}</p>
        </div>
    );
}