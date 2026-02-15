import React from 'react';
import {
    Terminal, Database, Cpu, Target, Activity, ShieldCheck, LayoutDashboard,
    ArrowRight, Activity as Pulse
} from 'lucide-react';

const LayerCard = ({ title, desc, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="group relative flex flex-col items-start p-6 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300 text-left w-full h-full"
    >
        <div className={`p-3 rounded-lg bg-slate-950 border border-slate-800 mb-4 group-hover:scale-110 transition-transform ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-cyan-400">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-8">{desc}</p>

        <div className="mt-auto flex items-center gap-2 text-xs font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">
            Launch Layer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Decoration */}
        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
        </div>
    </button>
);

export default function Dashboard({ onNavigate }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 overflow-y-auto">

            {/* Hero Section */}
            <div className="max-w-6xl mx-auto mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
                    <Pulse className="w-3 h-3" /> AUTONOMOUS ENGINEERING PLATFORM
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                    Helix<span className="text-cyan-500">Twin</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    The world's first Generative Systems Engineering environment.
                    Select a layer to begin the autonomous design lifecycle.
                </p>
            </div>

            {/* Grid of Layers */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">

                <LayerCard
                    title="L1: Semantic Intent"
                    desc="Translate natural language requirements into rigorous SysML v2 & ReqIF constraints."
                    icon={Terminal}
                    color="text-purple-400"
                    onClick={() => onNavigate(1)}
                />

                <LayerCard
                    title="L2: Knowledge Helix"
                    desc="GraphRAG engine for zero-hallucination component selection and standards retrieval."
                    icon={Database}
                    color="text-blue-400"
                    onClick={() => onNavigate(2)}
                />

                <LayerCard
                    title="L3: Generative Design"
                    desc="Autonomous ECAD/MCAD layout synthesis with ISO clearance validation."
                    icon={Cpu}
                    color="text-cyan-400"
                    onClick={() => onNavigate(3)}
                />

                <LayerCard
                    title="L4: Calibration Matrix"
                    desc="Bayesian Particle Filters that tune the simulation using physical prototype data."
                    icon={Target}
                    color="text-green-400"
                    onClick={() => onNavigate(4)}
                />

                <LayerCard
                    title="L5: Co-Simulation"
                    desc="Tri-brid engine (Physics + Logic + Bio) for closed-loop validation."
                    icon={Activity}
                    color="text-yellow-400"
                    onClick={() => onNavigate(5)}
                />

                <LayerCard
                    title="L6: Compliance Sentinel"
                    desc="Automated ISO 14971 Risk Analysis and Supply Chain obsolescence checks."
                    icon={ShieldCheck}
                    color="text-red-400"
                    onClick={() => onNavigate(6)}
                />

                <div className="md:col-span-2 lg:col-span-3">
                    <button
                        onClick={() => onNavigate(7)}
                        className="w-full group relative p-8 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all text-left flex items-center justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <LayoutDashboard className="w-6 h-6 text-white" />
                                <h3 className="text-2xl font-bold text-white">L7: Omni-Dashboard</h3>
                            </div>
                            <p className="text-slate-400 max-w-xl">
                                The Master Command Center. Aggregate all layers into a single Asset Administration Shell (AAS) with Time-Travel Debugging.
                            </p>
                        </div>
                        <div className="hidden md:flex h-12 w-12 bg-cyan-600 rounded-full items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-900/50">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
}